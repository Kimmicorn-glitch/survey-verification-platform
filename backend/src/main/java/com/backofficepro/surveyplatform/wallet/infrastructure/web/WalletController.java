package com.backofficepro.surveyplatform.wallet.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.wallet.application.WalletService;
import com.backofficepro.surveyplatform.wallet.domain.WalletConnection;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * REST controller for wallet connection operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/wallets")
@Tag(name = "Wallets", description = "Wallet connection management endpoints")
public class WalletController {

    private final WalletService walletService;

    public WalletController(final WalletService walletService) {
        this.walletService = walletService;
    }

    /**
     * Connects a wallet for the current user.
     *
     * @param request        the connect request
     * @param authentication the authenticated user
     * @return the created wallet connection
     */
    @PostMapping("/connect")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Connect wallet", description = "Connects a blockchain wallet for the current user")
    public ResponseEntity<ApiResponse<WalletConnection>> connectWallet(
            @Valid @RequestBody final ConnectWalletRequest request,
            final Authentication authentication) {
        final WalletConnection connection = walletService.connectWallet(
                authentication.getName(),
                request.getWalletAddress(),
                request.getChainId(),
                request.getChainName(),
                request.getWalletType());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(connection, "Wallet connected successfully"));
    }

    /**
     * Disconnects a wallet for the current user.
     *
     * @param request        the disconnect request
     * @param authentication the authenticated user
     * @return confirmation message
     */
    @DeleteMapping("/disconnect")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Disconnect wallet", description = "Disconnects a blockchain wallet for the current user")
    public ResponseEntity<ApiResponse<Void>> disconnectWallet(
            @Valid @RequestBody final DisconnectWalletRequest request,
            final Authentication authentication) {
        walletService.disconnectWallet(authentication.getName(), request.getWalletAddress());
        return ResponseEntity.ok(ApiResponse.success(null, "Wallet disconnected successfully"));
    }

    /**
     * Lists all wallets for the current user.
     *
     * @param authentication the authenticated user
     * @return list of wallet connections
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "List wallets", description = "Lists all wallet connections for the current user")
    public ResponseEntity<ApiResponse<List<WalletConnection>>> getWallets(
            final Authentication authentication) {
        final List<WalletConnection> wallets = walletService.getWallets(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(wallets));
    }

    /**
     * Sets a wallet as the primary wallet.
     *
     * @param address        the wallet address
     * @param authentication the authenticated user
     * @return the updated wallet connection
     */
    @PutMapping("/{address}/primary")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Set primary wallet", description = "Sets a wallet as the primary wallet for the user")
    public ResponseEntity<ApiResponse<WalletConnection>> setPrimaryWallet(
            @PathVariable final String address,
            final Authentication authentication) {
        final WalletConnection connection = walletService.setPrimaryWallet(
                authentication.getName(), address);
        return ResponseEntity.ok(ApiResponse.success(connection, "Primary wallet updated"));
    }

    /**
     * Verifies wallet ownership via signature.
     *
     * @param request the verification request
     * @return verification result
     */
    @PostMapping("/verify")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Verify wallet ownership", description = "Verifies wallet ownership via cryptographic signature")
    public ResponseEntity<ApiResponse<Boolean>> verifyWallet(
            @Valid @RequestBody final VerifyWalletRequest request,
            final Authentication authentication) {
        final boolean verified = walletService.verifyWalletOwnership(
                authentication.getName(),
                request.getWalletAddress(),
                request.getSignature());
        return ResponseEntity.ok(ApiResponse.success(verified,
                verified ? "Wallet ownership verified" : "Wallet ownership verification failed"));
    }

    /**
     * Request DTO for connecting a wallet.
     */
    public static class ConnectWalletRequest {

        @NotBlank(message = "Wallet address is required")
        private String walletAddress;

        @jakarta.validation.constraints.NotNull(message = "Chain ID is required")
        private Integer chainId;

        @NotBlank(message = "Chain name is required")
        private String chainName;

        @NotBlank(message = "Wallet type is required")
        private String walletType;

        public String getWalletAddress() {
            return walletAddress;
        }

        public void setWalletAddress(final String walletAddress) {
            this.walletAddress = walletAddress;
        }

        public Integer getChainId() {
            return chainId;
        }

        public void setChainId(final Integer chainId) {
            this.chainId = chainId;
        }

        public String getChainName() {
            return chainName;
        }

        public void setChainName(final String chainName) {
            this.chainName = chainName;
        }

        public String getWalletType() {
            return walletType;
        }

        public void setWalletType(final String walletType) {
            this.walletType = walletType;
        }
    }

    /**
     * Request DTO for disconnecting a wallet.
     */
    public static class DisconnectWalletRequest {

        @NotBlank(message = "Wallet address is required")
        private String walletAddress;

        public String getWalletAddress() {
            return walletAddress;
        }

        public void setWalletAddress(final String walletAddress) {
            this.walletAddress = walletAddress;
        }
    }

    /**
     * Request DTO for verifying wallet ownership.
     */
    public static class VerifyWalletRequest {

        @NotBlank(message = "Wallet address is required")
        private String walletAddress;

        @NotBlank(message = "Signature is required")
        private String signature;

        public String getWalletAddress() {
            return walletAddress;
        }

        public void setWalletAddress(final String walletAddress) {
            this.walletAddress = walletAddress;
        }

        public String getSignature() {
            return signature;
        }

        public void setSignature(final String signature) {
            this.signature = signature;
        }
    }
}
