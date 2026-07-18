package com.backofficepro.surveyplatform.identity.infrastructure.web;

import com.backofficepro.surveyplatform.identity.application.UserService;
import com.backofficepro.surveyplatform.identity.application.dto.request.UpdateUserProfileRequest;
import com.backofficepro.surveyplatform.identity.application.dto.response.UserResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for user management operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    /**
     * Constructs a new UserController.
     *
     * @param userService the user service
     */
    public UserController(final UserService userService) {
        this.userService = userService;
    }

    /**
     * Retrieves the currently authenticated user's profile.
     *
     * @param authentication the current authentication context
     * @return the user profile
     */
    @GetMapping("/me")
    @Operation(summary = "Get current user profile", description = "Returns the authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(
            final Authentication authentication) {
        final String email = authentication.getName();
        final UserResponse user = userService.getUserByEmail(email);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Retrieves a user by their identifier (admin only).
     *
     * @param id the user identifier
     * @return the user profile
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get user by ID", description = "Returns a user profile by identifier (admin only)")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable final UUID id) {
        final UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    /**
     * Updates the current user's profile.
     *
     * @param request the update request
     * @param authentication the current authentication context
     * @return the updated user profile
     */
    @PatchMapping("/me")
    @Operation(summary = "Update current user profile", description = "Updates the authenticated user's profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            @Valid @RequestBody final UpdateUserProfileRequest request,
            final Authentication authentication) {
        final String email = authentication.getName();
        final UserResponse currentUser = userService.getUserByEmail(email);
        final UserResponse updated = userService.updateProfile(currentUser.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
    }

    /**
     * Deactivates a user account (admin only).
     *
     * @param id             the user identifier
     * @param authentication the admin performing the action
     * @return success response
     */
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Deactivate user", description = "Deactivates a user account (admin only)")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(
            @PathVariable final UUID id,
            final Authentication authentication) {
        userService.deactivateUser(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "User deactivated successfully"));
    }
}
