package com.backofficepro.surveyplatform.shared.domain;

import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;

import java.math.BigDecimal;
import java.util.Currency;
import java.util.Objects;

/**
 * Immutable value object representing a monetary amount with currency.
 *
 * <p>Encapsulates financial operations and ensures proper currency handling.
 * All arithmetic operations produce new Money instances to maintain immutability.</p>
 *
 * @author BackOffice Pro
 */
public final class Money extends ValueObject {

    private final BigDecimal amount;
    private final Currency currency;

    /**
     * Constructs a new Money instance.
     *
     * @param amount   the monetary amount (must be non-negative)
     * @param currency the currency
     */
    public Money(final BigDecimal amount, final Currency currency) {
        Objects.requireNonNull(amount, "Amount must not be null");
        Objects.requireNonNull(currency, "Currency must not be null");
        if (amount.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleValidationException(
                    "MoneyNonNegative",
                    "Money amount must not be negative: " + amount);
        }
        this.amount = amount.stripTrailingZeros();
        this.currency = currency;
    }

    /**
     * Creates a Money instance with the specified amount and currency code.
     *
     * @param amount        the monetary amount
     * @param currencyCode  the ISO 4217 currency code
     * @return a new Money instance
     */
    public static Money of(final BigDecimal amount, final String currencyCode) {
        return new Money(amount, Currency.getInstance(currencyCode));
    }

    /**
     * Creates a zero-value Money instance with the specified currency.
     *
     * @param currency the currency
     * @return a Money instance representing zero
     */
    public static Money zero(final Currency currency) {
        return new Money(BigDecimal.ZERO, currency);
    }

    /**
     * Creates a Money instance representing the specified amount in USD.
     *
     * @param amount the monetary amount
     * @return a new Money instance in USD
     */
    public static Money usd(final double amount) {
        return new Money(BigDecimal.valueOf(amount), Currency.getInstance("USD"));
    }

    /**
     * Adds another Money instance to this one.
     *
     * @param other the Money to add
     * @return a new Money instance representing the sum
     * @throws BusinessRuleValidationException if currencies do not match
     */
    public Money add(final Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new BusinessRuleValidationException(
                    "CurrencyMismatch",
                    "Cannot add Money with different currencies: "
                            + this.currency.getCurrencyCode() + " and " + other.currency.getCurrencyCode());
        }
        return new Money(this.amount.add(other.amount), this.currency);
    }

    /**
     * Subtracts another Money instance from this one.
     *
     * @param other the Money to subtract
     * @return a new Money instance representing the difference
     * @throws BusinessRuleValidationException if currencies do not match or result is negative
     */
    public Money subtract(final Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new BusinessRuleValidationException(
                    "CurrencyMismatch",
                    "Cannot subtract Money with different currencies");
        }
        final BigDecimal result = this.amount.subtract(other.amount);
        return new Money(result, this.currency);
    }

    /**
     * Multiplies this Money by a scalar factor.
     *
     * @param factor the multiplier
     * @return a new Money instance representing the product
     */
    public Money multiply(final double factor) {
        return new Money(this.amount.multiply(BigDecimal.valueOf(factor)), this.currency);
    }

    /**
     * Checks if this Money is greater than another.
     *
     * @param other the Money to compare
     * @return true if this amount is greater
     */
    public boolean isGreaterThan(final Money other) {
        ensureSameCurrency(other);
        return this.amount.compareTo(other.amount) > 0;
    }

    /**
     * Checks if this Money is zero.
     *
     * @return true if the amount is zero
     */
    public boolean isZero() {
        return this.amount.compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Checks if this Money is positive (greater than zero).
     *
     * @return true if the amount is positive
     */
    public boolean isPositive() {
        return this.amount.compareTo(BigDecimal.ZERO) > 0;
    }

    private void ensureSameCurrency(final Money other) {
        if (!this.currency.equals(other.currency)) {
            throw new BusinessRuleValidationException(
                    "CurrencyMismatch",
                    "Cannot compare Money with different currencies");
        }
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public Currency getCurrency() {
        return currency;
    }

    public String getCurrencyCode() {
        return currency.getCurrencyCode();
    }

    @Override
    protected Object[] getEqualityComponents() {
        return new Object[]{amount, currency};
    }
}
