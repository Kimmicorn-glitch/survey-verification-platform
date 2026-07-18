package com.backofficepro.surveyplatform.nft.domain;

import com.backofficepro.surveyplatform.nft.domain.event.NftMintedEvent;
import com.backofficepro.surveyplatform.nft.domain.event.NftTransferredEvent;
import com.backofficepro.surveyplatform.nft.domain.valueobject.BlockchainNetwork;
import com.backofficepro.surveyplatform.shared.domain.AggregateRoot;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * NFT Token aggregate representing a non-fungible token for survey verification.
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "nft_tokens", schema = "nft")
public class NftToken extends AggregateRoot {

    @Column(name = "token_id", nullable = false, length = 100)
    private String tokenId;

    @Column(name = "contract_address", nullable = false, length = 100)
    private String contractAddress;

    @Column(name = "network", nullable = false, length = 30)
    private String network;

    @Column(name = "owner_address", nullable = false, length = 100)
    private String ownerAddress;

    @Column(name = "creator_address", nullable = false, length = 100)
    private String creatorAddress;

    @Column(name = "survey_id", nullable = false)
    private String surveyId;

    @Column(name = "verification_id")
    private String verificationId;

    @Column(name = "metadata_uri", length = 500)
    private String metadataUri;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "token_standard", nullable = false, length = 10)
    private String tokenStandard;

    @Column(name = "minted_at")
    private LocalDateTime mintedAt;

    @Column(name = "transferred_at")
    private LocalDateTime transferredAt;

    @Column(name = "is_minted", nullable = false)
    private boolean minted;

    protected NftToken() {
        super();
    }

    /**
     * Creates a new NFT token definition (before minting).
     *
     * @param name           the token name
     * @param description    the token description
     * @param surveyId       the associated survey
     * @param verificationId the associated verification
     * @param creatorAddress the creator's blockchain address
     * @param network        the target blockchain network
     * @return the new NftToken aggregate
     */
    public static NftToken create(final String name,
                                  final String description,
                                  final String surveyId,
                                  final String verificationId,
                                  final String creatorAddress,
                                  final BlockchainNetwork network) {
        if (name == null || name.isBlank()) {
            throw new BusinessRuleValidationException(
                    "NftNameRequired", "NFT name must not be blank");
        }
        final NftToken token = new NftToken();
        token.name = name;
        token.description = description;
        token.surveyId = surveyId;
        token.verificationId = verificationId;
        token.creatorAddress = creatorAddress;
        token.ownerAddress = creatorAddress;
        token.network = network.getName();
        token.tokenStandard = "ERC-721";
        token.minted = false;
        return token;
    }

    /**
     * Mints the NFT on the blockchain.
     *
     * @param tokenId        the blockchain token ID
     * @param contractAddress the deployed contract address
     * @param metadataUri    the metadata URI
     */
    public void mint(final String tokenId, final String contractAddress, final String metadataUri) {
        if (this.minted) {
            throw new BusinessRuleValidationException(
                    "AlreadyMinted", "NFT has already been minted");
        }
        this.tokenId = tokenId;
        this.contractAddress = contractAddress;
        this.metadataUri = metadataUri;
        this.minted = true;
        this.mintedAt = LocalDateTime.now();
        registerEvent(new NftMintedEvent(
                getId().toString(), tokenId, contractAddress,
                network, ownerAddress, surveyId));
    }

    /**
     * Transfers the NFT to a new owner.
     *
     * @param newOwnerAddress the new owner's blockchain address
     */
    public void transfer(final String newOwnerAddress) {
        if (!this.minted) {
            throw new BusinessRuleValidationException(
                    "NotMinted", "Cannot transfer an unminted NFT");
        }
        final String previousOwner = this.ownerAddress;
        this.ownerAddress = newOwnerAddress;
        this.transferredAt = LocalDateTime.now();
        registerEvent(new NftTransferredEvent(
                getId().toString(), tokenId, previousOwner, newOwnerAddress, network));
    }

    /**
     * Sets the metadata URI.
     *
     * @param metadataUri the IPFS or Arweave metadata URI
     */
    public void setMetadataUri(final String metadataUri) {
        this.metadataUri = metadataUri;
    }
}
