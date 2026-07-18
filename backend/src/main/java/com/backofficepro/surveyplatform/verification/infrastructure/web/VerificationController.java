package com.backofficepro.surveyplatform.verification.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import com.backofficepro.surveyplatform.verification.application.VerificationService;
import com.backofficepro.surveyplatform.verification.application.dto.request.CompleteVerificationRequest;
import com.backofficepro.surveyplatform.verification.application.dto.request.CreateVerificationRequest;
import com.backofficepro.surveyplatform.verification.application.dto.response.VerificationResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for verification operations.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/verifications")
@Tag(name = "Verifications", description = "Survey verification endpoints")
public class VerificationController {

    private final VerificationService verificationService;

    public VerificationController(final VerificationService verificationService) {
        this.verificationService = verificationService;
    }

    /**
     * Creates a new verification request.
     *
     * @param request the creation request
     * @return the created verification
     */
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Create verification", description = "Creates a new verification request")
    public ResponseEntity<ApiResponse<VerificationResponse>> createVerification(
            @Valid @RequestBody final CreateVerificationRequest request) {
        final VerificationResponse verification = verificationService.createVerification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(verification, "Verification request created"));
    }

    /**
     * Starts the verification process.
     *
     * @param id             the verification identifier
     * @param authentication the verifier
     * @return the updated verification
     */
    @PutMapping("/{id}/start")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Start verification", description = "Starts the verification process")
    public ResponseEntity<ApiResponse<VerificationResponse>> startVerification(
            @PathVariable final String id,
            final Authentication authentication) {
        final VerificationResponse verification = verificationService.startVerification(
                id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(verification, "Verification started"));
    }

    /**
     * Completes a verification.
     *
     * @param id             the verification identifier
     * @param request        the completion request
     * @param authentication the verifier
     * @return the completed verification
     */
    @PutMapping("/{id}/complete")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Complete verification", description = "Completes a verification")
    public ResponseEntity<ApiResponse<VerificationResponse>> completeVerification(
            @PathVariable final String id,
            @Valid @RequestBody final CompleteVerificationRequest request,
            final Authentication authentication) {
        final VerificationResponse verification = verificationService.completeVerification(
                id, request, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(verification, "Verification completed"));
    }

    /**
     * Gets a verification by ID.
     *
     * @param id the verification identifier
     * @return the verification details
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "Get verification", description = "Retrieves verification details")
    public ResponseEntity<ApiResponse<VerificationResponse>> getVerification(
            @PathVariable final String id) {
        final VerificationResponse verification = verificationService.getVerificationById(id);
        return ResponseEntity.ok(ApiResponse.success(verification));
    }

    /**
     * Lists verifications for a survey.
     *
     * @param surveyId the survey identifier
     * @param page     the page number
     * @param size     the page size
     * @return paginated verification list
     */
    @GetMapping
    @PreAuthorize("hasRole('USER')")
    @Operation(summary = "List verifications", description = "Lists verifications for a survey")
    public ResponseEntity<ApiResponse<PaginatedResponse<VerificationResponse>>> listVerifications(
            @RequestParam final String surveyId,
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size) {
        final Page<VerificationResponse> verifications = verificationService.listBySurvey(
                surveyId, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(verifications)));
    }
}
