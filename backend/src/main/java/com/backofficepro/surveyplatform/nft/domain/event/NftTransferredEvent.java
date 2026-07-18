package com.backofficepro.surveyplatform.nft.domain.event;

import com.backofficepro.surveyplatform.shared.domain.event.DomainEvent;

/**
 * Domain event published when an NFT is transferred to a new owner.
 *
 * @author BackOffice Pro
 */
public class NftTransferredEvent extends DomainEvent {

    private static final long serialVersionUID = 1L;
    public static final String EVENT_TYPE = "NFT_TRANSFERRED";

    private final String tokenId;
    private final String previousOwner;
    private final String newOwner;
    private final String network;

    public NftTransferredEvent(final String nftId, final String tokenId,
                               final String previousOwner, final String newOwner,
                               final String network) {
        super(EVENT_TYPE, nftId);
        this.tokenId = tokenId;
        this.previousOwner = previousOwner;
        this.newOwner = newOwner;
        this.network = network;
    }

    public String getTokenId() {
        return tokenId;
    }

    public String getPreviousOwner() {
        return previousOwner;
    }

    public String getNewOwner() {
        return newOwner;
    }

    public String getNetwork() {
        return network;
    }
}
