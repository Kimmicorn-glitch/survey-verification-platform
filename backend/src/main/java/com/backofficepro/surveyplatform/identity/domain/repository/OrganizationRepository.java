package com.backofficepro.surveyplatform.identity.domain.repository;

import com.backofficepro.surveyplatform.identity.domain.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    Optional<Organization> findByOwnerId(String ownerId);

    boolean existsByOwnerId(String ownerId);
}
