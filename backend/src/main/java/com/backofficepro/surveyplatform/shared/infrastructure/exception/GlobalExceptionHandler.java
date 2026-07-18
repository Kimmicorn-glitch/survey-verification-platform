package com.backofficepro.surveyplatform.shared.infrastructure.exception;

import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.DomainException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global exception handler for REST controllers.
 *
 * <p>Intercepts exceptions thrown by controllers and converts them into
 * standardized error responses with appropriate HTTP status codes.</p>
 *
 * @author BackOffice Pro
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles entity not found exceptions.
     *
     * @param ex the exception
     * @return 404 Not Found response
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleEntityNotFound(final EntityNotFoundException ex) {
        log.warn("Entity not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(
                        HttpStatus.NOT_FOUND.value(),
                        ex.getCode(),
                        ex.getMessage(),
                        LocalDateTime.now()));
    }

    /**
     * Handles business rule validation exceptions.
     *
     * @param ex the exception
     * @return 422 Unprocessable Entity response
     */
    @ExceptionHandler(BusinessRuleValidationException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRuleValidation(
            final BusinessRuleValidationException ex) {
        log.warn("Business rule violation [{}]: {}", ex.getRuleName(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ErrorResponse(
                        HttpStatus.UNPROCESSABLE_ENTITY.value(),
                        ex.getCode(),
                        ex.getMessage(),
                        LocalDateTime.now()));
    }

    /**
     * Handles general domain exceptions.
     *
     * @param ex the exception
     * @return 500 Internal Server Error response
     */
    @ExceptionHandler(DomainException.class)
    public ResponseEntity<ErrorResponse> handleDomainException(final DomainException ex) {
        log.error("Domain error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        ex.getCode(),
                        ex.getMessage(),
                        LocalDateTime.now()));
    }

    /**
     * Handles bean validation exceptions from request bodies.
     *
     * @param ex the exception
     * @return 400 Bad Request response with field-level errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(final MethodArgumentNotValidException ex) {
        final Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> error.getDefaultMessage() != null ? error.getDefaultMessage() : "Invalid value",
                        (existing, replacement) -> existing));
        log.warn("Validation failed: {}", fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        "VALIDATION_ERROR",
                        "Request validation failed",
                        LocalDateTime.now(),
                        fieldErrors));
    }

    /**
     * Handles access denied exceptions from Spring Security.
     *
     * @param ex the exception
     * @return 403 Forbidden response
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(final AccessDeniedException ex) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(
                        HttpStatus.FORBIDDEN.value(),
                        "ACCESS_DENIED",
                        "You do not have permission to perform this action",
                        LocalDateTime.now()));
    }

    /**
     * Handles bad credentials exceptions from authentication.
     *
     * @param ex the exception
     * @return 401 Unauthorized response
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(final BadCredentialsException ex) {
        log.warn("Bad credentials: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse(
                        HttpStatus.UNAUTHORIZED.value(),
                        "INVALID_CREDENTIALS",
                        "Invalid username or password",
                        LocalDateTime.now()));
    }

    /**
     * Handles illegal argument exceptions.
     *
     * @param ex the exception
     * @return 400 Bad Request response
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(final IllegalArgumentException ex) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(
                        HttpStatus.BAD_REQUEST.value(),
                        "INVALID_ARGUMENT",
                        ex.getMessage(),
                        LocalDateTime.now()));
    }

    /**
     * Handles illegal state exceptions.
     *
     * @param ex the exception
     * @return 409 Conflict response
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(final IllegalStateException ex) {
        log.warn("Illegal state: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(
                        HttpStatus.CONFLICT.value(),
                        "INVALID_STATE",
                        ex.getMessage(),
                        LocalDateTime.now()));
    }

    /**
     * Handles all uncaught exceptions.
     *
     * @param ex the exception
     * @return 500 Internal Server Error response
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(final Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "INTERNAL_ERROR",
                        "An unexpected error occurred. Please contact support.",
                        LocalDateTime.now()));
    }

    /**
     * Standardized error response record.
     *
     * @param status      the HTTP status code
     * @param code        the application error code
     * @param message     the error message
     * @param timestamp   when the error occurred
     * @param fieldErrors optional map of field-level validation errors
     */
    public record ErrorResponse(
            int status,
            String code,
            String message,
            LocalDateTime timestamp,
            Map<String, String> fieldErrors) {

        /**
         * Constructs an ErrorResponse without field-level errors.
         */
        public ErrorResponse(final int status, final String code,
                             final String message, final LocalDateTime timestamp) {
            this(status, code, message, timestamp, null);
        }
    }
}
