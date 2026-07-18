package com.backofficepro.surveyplatform.identity.infrastructure.persistence;

import com.backofficepro.surveyplatform.identity.domain.Permission;
import com.backofficepro.surveyplatform.identity.domain.Role;
import com.backofficepro.surveyplatform.identity.domain.User;
import com.backofficepro.surveyplatform.identity.domain.repository.RoleRepository;
import com.backofficepro.surveyplatform.identity.domain.repository.UserRepository;
import org.springframework.stereotype.Repository;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JPA adapter implementing the User and Role repository ports.
 *
 * <p>This adapter translates between domain entities and JPA entities,
 * implementing the repository port interfaces defined in the domain layer.
 * It follows the Adapter pattern from Hexagonal Architecture.</p>
 *
 * @author BackOffice Pro
 */
@Repository
public class UserRepositoryAdapter implements UserRepository, RoleRepository {

    private final UserJpaRepository userJpaRepository;
    private final RoleJpaRepository roleJpaRepository;

    /**
     * Constructs a new UserRepositoryAdapter.
     *
     * @param userJpaRepository the Spring Data JPA user repository
     * @param roleJpaRepository the Spring Data JPA role repository
     */
    public UserRepositoryAdapter(final UserJpaRepository userJpaRepository,
                                 final RoleJpaRepository roleJpaRepository) {
        this.userJpaRepository = userJpaRepository;
        this.roleJpaRepository = roleJpaRepository;
    }

    // ─── UserRepository Implementation ──────────────────────────────

    @Override
    public Optional<User> findById(final UUID id) {
        return userJpaRepository.findById(id)
                .map(this::toDomainUser);
    }

    @Override
    public Optional<User> findByEmail(final String email) {
        return userJpaRepository.findByEmailWithRoles(email)
                .map(this::toDomainUser);
    }

    @Override
    public boolean existsByEmail(final String email) {
        return userJpaRepository.existsByEmail(email);
    }

    @Override
    public User save(final User user) {
        final UserJpaEntity entity = toJpaUser(user);
        final UserJpaEntity saved = userJpaRepository.save(entity);
        return toDomainUser(saved);
    }

    @Override
    public void deleteById(final UUID id) {
        userJpaRepository.deleteById(id);
    }

    // ─── RoleRepository Implementation ──────────────────────────────

    @Override
    public Optional<Role> findById(final UUID id) {
        return roleJpaRepository.findById(id)
                .map(this::toDomainRole);
    }

    @Override
    public Optional<Role> findByName(final String name) {
        return roleJpaRepository.findByName(name)
                .map(this::toDomainRole);
    }

    @Override
    public List<Role> findAll() {
        return roleJpaRepository.findAll().stream()
                .map(this::toDomainRole)
                .collect(Collectors.toList());
    }

    @Override
    public Role save(final Role role) {
        final RoleJpaEntity entity = toJpaRole(role);
        final RoleJpaEntity saved = roleJpaRepository.save(entity);
        return toDomainRole(saved);
    }

    @Override
    public boolean existsByName(final String name) {
        return roleJpaRepository.existsByName(name);
    }

    // ─── Mapping Methods ────────────────────────────────────────────

    private User toDomainUser(final UserJpaEntity entity) {
        final User user = User.register(
                com.backofficepro.surveyplatform.identity.domain.valueobject.Email.of(entity.getEmail()),
                entity.getPasswordHash(),
                entity.getFirstName(),
                entity.getLastName());
        user.updateProfile(entity.getPhoneNumber(), entity.getAvatarUrl());

        if (entity.getId() != null) {
            try {
                final var idField = user.getClass().getSuperclass().getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(user, entity.getId());
            } catch (Exception ignored) {
                // Using reflection fallback for ID assignment
            }
        }

        if (entity.isEmailVerified()) {
            user.verifyEmail();
        }

        final Set<Role> roles = new HashSet<>();
        if (entity.getRoles() != null) {
            for (final RoleJpaEntity roleEntity : entity.getRoles()) {
                roles.add(toDomainRole(roleEntity));
            }
        }
        for (final Role role : roles) {
            try {
                user.assignRole(role);
            } catch (Exception ignored) {
                // Role may already be assigned
            }
        }

        return user;
    }

    private UserJpaEntity toJpaUser(final User user) {
        final UserJpaEntity entity = new UserJpaEntity();
        entity.setId(user.getId());
        entity.setEmail(user.getEmail());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFirstName(user.getFirstName());
        entity.setLastName(user.getLastName());
        entity.setPhoneNumber(user.getPhoneNumber());
        entity.setAvatarUrl(user.getAvatarUrl());
        entity.setEmailVerified(user.isEmailVerified());
        entity.setAccountLocked(user.isAccountLocked());
        entity.setFailedLoginAttempts(user.getFailedLoginAttempts());
        entity.setLastLoginAt(user.getLastLoginAt());
        entity.setLastLoginIp(user.getLastLoginIp());
        entity.setCreatedAt(user.getCreatedAt());
        entity.setUpdatedAt(user.getUpdatedAt());
        entity.setCreatedBy(user.getCreatedBy());
        entity.setUpdatedBy(user.getUpdatedBy());
        entity.setVersion(user.getVersion());
        entity.setDeleted(user.isDeleted());

        final Set<RoleJpaEntity> roleEntities = new HashSet<>();
        if (user.getRoles() != null) {
            for (final Role role : user.getRoles()) {
                roleEntities.add(toJpaRole(role));
            }
        }
        entity.setRoles(roleEntities);
        return entity;
    }

    private Role toDomainRole(final RoleJpaEntity entity) {
        final Role role = Role.create(entity.getName(), entity.getDescription());
        if (entity.getId() != null) {
            try {
                final var idField = role.getClass().getSuperclass().getDeclaredField("id");
                idField.setAccessible(true);
                idField.set(role, entity.getId());
            } catch (Exception ignored) {
                // Using reflection fallback for ID assignment
            }
        }
        if (entity.getPermissions() != null) {
            for (final PermissionJpaEntity permEntity : entity.getPermissions()) {
                role.addPermission(Permission.create(
                        permEntity.getName(),
                        permEntity.getDescription(),
                        permEntity.getResource(),
                        permEntity.getAction()));
            }
        }
        return role;
    }

    private RoleJpaEntity toJpaRole(final Role role) {
        final RoleJpaEntity entity = new RoleJpaEntity();
        entity.setId(role.getId());
        entity.setName(role.getName());
        entity.setDescription(role.getDescription());
        entity.setCreatedAt(role.getCreatedAt());
        entity.setUpdatedAt(role.getUpdatedAt());
        entity.setVersion(role.getVersion());
        entity.setDeleted(role.isDeleted());

        final Set<PermissionJpaEntity> permEntities = new HashSet<>();
        if (role.getPermissions() != null) {
            for (final Permission perm : role.getPermissions()) {
                final PermissionJpaEntity permEntity = new PermissionJpaEntity();
                permEntity.setId(perm.getId());
                permEntity.setName(perm.getName());
                permEntity.setDescription(perm.getDescription());
                permEntity.setResource(perm.getResource());
                permEntity.setAction(perm.getAction());
                permEntities.add(permEntity);
            }
        }
        entity.setPermissions(permEntities);
        return entity;
    }
}
