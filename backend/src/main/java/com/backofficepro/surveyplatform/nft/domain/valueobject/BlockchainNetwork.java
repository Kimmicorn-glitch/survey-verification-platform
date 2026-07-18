package com.backofficepro.surveyplatform.nft.domain.valueobject;

import com.backofficepro.surveyplatform.shared.domain.ValueObject;

/**
 * Value object representing a blockchain network identifier.
 *
 * @author BackOffice Pro
 */
public final class BlockchainNetwork extends ValueObject {

    private static final long serialVersionUID = 1L;

    public static final BlockchainNetwork ETHEREUM = new BlockchainNetwork("ETHEREUM", "1", "ETH");
    public static final BlockchainNetwork POLYGON = new BlockchainNetwork("POLYGON", "137", "MATIC");
    public static final BlockchainNetwork SOLANA = new BlockchainNetwork("SOLANA", "mainnet-beta", "SOL");

    private final String name;
    private final String chainId;
    private final String nativeCurrency;

    public BlockchainNetwork(final String name, final String chainId, final String nativeCurrency) {
        this.name = name;
        this.chainId = chainId;
        this.nativeCurrency = nativeCurrency;
    }

    public static BlockchainNetwork of(final String name) {
        return switch (name.toUpperCase()) {
            case "ETHEREUM" -> ETHEREUM;
            case "POLYGON" -> POLYGON;
            case "SOLANA" -> SOLANA;
            default -> new BlockchainNetwork(name.toUpperCase(), "unknown", "UNKNOWN");
        };
    }

    public String getName() {
        return name;
    }

    public String getChainId() {
        return chainId;
    }

    public String getNativeCurrency() {
        return nativeCurrency;
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{name, chainId};
    }
}
