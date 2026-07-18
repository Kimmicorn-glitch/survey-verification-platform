package com.backofficepro.surveyplatform.shared.domain.model;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * JPA entity representing a software license for an organization.
 *
 * <p>Licenses define usage limits and validity periods that govern
 * the features and capacity available to a tenant organization.</p>
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "licenses", schema = "shared")
public class License extends BaseEntity {

    @Column(name = "license_key", unique = true, nullable = false, length = 255)
    private String licenseKey;

    @Column(name = "organization_id", nullable = false, length = 100)
    private String organizationId;

    @Column(name = "plan", nullable = false, length = 50)
    private String plan;

    @Column(name = "max_users", nullable = false)
    private int maxUsers;

    @Column(name = "max_surveys", nullable = false)
    private int maxSurveys;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "is_valid", nullable = false)
    private boolean isValid = true;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "deactivated_reason", length = 500)
    private String deactivatedReason;

    /**
     * Checks whether the license is currently valid and not expired.
     *
     * @return true if the license is active and within its validity period
     */
    public boolean isActive() {
        return isValid && expiresAt.isAfter(LocalDateTime.now());
    }

    /**
     * Checks whether the organization has reached its user limit.
     *
     * @param currentUserCount the current number of active users
     * @return true if the limit has been reached or exceeded
     */
    public boolean isUserLimitReached(final int currentUserCount) {
        return currentUserCount >= maxUsers;
    }

    /**
     * Checks whether the organization has reached its survey limit.
     *
     * @param currentSurveyCount the current number of surveys
     * @return true if the limit has been reached or exceeded
     */
    public boolean isSurveyLimitReached(final int currentSurveyCount) {
        return currentSurveyCount >= maxSurveys;
    }

    /**
     * Deactivates the license with a reason.
     *
     * @param reason the reason for deactivation
     */
    public void deactivate(final String reason) {
        this.isValid = false;
        this.deactivatedReason = reason;
    }
}
