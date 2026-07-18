package com.backofficepro.surveyplatform.shared.domain.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for {@link License} persistence.
 *
 * @author BackOffice Pro
 */
@Repository
public interface LicenseRepository extends JpaRepository<License, UUID> {

    Optional<License> findByLicenseKey(String licenseKey);

    Optional<License> findByOrganizationId(String organizationId);

    List<License> findByOrganizationIdAndIsValid(String organizationId, boolean isValid);

    boolean existsByLicenseKey(String licenseKey);

    boolean existsByOrganizationIdAndIsValid(String organizationId, boolean isValid);
}
