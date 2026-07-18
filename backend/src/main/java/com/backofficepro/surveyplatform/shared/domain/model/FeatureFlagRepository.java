package com.backofficepro.surveyplatform.shared.domain.model;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for {@link FeatureFlag} persistence.
 *
 * @author BackOffice Pro
 */
@Repository
public interface FeatureFlagRepository extends JpaRepository<FeatureFlag, java.util.UUID> {

    Optional<FeatureFlag> findByName(String name);

    boolean existsByName(String name);

    List<FeatureFlag> findByEnabled(boolean enabled);

    @Query("SELECT f FROM FeatureFlag f WHERE f.deleted = false")
    List<FeatureFlag> findAllActive();
}
