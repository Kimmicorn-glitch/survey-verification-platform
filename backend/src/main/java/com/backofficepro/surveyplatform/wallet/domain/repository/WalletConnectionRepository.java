package com.backofficepro.surveyplatform.wallet.domain.repository;

import com.backofficepro.surveyplatform.wallet.domain.WalletConnection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for WalletConnection entities.
 *
 * @author BackOffice Pro
 */
@Repository
public interface WalletConnectionRepository extends JpaRepository<WalletConnection, UUID> {

    /**
     * Finds all wallet connections for a user.
     *
     * @param userId the user identifier
     * @return list of wallet connections
     */
    List<WalletConnection> findByUserId(String userId);

    /**
     * Finds a wallet connection by its blockchain address.
     *
     * @param walletAddress the wallet address
     * @return the wallet connection if found
     */
    Optional<WalletConnection> findByWalletAddress(String walletAddress);

    /**
     * Finds the primary wallet connection for a user.
     *
     * @param userId the user identifier
     * @return the primary wallet connection if found
     */
    Optional<WalletConnection> findByUserIdAndIsPrimaryTrue(String userId);

    /**
     * Checks if a wallet address is connected by a specific user.
     *
     * @param walletAddress the wallet address
     * @param userId        the user identifier
     * @return true if the connection exists
     */
    boolean existsByWalletAddressAndUserId(String walletAddress, String userId);
}
