package com.backofficepro.surveyplatform.identity.application;

import com.backofficepro.surveyplatform.identity.application.dto.response.OnboardingResult;
import com.backofficepro.surveyplatform.identity.domain.Organization;
import com.backofficepro.surveyplatform.identity.domain.Role;
import com.backofficepro.surveyplatform.identity.domain.User;
import com.backofficepro.surveyplatform.identity.domain.repository.OrganizationRepository;
import com.backofficepro.surveyplatform.identity.domain.repository.RoleRepository;
import com.backofficepro.surveyplatform.identity.domain.repository.UserRepository;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class OnboardingService {

    private static final Logger log = LoggerFactory.getLogger(OnboardingService.class);

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;

    public OnboardingService(final UserRepository userRepository,
                             final OrganizationRepository organizationRepository,
                             final RoleRepository roleRepository) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
    }

    public OnboardingResult completeOnboarding(final String userId) {
        log.info("Completing onboarding for user {}", userId);

        final User user = userRepository.findById(UUID.fromString(userId))
                .orElseThrow(() -> new EntityNotFoundException("User", userId));

        if (organizationRepository.existsByOwnerId(userId)) {
            log.info("User {} already has an organization", userId);
            return new OnboardingResult(null, false, "Organization already exists for this user");
        }

        final String orgName = user.getFirstName() + "'s Organization";
        final Organization organization = Organization.create(orgName, userId);
        final Organization savedOrg = organizationRepository.save(organization);
        log.info("Organization {} created for user {}", savedOrg.getId(), userId);

        ensureDefaultRoles(user);

        log.info("Onboarding completed for user {}", userId);
        return new OnboardingResult(
                savedOrg.getId().toString(),
                true,
                "Onboarding completed successfully");
    }

    private void ensureDefaultRoles(final User user) {
        final Role ownerRole = roleRepository.findByName("OWNER")
                .orElseGet(() -> {
                    final Role newRole = Role.create("OWNER", "Organization owner role");
                    return roleRepository.save(newRole);
                });

        final Role adminRole = roleRepository.findByName("ADMIN")
                .orElseGet(() -> {
                    final Role newRole = Role.create("ADMIN", "Organization admin role");
                    return roleRepository.save(newRole);
                });

        if (!user.hasRole("OWNER")) {
            user.assignRole(ownerRole);
        }
        if (!user.hasRole("ADMIN")) {
            user.assignRole(adminRole);
        }

        userRepository.save(user);
    }
}
