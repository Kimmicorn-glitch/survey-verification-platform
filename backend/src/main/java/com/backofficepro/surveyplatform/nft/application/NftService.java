package com.backofficepro.surveyplatform.nft.application;

import com.backofficepro.surveyplatform.nft.application.dto.request.MintNftRequest;
import com.backofficepro.surveyplatform.nft.domain.NftToken;
import com.backofficepro.surveyplatform.nft.domain.repository.NftTokenRepository;
import com.backofficepro.surveyplatform.nft.domain.valueobject.BlockchainNetwork;
import com.backofficepro.surveyplatform.shared.domain.event.DomainEventPublisher;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Application service implementing NFT use cases.
 *
 * @author BackOffice Pro
 */
@Service
@Transactional
public class NftService {

    private static final Logger log = LoggerFactory.getLogger(NftService.class);

    private final NftTokenRepository nftTokenRepository;
    private final DomainEventPublisher eventPublisher;

    public NftService(final NftTokenRepository nftTokenRepository,
                      final DomainEventPublisher eventPublisher) {
        this.nftTokenRepository = nftTokenRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Requests minting of a new NFT for survey verification.
     *
     * @param request the mint request
     * @param userId  the requesting user identifier
     * @return the created pre-mint NFT token
     */
    public NftToken requestMint(final MintNftRequest request, final String userId) {
        log.info("Requesting NFT mint for survey {} by user {}",
                request.getSurveyId(), userId);

        final BlockchainNetwork network = BlockchainNetwork.of(request.getNetwork());
        final NftToken token = NftToken.create(
                request.getName(),
                request.getDescription(),
                request.getSurveyId(),
                request.getVerificationId(),
                request.getOwnerAddress(),
                network);

        if (request.getMetadataUri() != null) {
            token.setMetadataUri(request.getMetadataUri());
        }

        final NftToken saved = nftTokenRepository.save(token);
        log.info("Pre-mint NFT token created with id {}", saved.getId());
        return saved;
    }

    /**
     * Retrieves an NFT by its identifier.
     *
     * @param tokenId the NFT identifier
     * @return the NFT token
     */
    @Transactional(readOnly = true)
    public NftToken getNft(final UUID tokenId) {
        return nftTokenRepository.findById(tokenId)
                .orElseThrow(() -> new EntityNotFoundException("NftToken", tokenId.toString()));
    }

    /**
     * Retrieves an NFT by its verification identifier.
     *
     * @param verificationId the verification identifier
     * @return the NFT token
     */
    @Transactional(readOnly = true)
    public NftToken getNftByVerificationId(final String verificationId) {
        return nftTokenRepository.findByVerificationId(verificationId)
                .orElseThrow(() -> new EntityNotFoundException("NftToken", verificationId));
    }

    /**
     * Lists NFTs for a specific respondent.
     *
     * @param respondentId the respondent identifier
     * @param pageable     the pagination parameters
     * @return a page of NFT tokens
     */
    @Transactional(readOnly = true)
    public Page<NftToken> getNftsByRespondent(final String respondentId, final Pageable pageable) {
        return nftTokenRepository.findByRespondentId(respondentId, pageable);
    }

    /**
     * Lists NFTs owned by a specific user.
     *
     * @param userId   the user identifier
     * @param pageable the pagination parameters
     * @return a page of NFT tokens
     */
    @Transactional(readOnly = true)
    public Page<NftToken> getMyNfts(final String userId, final Pageable pageable) {
        return nftTokenRepository.findByOwnerAddress(userId, pageable);
    }

    /**
     * Updates the metadata URI for an NFT.
     *
     * @param tokenId  the NFT identifier
     * @param metadata the new metadata URI
     * @return the updated NFT token
     */
    public NftToken updateNftMetadata(final UUID tokenId, final String metadata) {
        final NftToken token = getNft(tokenId);
        token.setMetadataUri(metadata);
        final NftToken saved = nftTokenRepository.save(token);
        log.info("NFT metadata updated for token {}", tokenId);
        return saved;
    }

    /**
     * Marks an NFT as minted on the blockchain.
     *
     * @param tokenId         the NFT identifier
     * @param txHash          the blockchain transaction hash
     * @param contractAddress the smart contract address
     * @param gasUsed         the gas used for the transaction
     * @return the updated NFT token
     */
    public NftToken markAsMinted(final UUID tokenId, final String txHash,
                                  final String contractAddress, final Long gasUsed) {
        final NftToken token = getNft(tokenId);
        token.mint(String.valueOf(tokenId), contractAddress, token.getMetadataUri());
        final NftToken saved = nftTokenRepository.save(token);
        publishEvents(saved);
        log.info("NFT {} marked as minted with txHash {}", tokenId, txHash);
        return saved;
    }

    /**
     * Transfers an NFT to a new owner address.
     *
     * @param tokenId  the NFT identifier
     * @param toAddress the recipient blockchain address
     * @return the updated NFT token
     */
    public NftToken transferNft(final UUID tokenId, final String toAddress) {
        final NftToken token = getNft(tokenId);
        token.transfer(toAddress);
        final NftToken saved = nftTokenRepository.save(token);
        publishEvents(saved);
        log.info("NFT {} transferred to {}", tokenId, toAddress);
        return saved;
    }

    /**
     * Returns NFT statistics for a respondent.
     *
     * @param respondentId the respondent identifier
     * @return the NFT statistics
     */
    @Transactional(readOnly = true)
    public NftStats getNftStats(final String respondentId) {
        final List<NftToken> tokens = nftTokenRepository.findByRespondentId(
                respondentId, Pageable.unpaged()).getContent();

        final long total = tokens.size();
        final long minted = tokens.stream().filter(NftToken::isMinted).count();
        final long transferred = tokens.stream()
                .filter(t -> t.getTransferredAt() != null).count();

        return new NftStats(total, minted, transferred);
    }

    private void publishEvents(final NftToken token) {
        for (final var event : token.getDomainEvents()) {
            eventPublisher.publish(event);
        }
        token.clearDomainEvents();
    }

    /**
     * NFT statistics record.
     */
    public record NftStats(long totalNfts, long mintedNfts, long transferredNfts) {
    }
}
