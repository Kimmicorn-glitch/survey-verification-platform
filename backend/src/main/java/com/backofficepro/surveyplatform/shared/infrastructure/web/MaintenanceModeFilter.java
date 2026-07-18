package com.backofficepro.surveyplatform.shared.infrastructure.web;

import com.backofficepro.surveyplatform.shared.infrastructure.feature.FeatureFlagService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

/**
 * Servlet filter that blocks all non-exempt requests when maintenance mode is active.
 *
 * <p>Returns HTTP 503 Service Unavailable with a {@code Retry-After} header so that
 * clients and load-balancers can back off appropriately. Health check endpoints,
 * admin endpoints, and actuator endpoints are excluded from the block.</p>
 *
 * @author BackOffice Pro
 */
@Component
@Order(1)
public class MaintenanceModeFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(MaintenanceModeFilter.class);

    private static final String MAINTENANCE_FLAG = "maintenance_mode";
    private static final String RETRY_AFTER_SECONDS = "120";

    private static final Set<String> EXCLUDED_PREFIXES = Set.of(
            "/actuator",
            "/api/v1/system/health",
            "/api/v1/system/info",
            "/api/v1/admin"
    );

    private static final Set<String> EXCLUDED_PATHS = Set.of(
            "/api/v1/system/version"
    );

    private final FeatureFlagService featureFlagService;

    /**
     * Constructs a new MaintenanceModeFilter.
     *
     * @param featureFlagService the feature flag service
     */
    public MaintenanceModeFilter(final FeatureFlagService featureFlagService) {
        this.featureFlagService = featureFlagService;
    }

    @Override
    public void doFilter(final ServletRequest request,
                         final ServletResponse response,
                         final FilterChain chain) throws IOException, ServletException {
        final HttpServletRequest httpRequest = (HttpServletRequest) request;
        final HttpServletResponse httpResponse = (HttpServletResponse) response;

        final String path = httpRequest.getRequestURI();

        if (isExcluded(path)) {
            chain.doFilter(request, response);
            return;
        }

        if (featureFlagService.isEnabled(MAINTENANCE_FLAG)) {
            log.warn("Maintenance mode active, rejecting request to {}", path);
            httpResponse.setStatus(HttpStatus.SERVICE_UNAVAILABLE.value());
            httpResponse.setHeader("Retry-After", RETRY_AFTER_SECONDS);
            httpResponse.setContentType(MediaType.APPLICATION_JSON_VALUE);
            httpResponse.getWriter().write(
                    "{\"success\":false,\"message\":\"System is currently under maintenance. Please try again later.\",\"timestamp\":\""
                            + java.time.LocalDateTime.now() + "\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean isExcluded(final String path) {
        if (EXCLUDED_PATHS.contains(path)) {
            return true;
        }
        return EXCLUDED_PREFIXES.stream().anyMatch(path::startsWith);
    }
}
