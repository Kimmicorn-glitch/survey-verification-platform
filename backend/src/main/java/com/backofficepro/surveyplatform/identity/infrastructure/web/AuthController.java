package com.backofficepro.surveyplatform.identity.infrastructure.web;

import com.backofficepro.surveyplatform.identity.application.UserService;
import com.backofficepro.surveyplatform.identity.application.dto.request.LoginRequest;
import com.backofficepro.surveyplatform.identity.application.dto.request.RegisterUserRequest;
import com.backofficepro.surveyplatform.identity.application.dto.response.AuthResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Authentication", description = "User authentication endpoints")
public class AuthController {

    private final UserService userService;

    /**
     * Constructs a new AuthController.
     *
     * @param userService the user service
     */
    public AuthController(final UserService userService) {
        this.userService = userService;
    }

    /**
     * Registers a new user account.
     *
     * @param request the registration request
     * @return the authentication response with tokens
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account and returns JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody final RegisterUserRequest request) {
        userService.registerUser(request);
        final AuthResponse authResponse = userService.login(
                new LoginRequest() {{
                    setEmail(request.getEmail());
                    setPassword(request.getPassword());
                }});
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(authResponse, "User registered successfully"));
    }

    /**
     * Authenticates a user and returns JWT tokens.
     *
     * @param request the login request
     * @return the authentication response with tokens
     */
    @PostMapping("/login")
    @Operation(summary = "Login", description = "Authenticates a user and returns JWT tokens")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody final LoginRequest request) {
        final AuthResponse authResponse = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Login successful"));
    }
}
