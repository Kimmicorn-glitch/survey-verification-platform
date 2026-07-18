package com.backofficepro.surveyplatform.nft.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when an NFT is minted on the blockchain.
 *
 * @author BackOffice Pro
 */
public class NftMintedEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "NFT_MINTED";

    private final String tokenId;
    private final String contractAddress;
    private final String network;
    private final String ownerAddress;
    private final String surveyId;

    public NftMintedEvent(final String nftId, final String tokenId,
                          final String contractAddress, final String network,
                          final String ownerAddress, final String surveyId) {
        super(EVENT_TYPE, nftId);
        this.tokenId = tokenId;
        this.contractAddress = contractAddress;
        this.network = network;
        this.ownerAddress = ownerAddress;
        this.surveyId = surveyId;
    }

    public String getTokenId() {
        return tokenId;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public String getNetwork() {
        return network;
    }

    public String getOwnerAddress() {
        return ownerAddress;
    }

    public String getSurveyId() {
        return surveyId;
    }
}
