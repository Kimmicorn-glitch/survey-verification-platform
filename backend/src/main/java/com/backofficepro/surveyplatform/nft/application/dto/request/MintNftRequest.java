package com.backofficepro.surveyplatform.nft.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Request DTO for minting an NFT.
 *
 * @author BackOffice Pro
 */
@Data
public class MintNftRequest {

    @NotBlank(message = "Survey ID is required")
    private String surveyId;

    private String verificationId;

    @NotBlank(message = "Name is required")
    private String name;

    private String description;

    @NotBlank(message = "Network is required")
    private String network;

    @NotBlank(message = "Owner address is required")
    private String ownerAddress;

    private String metadataUri;
}
