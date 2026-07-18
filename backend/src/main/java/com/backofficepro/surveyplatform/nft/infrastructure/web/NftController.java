package com.backofficepro.surveyplatform.nft.infrastructure.web;

import com.backofficepro.surveyplatform.nft.application.NftService;
import com.backofficepro.surveyplatform.nft.application.dto.request.MintNftRequest;
import com.backofficepro.surveyplatform.nft.domain.NftToken;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for NFT operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/nfts")
@Tag(name = "NFTs", description = "NFT minting and management endpoints")
public class NftController {

    private final NftService nftService;

    public NftController(final NftService nftService) {
        this.nftService = nftService;
    }

    /**
     * Requests minting of a new NFT.
     *
     * @param request        the mint request
     * @param authentication the authenticated user
     * @return the created pre-mint NFT token
     */
    @PostMapping("/mint")
    @Operation(summary = "Request NFT mint", description = "Creates a pre-mint NFT token for survey verification")
    public ResponseEntity<ApiResponse<NftToken>> requestMint(
            @Valid @RequestBody final MintNftRequest request,
            final Authentication authentication) {
        final NftToken token = nftService.requestMint(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(token, "NFT mint requested successfully"));
    }

    /**
     * Lists all NFTs with pagination.
     *
     * @param page the page number
     * @param size the page size
     * @return paginated NFT list
     */
    @GetMapping
    @Operation(summary = "List all NFTs", description = "Lists all NFTs with pagination")
    public ResponseEntity<ApiResponse<PaginatedResponse<NftToken>>> listNfts(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<NftToken> tokens = nftService.getMyNfts(null, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(tokens)));
    }

    /**
     * Lists NFTs owned by the current user.
     *
     * @param page the page number
     * @param size the page size
     * @return paginated NFT list for the current user
     */
    @GetMapping("/my")
    @Operation(summary = "List my NFTs", description = "Lists NFTs owned by the current user")
    public ResponseEntity<ApiResponse<PaginatedResponse<NftToken>>> getMyNfts(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size,
            final Authentication authentication) {
        final Page<NftToken> tokens = nftService.getMyNfts(
                authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(tokens)));
    }

    /**
     * Gets an NFT by its identifier.
     *
     * @param id the NFT identifier
     * @return the NFT details
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get NFT", description = "Retrieves NFT details by identifier")
    public ResponseEntity<ApiResponse<NftToken>> getNft(@PathVariable final UUID id) {
        final NftToken token = nftService.getNft(id);
        return ResponseEntity.ok(ApiResponse.success(token));
    }

    /**
     * Gets an NFT by its verification identifier.
     *
     * @param verificationId the verification identifier
     * @return the NFT details
     */
    @GetMapping("/verification/{verificationId}")
    @Operation(summary = "Get NFT by verification", description = "Retrieves NFT by verification identifier")
    public ResponseEntity<ApiResponse<NftToken>> getNftByVerification(
            @PathVariable final String verificationId) {
        final NftToken token = nftService.getNftByVerificationId(verificationId);
        return ResponseEntity.ok(ApiResponse.success(token));
    }

    /**
     * Lists NFTs for a specific respondent.
     *
     * @param respondentId the respondent identifier
     * @param page         the page number
     * @param size         the page size
     * @return paginated NFT list
     */
    @GetMapping("/respondent/{respondentId}")
    @Operation(summary = "Get NFTs by respondent", description = "Lists NFTs for a specific respondent")
    public ResponseEntity<ApiResponse<PaginatedResponse<NftToken>>> getNftsByRespondent(
            @PathVariable final String respondentId,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<NftToken> tokens = nftService.getNftsByRespondent(
                respondentId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(tokens)));
    }

    /**
     * Transfers an NFT to a new owner.
     *
     * @param id      the NFT identifier
     * @param request the transfer request containing the recipient address
     * @return the updated NFT
     */
    @PostMapping("/{id}/transfer")
    @Operation(summary = "Transfer NFT", description = "Transfers an NFT to a new owner address")
    public ResponseEntity<ApiResponse<NftToken>> transferNft(
            @PathVariable final UUID id,
            @RequestBody final TransferNftRequest request) {
        final NftToken token = nftService.transferNft(id, request.getToAddress());
        return ResponseEntity.ok(ApiResponse.success(token, "NFT transferred successfully"));
    }

    /**
     * Request DTO for NFT transfer.
     */
    public static class TransferNftRequest {

        @jakarta.validation.constraints.NotBlank(message = "Recipient address is required")
        private String toAddress;

        public String getToAddress() {
            return toAddress;
        }

        public void setToAddress(final String toAddress) {
            this.toAddress = toAddress;
        }
    }
}
