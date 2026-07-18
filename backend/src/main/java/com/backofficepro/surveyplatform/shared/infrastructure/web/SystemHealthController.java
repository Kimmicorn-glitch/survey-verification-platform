package com.backofficepro.surveyplatform.shared.infrastructure.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;
import java.lang.management.ThreadMXBean;
import java.net.InetAddress;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller exposing detailed system health, diagnostics, and build information.
 *
 * @author BackOffice Pro
 */
@RestController
@RequestMapping("/api/v1/system")
@Tag(name = "System", description = "System health, diagnostics, and version endpoints")
public class SystemHealthController {

    private static final long BYTES_PER_MB = 1024 * 1024;

    private final DataSource dataSource;
    private final StringRedisTemplate redisTemplate;

    /**
     * Constructs a new SystemHealthController.
     *
     * @param dataSource    the JDBC data source
     * @param redisTemplate the Redis template
     */
    public SystemHealthController(final DataSource dataSource,
                                  final StringRedisTemplate redisTemplate) {
        this.dataSource = dataSource;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Returns a detailed health check covering database, Redis, and disk availability.
     *
     * @return detailed health status for each component
     */
    @GetMapping("/health/detailed")
    @Operation(summary = "Detailed health check", description = "Returns the health status of all system components")
    public ResponseEntity<ApiResponse<Map<String, Object>>> detailedHealth() {
        final Map<String, Object> components = new LinkedHashMap<>();

        components.put("database", checkDatabase());
        components.put("redis", checkRedis());
        components.put("disk", checkDisk());
        components.put("timestamp", LocalDateTime.now());

        final boolean healthy = components.values().stream()
                .filter(Map.class::isInstance)
                .map(Map.class::cast)
                .allMatch(m -> "UP".equals(m.get("status")));

        final String message = healthy ? "All systems operational" : "One or more components are degraded";

        return ResponseEntity.ok(ApiResponse.success(components, message));
    }

    /**
     * Returns basic system information including version and environment.
     *
     * @return system information payload
     */
    @GetMapping("/info")
    @Operation(summary = "System info", description = "Returns application version, environment, and runtime info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> systemInfo() {
        final Map<String, Object> info = new LinkedHashMap<>();
        info.put("application", "Survey Verification Platform");
        info.put("version", getVersionFromManifest());
        info.put("environment", System.getProperty("spring.profiles.active", "default"));
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("hostname", getHostname());
        info.put("serverTime", LocalDateTime.now());
        info.put("serverZone", ZoneId.systemDefault().getId());
        info.put("pid", ManagementFactory.getRuntimeMXBean().getName());

        return ResponseEntity.ok(ApiResponse.success(info, "System information retrieved successfully"));
    }

    /**
     * Returns JVM metrics including memory usage, thread counts, and system load.
     *
     * @return JVM diagnostics payload
     */
    @GetMapping("/diagnostics")
    @Operation(summary = "JVM diagnostics", description = "Returns memory usage, thread count, and system metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> diagnostics() {
        final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        final ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
        final MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        final MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();

        final Map<String, Object> diagnostics = new LinkedHashMap<>();

        final Map<String, Object> heap = new LinkedHashMap<>();
        heap.put("usedMB", heapUsage.getUsed() / BYTES_PER_MB);
        heap.put("committedMB", heapUsage.getCommitted() / BYTES_PER_MB);
        heap.put("maxMB", heapUsage.getMax() / BYTES_PER_MB);
        heap.put("initMB", heapUsage.getInit() / BYTES_PER_MB);

        final Map<String, Object> nonHeap = new LinkedHashMap<>();
        nonHeap.put("usedMB", nonHeapUsage.getUsed() / BYTES_PER_MB);
        nonHeap.put("committedMB", nonHeapUsage.getCommitted() / BYTES_PER_MB);

        final Map<String, Object> threads = new LinkedHashMap<>();
        threads.put("peakCount", threadBean.getPeakThreadCount());
        threads.put("daemonCount", threadBean.getDaemonThreadCount());
        threads.put("currentCount", threadBean.getThreadCount());

        diagnostics.put("heap", heap);
        diagnostics.put("nonHeap", nonHeap);
        diagnostics.put("threads", threads);
        diagnostics.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        diagnostics.put("freeMemoryMB", Runtime.getRuntime().freeMemory() / BYTES_PER_MB);
        diagnostics.put("totalMemoryMB", Runtime.getRuntime().totalMemory() / BYTES_PER_MB);
        diagnostics.put("maxMemoryMB", Runtime.getRuntime().maxMemory() / BYTES_PER_MB);
        diagnostics.put("uptimeMs", ManagementFactory.getRuntimeMXBean().getUptime());
        diagnostics.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(ApiResponse.success(diagnostics, "Diagnostics retrieved successfully"));
    }

    private Map<String, Object> checkDatabase() {
        final Map<String, Object> result = new LinkedHashMap<>();
        try {
            final var jdbc = dataSource.getConnection();
            try {
                final var stmt = jdbc.createStatement();
                final var rs = stmt.executeQuery("SELECT 1");
                rs.next();
                result.put("status", "UP");
                result.put("message", "Database connection is healthy");
            } finally {
                jdbc.close();
            }
        } catch (final Exception e) {
            result.put("status", "DOWN");
            result.put("message", "Database connection failed: " + e.getMessage());
        }
        return result;
    }

    private Map<String, Object> checkRedis() {
        final Map<String, Object> result = new LinkedHashMap<>();
        try {
            final var connection = redisTemplate.getConnectionFactory().getConnection();
            try {
                connection.ping();
                result.put("status", "UP");
                result.put("message", "Redis connection is healthy");
            } finally {
                connection.close();
            }
        } catch (final Exception e) {
            result.put("status", "DOWN");
            result.put("message", "Redis connection failed: " + e.getMessage());
        }
        return result;
    }

    private Map<String, Object> checkDisk() {
        final Map<String, Object> result = new LinkedHashMap<>();
        final var file = new java.io.File("/");
        final long freeGB = file.getFreeSpace() / (1024 * 1024 * 1024);
        result.put("status", freeGB > 1 ? "UP" : "DOWN");
        result.put("freeSpaceGB", freeGB);
        return result;
    }

    private String getVersionFromManifest() {
        final var version = getClass().getPackage().getImplementationVersion();
        return version != null ? version : "1.0.0-SNAPSHOT";
    }

    private String getHostname() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (final Exception e) {
            return "unknown";
        }
    }
}
