package com.backofficepro.surveyplatform.identity.application;

import com.backofficepro.surveyplatform.identity.application.dto.request.LoginRequest;
import com.backofficepro.surveyplatform.identity.application.dto.request.RegisterUserRequest;
import com.backofficepro.surveyplatform.identity.application.dto.request.UpdateUserProfileRequest;
import com.backofficepro.surveyplatform.identity.application.dto.response.AuthResponse;
import com.backofficepro.surveyplatform.identity.application.dto.response.UserResponse;
import com.backofficepro.surveyplatform.identity.application.mapper.UserMapper;
import com.backofficepro.surveyplatform.identity.domain.Role;
import com.backofficepro.surveyplatform.identity.domain.User;
import com.backofficepro.surveyplatform.identity.domain.exception.EmailAlreadyExistsException;
import com.backofficepro.surveyplatform.identity.domain.exception.InvalidCredentialsException;
import com.backofficepro.surveyplatform.identity.domain.exception.UserAccountLockedException;
import com.backofficepro.surveyplatform.identity.domain.repository.RoleRepository;
import com.backofficepro.surveyplatform.identity.domain.repository.UserRepository;
import com.backofficepro.surveyplatform.identity.domain.valueobject.DisplayName;
import com.backofficepro.surveyplatform.identity.domain.valueobject.Email;
import com.backofficepro.surveyplatform.identity.infrastructure.security.JwtTokenProvider;
import com.backofficepro.surveyplatform.shared.domain.event.DomainEventPublisher;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.UUID;

/**
 * Application service implementing user identity use cases.
 *
 * <p>Handles user registration, authentication, profile management,
 * and role assignment. Coordinates between domain entities, repositories,
 * and infrastructure components.</p>
 *
 * @author BackOffice Pro
 */
@Service
@Transactional
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserMapper userMapper;
    private final DomainEventPublisher eventPublisher;

    /**
     * Constructs a new UserService.
     *
     * @param userRepository   the user repository
     * @param roleRepository   the role repository
     * @param passwordEncoder  the password encoder
     * @param jwtTokenProvider the JWT token provider
     * @param userMapper       the user mapper
     * @param eventPublisher   the domain event publisher
     */
    public UserService(final UserRepository userRepository,
                       final RoleRepository roleRepository,
                       final PasswordEncoder passwordEncoder,
                       final JwtTokenProvider jwtTokenProvider,
                       final UserMapper userMapper,
                       final DomainEventPublisher eventPublisher) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userMapper = userMapper;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Registers a new user with the provided details.
     *
     * @param request the registration request
     * @return the created user response
     * @throws EmailAlreadyExistsException if the email is already registered
     */
    public UserResponse registerUser(final RegisterUserRequest request) {
        log.info("Registering new user with email: {}", request.getEmail());

        final Email email = Email.of(request.getEmail());
        if (userRepository.existsByEmail(email.getValue())) {
            throw new EmailAlreadyExistsException(email.getValue());
        }

        final String passwordHash = passwordEncoder.encode(request.getPassword());

        final User user = User.register(
                email,
                passwordHash,
                request.getFirstName(),
                request.getLastName());
        user.updateProfile(request.getPhoneNumber(), null);

        final Role defaultRole = roleRepository.findByName("USER")
                .orElseGet(() -> {
                    final Role newRole = Role.create("USER", "Default user role");
                    return roleRepository.save(newRole);
                });
        user.assignRole(defaultRole);

        final User savedUser = userRepository.save(user);
        log.info("User registered successfully with id: {}", savedUser.getId());

        return userMapper.toResponse(savedUser);
    }

    /**
     * Authenticates a user with email and password.
     *
     * @param request the login request
     * @return authentication response with JWT tokens
     * @throws InvalidCredentialsException  if the credentials are invalid
     * @throws UserAccountLockedException   if the account is locked
     */
    public AuthResponse login(final LoginRequest request) {
        log.info("Login attempt for email: {}", request.getEmail());

        final User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid email or password"));

        if (user.isAccountLocked()) {
            throw new UserAccountLockedException(user.getId());
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.recordFailedLogin();
            userRepository.save(user);
            throw new InvalidCredentialsException("Invalid email or password");
        }

        user.recordSuccessfulLogin(null);
        final User savedUser = userRepository.save(user);

        final String accessToken = jwtTokenProvider.generateAccessToken(savedUser);
        final String refreshToken = jwtTokenProvider.generateRefreshToken(savedUser);

        log.info("User authenticated successfully: {}", user.getEmailValueObject());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiration())
                .userId(savedUser.getId().toString())
                .email(savedUser.getEmail())
                .roles(savedUser.getRoles().stream()
                        .map(Role::getName)
                        .collect(java.util.stream.Collectors.toSet()))
                .build();
    }

    /**
     * Retrieves a user by their identifier.
     *
     * @param userId the user identifier
     * @return the user response
     * @throws EntityNotFoundException if the user is not found
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(final UUID userId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId.toString()));
        return userMapper.toResponse(user);
    }

    /**
     * Retrieves a user by their email address.
     *
     * @param email the email address
     * @return the user response
     * @throws EntityNotFoundException if the user is not found
     */
    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(final String email) {
        final User user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new EntityNotFoundException("User", email));
        return userMapper.toResponse(user);
    }

    /**
     * Updates a user's profile information.
     *
     * @param userId  the user identifier
     * @param request the update request
     * @return the updated user response
     */
    public UserResponse updateProfile(final UUID userId, final UpdateUserProfileRequest request) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId.toString()));

        user.updateDisplayName(DisplayName.of(request.getFirstName(), request.getLastName()));
        user.updateProfile(request.getPhoneNumber(), request.getAvatarUrl());

        final User savedUser = userRepository.save(user);
        log.info("User profile updated: {}", userId);

        return userMapper.toResponse(savedUser);
    }

    /**
     * Assigns a role to a user.
     *
     * @param userId the user identifier
     * @param roleId the role identifier
     */
    public void assignRole(final UUID userId, final UUID roleId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId.toString()));
        final Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new EntityNotFoundException("Role", roleId.toString()));

        user.assignRole(role);
        userRepository.save(user);
        log.info("Role {} assigned to user {}", role.getName(), userId);
    }

    /**
     * Removes a role from a user.
     *
     * @param userId the user identifier
     * @param roleId the role identifier
     */
    public void removeRole(final UUID userId, final UUID roleId) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId.toString()));
        final Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new EntityNotFoundException("Role", roleId.toString()));

        user.removeRole(role);
        userRepository.save(user);
        log.info("Role {} removed from user {}", role.getName(), userId);
    }

    /**
     * Deactivates a user account.
     *
     * @param userId       the user to deactivate
     * @param deactivatedBy the admin performing the deactivation
     */
    public void deactivateUser(final UUID userId, final String deactivatedBy) {
        final User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User", userId.toString()));
        user.deactivate(deactivatedBy);
        userRepository.save(user);
        log.info("User {} deactivated by {}", userId, deactivatedBy);
    }
}
