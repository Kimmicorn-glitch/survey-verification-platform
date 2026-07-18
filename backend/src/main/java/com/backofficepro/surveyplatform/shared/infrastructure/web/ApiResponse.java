package com.backofficepro.surveyplatform.shared.infrastructure.web;

import java.time.LocalDateTime;

/**
 * Standard API response wrapper used across all REST endpoints.
 *
 * @param <T> the type of the response payload
 * @author BackOffice Pro
 */
public class ApiResponse<T> {

    private boolean success;
    private T data;
    private String message;
    private LocalDateTime timestamp;

    /**
     * Constructs a successful API response with data.
     *
     * @param data    the response data
     * @param message the success message
     */
    public ApiResponse(final T data, final String message) {
        this.success = true;
        this.data = data;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Constructs an API response.
     *
     * @param success whether the request was successful
     * @param data    the response data
     * @param message the message
     */
    public ApiResponse(final boolean success, final T data, final String message) {
        this.success = success;
        this.data = data;
        this.message = message;
        this.timestamp = LocalDateTime.now();
    }

    /**
     * Creates a successful response with data.
     *
     * @param data    the response data
     * @param message the success message
     * @param <T>     the data type
     * @return a new ApiResponse instance
     */
    public static <T> ApiResponse<T> success(final T data, final String message) {
        return new ApiResponse<>(data, message);
    }

    /**
     * Creates a successful response with data and default message.
     *
     * @param data the response data
     * @param <T>  the data type
     * @return a new ApiResponse instance
     */
    public static <T> ApiResponse<T> success(final T data) {
        return new ApiResponse<>(data, "Operation completed successfully");
    }

    /**
     * Creates an error response.
     *
     * @param message the error message
     * @param <T>     the data type
     * @return a new ApiResponse instance
     */
    public static <T> ApiResponse<T> error(final String message) {
        return new ApiResponse<>(false, null, message);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(final boolean success) {
        this.success = success;
    }

    public T getData() {
        return data;
    }

    public void setData(final T data) {
        this.data = data;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(final String message) {
        this.message = message;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(final LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
