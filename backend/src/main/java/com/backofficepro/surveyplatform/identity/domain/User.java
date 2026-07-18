package com.backofficepro.surveyplatform.identity.domain;

import com.backofficepro.surveyplatform.identity.domain.event.UserDeactivatedEvent;
import com.backofficepro.surveyplatform.identity.domain.event.UserRegisteredEvent;
import com.backofficepro.surveyplatform.identity.domain.event.UserRoleChangedEvent;
import com.backofficepro.surveyplatform.identity.domain.valueobject.DisplayName;
import com.backofficepro.surveyplatform.identity.domain.valueobject.Email;
import com.backofficepro.surveyplatform.shared.domain.AggregateRoot;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

/**
 * User aggregate root representing a registered user in the identity context.
 *
 * <p>This aggregate manages user identity, authentication credentials, and role
 * assignments. It publishes domain events for cross-context communication.</p>
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "users", schema = "identity")
public class User extends AggregateRoot {

    @Column(name = "email", unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(name = "account_locked", nullable = false)
    private boolean accountLocked = false;

    @Column(name = "failed_login_attempts", nullable = false)
    private int failedLoginAttempts = 0;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "last_login_ip", length = 45)
    private String lastLoginIp;

    @ManyToMany(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinTable(
            name = "user_roles",
            schema = "identity",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new HashSet<>();

    protected User() {
        super();
    }

    /**
     * Registers a new user with the specified details.
     *
     * @param email        the user's email address
     * @param passwordHash the hashed password
     * @param firstName    the user's first name
     * @param lastName     the user's last name
     * @return the newly created User aggregate
     */
    public static User register(final Email email,
                                final String passwordHash,
                                final String firstName,
                                final String lastName) {
        final User user = new User();
        user.email = email.getValue();
        user.passwordHash = passwordHash;
        user.firstName = firstName.trim();
        user.lastName = lastName.trim();
        user.emailVerified = false;
        user.accountLocked = false;
        user.failedLoginAttempts = 0;
        user.registerEvent(new UserRegisteredEvent(
                user.getId() != null ? user.getId().toString() : null,
                email.getValue(),
                firstName,
                lastName));
        return user;
    }

    /**
     * Assigns a role to this user.
     *
     * @param role the role to assign
     * @throws BusinessRuleValidationException if the user already has this role
     */
    public void assignRole(final Role role) {
        if (this.roles.contains(role)) {
            throw new BusinessRuleValidationException(
                    "RoleAlreadyAssigned",
                    "User already has role: " + role.getName());
        }
        this.roles.add(role);
        registerEvent(new UserRoleChangedEvent(
                getId().toString(),
                email,
                role.getName(),
                "ASSIGNED"));
    }

    /**
     * Removes a role from this user.
     *
     * @param role the role to remove
     * @throws BusinessRuleValidationException if removing the last ADMIN role
     */
    public void removeRole(final Role role) {
        final boolean isAdmin = this.roles.stream()
                .anyMatch(r -> "ADMIN".equals(r.getName()));
        final boolean removingAdmin = "ADMIN".equals(role.getName());
        if (isAdmin && removingAdmin && this.roles.stream()
                .filter(r -> "ADMIN".equals(r.getName())).count() <= 1) {
            throw new BusinessRuleValidationException(
                    "CannotRemoveLastAdmin",
                    "Cannot remove the last ADMIN role from a user");
        }
        this.roles.remove(role);
        registerEvent(new UserRoleChangedEvent(
                getId().toString(),
                email,
                role.getName(),
                "REMOVED"));
    }

    /**
     * Updates the user's display name.
     *
     * @param displayName the new display name
     */
    public void updateDisplayName(final DisplayName displayName) {
        this.firstName = displayName.getFirstName();
        this.lastName = displayName.getLastName();
    }

    /**
     * Updates the user's profile information.
     *
     * @param phoneNumber the new phone number
     * @param avatarUrl   the new avatar URL
     */
    public void updateProfile(final String phoneNumber, final String avatarUrl) {
        this.phoneNumber = phoneNumber;
        this.avatarUrl = avatarUrl;
    }

    /**
     * Records a successful login.
     *
     * @param ipAddress the IP address of the login
     */
    public void recordSuccessfulLogin(final String ipAddress) {
        this.lastLoginAt = LocalDateTime.now();
        this.lastLoginIp = ipAddress;
        this.failedLoginAttempts = 0;
        this.accountLocked = false;
    }

    /**
     * Records a failed login attempt and locks the account after 5 failures.
     */
    public void recordFailedLogin() {
        this.failedLoginAttempts++;
        if (this.failedLoginAttempts >= 5) {
            this.accountLocked = true;
        }
    }

    /**
     * Marks the user's email as verified.
     */
    public void verifyEmail() {
        this.emailVerified = true;
    }

    /**
     * Deactivates the user account.
     *
     * @param userId the identifier of the admin performing the deactivation
     */
    public void deactivate(final String userId) {
        this.softDelete(userId);
        registerEvent(new UserDeactivatedEvent(
                getId().toString(),
                email,
                userId));
    }

    /**
     * Checks if the user has the specified role.
     *
     * @param roleName the role name to check
     * @return true if the user has the role
     */
    public boolean hasRole(final String roleName) {
        return roles.stream().anyMatch(role -> role.getName().equals(roleName));
    }

    /**
     * Checks if the user account is active.
     *
     * @return true if the account is not locked and not deleted
     */
    public boolean isActive() {
        return !accountLocked && !isDeleted();
    }

    /**
     * Returns the user's display name.
     *
     * @return the display name value object
     */
    public DisplayName getDisplayName() {
        return DisplayName.of(firstName, lastName);
    }

    /**
     * Returns the user's email value object.
     *
     * @return the email value object
     */
    public Email getEmailValueObject() {
        return Email.of(email);
    }
}
