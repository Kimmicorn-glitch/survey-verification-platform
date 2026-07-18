// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title DRRTGovernance - DAO Governance for Survey Verification Platform
/// @author BackOffice Pro
/// @notice Proposal submission, token-weighted voting, parameter updates,
///         and timelock execution for decentralized protocol governance.
/// @dev Designed for future DRRT token governance. Uses a timelock to
///      allow the community to review proposals before execution.
contract DRRTGovernance is AccessControl, ReentrancyGuard {

    // ─── Roles ─────────────────────────────────────────────────

    bytes32 public constant PROPOSER_ROLE   = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE   = keccak256("EXECUTOR_ROLE");
    bytes32 public constant ADMIN_ROLE      = keccak256("ADMIN_ROLE");

    // ─── Structs ───────────────────────────────────────────────

    /// @notice A governance proposal
    struct Proposal {
        uint256 id;
        address proposer;
        string  title;
        string  description;
        bytes   callData;           // Encoded function call for execution
        address targetContract;     // Contract to call if executed
        uint256 forVotes;           // Weighted votes in favor
        uint256 againstVotes;       // Weighted votes against
        uint256 abstainVotes;       // Weighted abstentions
        uint256 startBlock;         // Block voting starts
        uint256 endBlock;           // Block voting ends
        uint256 executionTime;      // Earliest time for execution (after timelock)
        ProposalState state;
        uint256 quorumRequired;     // Minimum votes needed
    }

    /// @notice Proposal lifecycle states
    enum ProposalState {
        Pending,
        Active,
        Canceled,
        Defeated,
        Succeeded,
        Queued,
        Expired,
        Executed
    }

    /// @notice A single vote record
    struct Vote {
        address voter;
        uint256 weight;        // Token balance at vote time
        bool    support;       // true = for, false = against
        uint256 timestamp;
    }

    // ─── Events ────────────────────────────────────────────────

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        string  title,
        uint256 startBlock,
        uint256 endBlock
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool    support,
        uint256 weight
    );

    event ProposalQueued(uint256 indexed proposalId, uint256 executionTime);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCanceled(uint256 indexed proposalId);

    // ─── Errors ────────────────────────────────────────────────

    error InvalidProposal();
    error AlreadyVoted();
    error VotingClosed();
    error NotQueued();
    error TimelockNotReady();
    error ProposalExpired();
    error InsufficientQuorum();
    error NoVotingPower();

    // ─── Storage ───────────────────────────────────────────────

    /// @dev proposalId => Proposal
    mapping(uint256 => Proposal) private _proposals;

    /// @dev proposalId => voter => Vote
    mapping(uint256 => mapping(address => Vote)) private _votes;

    /// @dev proposalId => voter voted flag
    mapping(uint256 => mapping(address => bool)) private _hasVoted;

    /// @dev Proposal counter
    uint256 private _proposalCount;

    /// @dev Voting delay: blocks before voting starts
    uint256 public votingDelay;

    /// @dev Voting period: blocks for voting
    uint256 public votingPeriod;

    /// @dev Timelock delay in seconds after proposal succeeds
    uint256 public timelockDelay;

    /// @dev Proposal expiry after queuing (seconds)
    uint256 public proposalExpiry;

    /// @dev Quorum: minimum total votes needed (weight)
    uint256 public quorumVotes;

    /// @dev Proposal threshold: minimum tokens to create proposal
    uint256 public proposalThreshold;

    /// @dev Target contract that holds voting power
    address public votingToken;

    // ─── Constructor ───────────────────────────────────────────

    /// @param admin           Initial admin
    /// @param votingToken_    ERC-20 token used for voting power
    /// @param votingDelay_    Blocks before voting starts
    /// @param votingPeriod_   Blocks for voting duration
    /// @param timelockDelay_  Seconds after success before execution
    /// @param quorumVotes_    Minimum total votes for quorum
    /// @param proposalThresh_ Minimum tokens to propose
    constructor(
        address admin,
        address votingToken_,
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 timelockDelay_,
        uint256 quorumVotes_,
        uint256 proposalThresh_
    ) {
        if (admin == address(0)) revert InvalidProposal();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);

        votingToken = votingToken_;
        votingDelay = votingDelay_;
        votingPeriod = votingPeriod_;
        timelockDelay = timelockDelay_;
        quorumVotes = quorumVotes_;
        proposalThreshold = proposalThresh_;
        proposalExpiry = 14 days;
    }

    // ─── Modifiers ─────────────────────────────────────────────

    modifier onlyProposer() {
        if (!hasRole(PROPOSER_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!hasRole(ADMIN_ROLE, msg.sender)) revert NotAuthorized();
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        if (_proposals[proposalId].proposer == address(0)) revert InvalidProposal();
        _;
    }

    // ─── Core: Proposal Creation ───────────────────────────────

    /// @notice Submit a new governance proposal
    /// @param title           Short title
    /// @param description     Detailed description
    /// @param callData        ABI-encoded function call
    /// @param targetContract  Contract to execute against
    function createProposal(
        string calldata title,
        string calldata description,
        bytes calldata callData,
        address targetContract
    )
        external
        nonReentrant
        returns (uint256 proposalId)
    {
        if (!hasRole(PROPOSER_ROLE, msg.sender) && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();

        proposalId = ++_proposalCount;

        uint256 startBlock = block.number + votingDelay;
        uint256 endBlock = startBlock + votingPeriod;

        _proposals[proposalId] = Proposal({
            id: proposalId,
            proposer: msg.sender,
            title: title,
            description: description,
            callData: callData,
            targetContract: targetContract,
            forVotes: 0,
            againstVotes: 0,
            abstainVotes: 0,
            startBlock: startBlock,
            endBlock: endBlock,
            executionTime: 0,
            state: ProposalState.Pending,
            quorumRequired: quorumVotes
        });

        emit ProposalCreated(proposalId, msg.sender, title, startBlock, endBlock);
    }

    // ─── Core: Voting ──────────────────────────────────────────

    /// @notice Cast a vote on a proposal
    /// @param proposalId Proposal to vote on
    /// @param support    true = for, false = against
    function castVote(uint256 proposalId, bool support)
        external
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage proposal = _proposals[proposalId];

        if (block.number < proposal.startBlock || block.number > proposal.endBlock)
            revert VotingClosed();

        if (_hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 weight = _getVotingPower(msg.sender);
        if (weight == 0) revert NoVotingPower();

        _hasVoted[proposalId][msg.sender] = true;

        _votes[proposalId][msg.sender] = Vote({
            voter: msg.sender,
            weight: weight,
            support: support,
            timestamp: block.timestamp
        });

        if (support) {
            proposal.forVotes += weight;
        } else {
            proposal.againstVotes += weight;
        }

        proposal.state = ProposalState.Active;

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    /// @notice Cast a vote with abstention
    /// @param proposalId Proposal to vote on
    function castAbstain(uint256 proposalId)
        external
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage proposal = _proposals[proposalId];

        if (block.number < proposal.startBlock || block.number > proposal.endBlock)
            revert VotingClosed();

        if (_hasVoted[proposalId][msg.sender]) revert AlreadyVoted();

        uint256 weight = _getVotingPower(msg.sender);
        if (weight == 0) revert NoVotingPower();

        _hasVoted[proposalId][msg.sender] = true;

        proposal.abstainVotes += weight;

        proposal.state = ProposalState.Active;
    }

    // ─── Core: Queue & Execute ─────────────────────────────────

    /// @notice Queue a succeeded proposal for timelock
    /// @param proposalId Succeeded proposal to queue
    function queueProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
    {
        Proposal storage proposal = _proposals[proposalId];

        if (proposal.state != ProposalState.Succeeded) revert InvalidProposal();
        if (proposal.forVotes <= proposal.againstVotes) revert InsufficientQuorum();
        if (proposal.forVotes < proposal.quorumRequired) revert InsufficientQuorum();

        proposal.state = ProposalState.Queued;
        proposal.executionTime = block.timestamp + timelockDelay;

        emit ProposalQueued(proposalId, proposal.executionTime);
    }

    /// @notice Execute a queued proposal after timelock
    /// @param proposalId Queued proposal to execute
    function executeProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
        nonReentrant
    {
        Proposal storage proposal = _proposals[proposalId];

        if (proposal.state != ProposalState.Queued) revert NotQueued();
        if (block.timestamp < proposal.executionTime) revert TimelockNotReady();
        if (block.timestamp > proposal.executionTime + proposalExpiry) revert ProposalExpired();

        proposal.state = ProposalState.Executed;

        // Execute the call
        if (proposal.targetContract != address(0) && proposal.callData.length > 0) {
            (bool success, ) = proposal.targetContract.call(proposal.callData);
            require(success, "Governance: execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    /// @notice Cancel a proposal (proposer or admin)
    /// @param proposalId Proposal to cancel
    function cancelProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
    {
        Proposal storage proposal = _proposals[proposalId];
        if (msg.sender != proposal.proposer && !hasRole(ADMIN_ROLE, msg.sender))
            revert NotAuthorized();

        if (proposal.state == ProposalState.Executed) revert InvalidProposal();

        proposal.state = ProposalState.Canceled;

        emit ProposalCanceled(proposalId);
    }

    // ─── Views ─────────────────────────────────────────────────

    /// @notice Get full proposal details
    function getProposal(uint256 proposalId)
        external view proposalExists(proposalId)
        returns (Proposal memory)
    {
        return _proposals[proposalId];
    }

    /// @notice Get the current state of a proposal (auto-resolves)
    function proposalState(uint256 proposalId)
        external view proposalExists(proposalId)
        returns (ProposalState)
    {
        Proposal memory p = _proposals[proposalId];

        if (p.state == ProposalState.Canceled) return ProposalState.Canceled;
        if (p.state == ProposalState.Executed) return ProposalState.Executed;
        if (p.state == ProposalState.Queued) {
            if (block.timestamp > p.executionTime + proposalExpiry) return ProposalState.Expired;
            return ProposalState.Queued;
        }

        if (block.number < p.startBlock) return ProposalState.Pending;

        if (block.number > p.endBlock) {
            if (p.forVotes > p.againstVotes && p.forVotes >= p.quorumRequired) {
                return ProposalState.Succeeded;
            }
            return ProposalState.Defeated;
        }

        return ProposalState.Active;
    }

    /// @notice Get a voter's vote on a proposal
    function getVote(uint256 proposalId, address voter)
        external view returns (Vote memory)
    {
        return _votes[proposalId][voter];
    }

    /// @notice Check if an address has voted
    function hasVoted(uint256 proposalId, address voter) external view returns (bool) {
        return _hasVoted[proposalId][voter];
    }

    /// @notice Total number of proposals
    function proposalCount() external view returns (uint256) {
        return _proposalCount;
    }

    /// @notice Get voting power for an address
    /// @dev In production, queries the votingToken ERC-20 balance
    function _getVotingPower(address account) internal view returns (uint256) {
        if (votingToken == address(0)) return 0;

        (bool success, bytes memory data) = votingToken.staticcall(
            abi.encodeWithSignature("balanceOf(address)", account)
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (uint256));
        }
        return 0;
    }

    // ─── Admin ─────────────────────────────────────────────────

    /// @notice Update governance parameters
    function setGovernanceParameters(
        uint256 votingDelay_,
        uint256 votingPeriod_,
        uint256 timelockDelay_,
        uint256 quorumVotes_,
        uint256 proposalThreshold_,
        uint256 proposalExpiry_
    ) external onlyAdmin {
        votingDelay = votingDelay_;
        votingPeriod = votingPeriod_;
        timelockDelay = timelockDelay_;
        quorumVotes = quorumVotes_;
        proposalThreshold = proposalThreshold_;
        proposalExpiry = proposalExpiry_;
    }

    /// @notice Grant proposer role
    function grantRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(role, account);
    }

    /// @notice Revoke proposer role
    function revokeRole(bytes32 role, address account) public override(AccessControl) {
        _checkRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _revokeRole(role, account);
    }
}
