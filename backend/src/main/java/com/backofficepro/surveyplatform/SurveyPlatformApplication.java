package com.backofficepro.surveyplatform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main entry point for the Survey Verification Platform backend application.
 *
 * <p>This Spring Boot application provides a complete enterprise-grade backend
 * for survey creation, verification, NFT minting, wallet management, and
 * payment processing with AI governance capabilities.</p>
 *
 * @author BackOffice Pro
 * @version 1.0.0
 */
@SpringBootApplication
@EnableJpaAuditing
@EnableCaching
@EnableAsync
@EnableScheduling
@EnableConfigurationProperties
public class SurveyPlatformApplication {

    /**
     * Application entry point.
     *
     * @param args command-line arguments
     */
    public static void main(final String[] args) {
        SpringApplication.run(SurveyPlatformApplication.class, args);
    }
}
