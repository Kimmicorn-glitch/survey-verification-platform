package com.backofficepro.surveyplatform.wallet.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * Domain entity representing a wallet connection for a user.
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "wallet_connections", schema = "identity")
public class WalletConnection extends BaseEntity {

    @Column(name = "user_id", nullable = false, length = 255)
    private String userId;

    @Column(name = "wallet_address", nullable = false, length = 100)
    private String walletAddress;

    @Column(name = "chain_id", nullable = false)
    private Integer chainId;

    @Column(name = "chain_name", nullable = false, length = 100)
    private String chainName;

    @Column(name = "wallet_type", nullable = false, length = 50)
    private String walletType;

    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    @Column(name = "last_connected_at")
    private LocalDateTime lastConnectedAt;

    @Column(name = "connection_metadata", columnDefinition = "jsonb")
    private String connectionMetadata;

    protected WalletConnection() {
        super();
    }

    /**
     * Creates a new wallet connection.
     *
     * @param userId         the user identifier
     * @param walletAddress  the wallet blockchain address
     * @param chainId        the chain identifier
     * @param chainName      the chain name
     * @param walletType     the wallet type (METAMASK, WALLETCONNECT, COINBASE)
     * @return the new WalletConnection entity
     */
    public static WalletConnection create(final String userId,
                                          final String walletAddress,
                                          final Integer chainId,
                                          final String chainName,
                                          final String walletType) {
        final WalletConnection connection = new WalletConnection();
        connection.userId = userId;
        connection.walletAddress = walletAddress;
        connection.chainId = chainId;
        connection.chainName = chainName;
        connection.walletType = walletType;
        connection.primary = false;
        connection.lastConnectedAt = LocalDateTime.now();
        return connection;
    }

    /**
     * Marks this connection as the primary wallet.
     */
    public void markAsPrimary() {
        this.primary = true;
    }

    /**
     * Removes the primary flag from this connection.
     */
    public void unmarkPrimary() {
        this.primary = false;
    }

    /**
     * Updates the last connected timestamp.
     */
    public void touchLastConnected() {
        this.lastConnectedAt = LocalDateTime.now();
    }

    /**
     * Sets the connection metadata.
     *
     * @param metadata the JSON metadata string
     */
    public void setConnectionMetadata(final String metadata) {
        this.connectionMetadata = metadata;
    }
}
