package com.backofficepro.surveyplatform.wallet.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.wallet.domain.WalletConnection;
import com.backofficepro.surveyplatform.wallet.domain.repository.WalletConnectionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;

/**
 * Application service implementing wallet connection use cases.
 *
 * @author BackOffice Pro
 */
@Service
@Transactional
public class WalletService {

    private static final Logger log = LoggerFactory.getLogger(WalletService.class);

    private final WalletConnectionRepository walletConnectionRepository;

    public WalletService(final WalletConnectionRepository walletConnectionRepository) {
        this.walletConnectionRepository = walletConnectionRepository;
    }

    /**
     * Connects a wallet for a user.
     *
     * @param userId         the user identifier
     * @param walletAddress  the wallet blockchain address
     * @param chainId        the chain identifier
     * @param chainName      the chain name
     * @param walletType     the wallet type (METAMASK, WALLETCONNECT, COINBASE)
     * @return the created wallet connection
     */
    public WalletConnection connectWallet(final String userId,
                                          final String walletAddress,
                                          final Integer chainId,
                                          final String chainName,
                                          final String walletType) {
        log.info("Connecting wallet {} for user {} on chain {}", walletAddress, userId, chainName);

        if (walletConnectionRepository.existsByWalletAddressAndUserId(walletAddress, userId)) {
            final WalletConnection existing = walletConnectionRepository
                    .findByWalletAddress(walletAddress)
                    .orElseThrow(() -> new EntityNotFoundException("WalletConnection", walletAddress));
            existing.touchLastConnected();
            return walletConnectionRepository.save(existing);
        }

        final WalletConnection connection = WalletConnection.create(
                userId, walletAddress, chainId, chainName, walletType);

        final boolean isFirstWallet = walletConnectionRepository.findByUserId(userId).isEmpty();
        if (isFirstWallet) {
            connection.markAsPrimary();
        }

        final WalletConnection saved = walletConnectionRepository.save(connection);
        log.info("Wallet connected with id {}", saved.getId());
        return saved;
    }

    /**
     * Disconnects a wallet for a user.
     *
     * @param userId         the user identifier
     * @param walletAddress  the wallet blockchain address
     */
    public void disconnectWallet(final String userId, final String walletAddress) {
        log.info("Disconnecting wallet {} for user {}", walletAddress, userId);

        final WalletConnection connection = walletConnectionRepository
                .findByWalletAddress(walletAddress)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("WalletConnection", walletAddress));

        walletConnectionRepository.delete(connection);
        log.info("Wallet {} disconnected for user {}", walletAddress, userId);
    }

    /**
     * Lists all wallet connections for a user.
     *
     * @param userId the user identifier
     * @return list of wallet connections
     */
    @Transactional(readOnly = true)
    public List<WalletConnection> getWallets(final String userId) {
        return walletConnectionRepository.findByUserId(userId);
    }

    /**
     * Gets the primary wallet for a user.
     *
     * @param userId the user identifier
     * @return the primary wallet connection
     */
    @Transactional(readOnly = true)
    public WalletConnection getPrimaryWallet(final String userId) {
        return walletConnectionRepository.findByUserIdAndIsPrimaryTrue(userId)
                .orElseThrow(() -> new EntityNotFoundException("PrimaryWallet", userId));
    }

    /**
     * Sets a wallet as the primary wallet for a user.
     *
     * @param userId         the user identifier
     * @param walletAddress  the wallet address to set as primary
     * @return the updated wallet connection
     */
    public WalletConnection setPrimaryWallet(final String userId, final String walletAddress) {
        log.info("Setting primary wallet {} for user {}", walletAddress, userId);

        walletConnectionRepository.findByUserIdAndIsPrimaryTrue(userId)
                .ifPresent(WalletConnection::unmarkPrimary);

        final WalletConnection connection = walletConnectionRepository
                .findByWalletAddress(walletAddress)
                .filter(c -> c.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("WalletConnection", walletAddress));

        connection.markAsPrimary();
        final WalletConnection saved = walletConnectionRepository.save(connection);
        log.info("Primary wallet set to {} for user {}", walletAddress, userId);
        return saved;
    }

    /**
     * Verifies wallet ownership by simulating a cryptographic signature check.
     *
     * @param userId         the user identifier
     * @param walletAddress  the wallet address
     * @param signature      the signed message
     * @return true if the signature is valid for the given wallet
     */
    @Transactional(readOnly = true)
    public boolean verifyWalletOwnership(final String userId,
                                         final String walletAddress,
                                         final String signature) {
        log.info("Verifying wallet ownership for user {} address {}", userId, walletAddress);

        if (!walletConnectionRepository.existsByWalletAddressAndUserId(walletAddress, userId)) {
            log.warn("Wallet {} not connected by user {}", walletAddress, userId);
            return false;
        }

        try {
            final String challenge = "Verify ownership of wallet " + walletAddress + " for user " + userId;
            final MessageDigest digest = MessageDigest.getInstance("SHA-256");
            final byte[] hash = digest.digest(challenge.getBytes(StandardCharsets.UTF_8));
            final String expectedHash = HexFormat.of().formatHex(hash);
            final boolean valid = expectedHash.equals(signature);

            log.info("Wallet ownership verification for {} : {}", walletAddress,
                    valid ? "PASSED" : "FAILED");
            return valid;
        } catch (final NoSuchAlgorithmException e) {
            log.error("SHA-256 algorithm not available for wallet verification", e);
            return false;
        }
    }
}
