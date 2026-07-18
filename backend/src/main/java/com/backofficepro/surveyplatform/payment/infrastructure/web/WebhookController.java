package com.backofficepro.surveyplatform.payment.infrastructure.web;

import com.backofficepro.surveyplatform.payment.application.InvoiceService;
import com.backofficepro.surveyplatform.payment.application.SubscriptionService;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/webhooks/stripe")
@Tag(name = "Stripe Webhooks", description = "Stripe webhook event handlers")
public class WebhookController {

    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);

    private final SubscriptionService subscriptionService;
    private final InvoiceService invoiceService;
    private final ObjectMapper objectMapper;

    public WebhookController(final SubscriptionService subscriptionService,
                             final InvoiceService invoiceService,
                             final ObjectMapper objectMapper) {
        this.subscriptionService = subscriptionService;
        this.invoiceService = invoiceService;
        this.objectMapper = objectMapper;
    }

    @PostMapping
    @Operation(summary = "Handle Stripe webhook", description = "Processes Stripe webhook events")
    // TODO: MUST implement Stripe webhook signature verification before production deployment.
    // Use Stripe Webhook.constructEvent(payload, sigHeader, webhookSecret) to verify the
    // 'Stripe-Signature' header and reject unsigned/tampered payloads. Without this, anyone
    // can send fake webhook events to this endpoint.
    public ResponseEntity<ApiResponse<String>> handleWebhook(@RequestBody final String payload) {
        try {
            final JsonNode event = objectMapper.readTree(payload);
            final String eventType = event.path("type").asText();
            final JsonNode data = event.path("data").path("object");

            log.info("Received Stripe webhook event: {}", eventType);

            switch (eventType) {
                case "checkout.session.completed" -> handleCheckoutSessionCompleted(data);
                case "invoice.paid" -> handleInvoicePaid(data);
                case "invoice.payment_failed" -> handleInvoicePaymentFailed(data);
                case "customer.subscription.updated" -> handleSubscriptionUpdated(data);
                case "customer.subscription.deleted" -> handleSubscriptionDeleted(data);
                default -> log.debug("Unhandled Stripe event type: {}", eventType);
            }

            return ResponseEntity.ok(ApiResponse.success("Webhook processed", "Event handled successfully"));
        } catch (final Exception e) {
            log.error("Failed to process Stripe webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Webhook processing failed: " + e.getMessage()));
        }
    }

    private void handleCheckoutSessionCompleted(final JsonNode data) {
        final String subscriptionId = data.path("subscription").asText(null);
        final String customerId = data.path("customer").asText(null);
        final String userId = data.path("client_reference_id").asText(null);

        log.info("Checkout completed for user {} subscription {} customer {}",
                userId, subscriptionId, customerId);

        if (subscriptionId != null && userId != null) {
            subscriptionService.syncSubscriptionStatus(subscriptionId, "ACTIVE");
        }
    }

    private void handleInvoicePaid(final JsonNode data) {
        final String stripeInvoiceId = data.path("id").asText(null);
        final String paymentIntentId = data.path("payment_intent").asText(null);
        final String subscriptionId = data.path("subscription").asText(null);

        log.info("Invoice paid: Stripe invoice {} payment intent {} subscription {}",
                stripeInvoiceId, paymentIntentId, subscriptionId);

        if (stripeInvoiceId != null) {
            invoiceService.syncInvoiceStatus(stripeInvoiceId, "paid");
        }

        if (subscriptionId != null) {
            subscriptionService.syncSubscriptionStatus(subscriptionId, "ACTIVE");
        }
    }

    private void handleInvoicePaymentFailed(final JsonNode data) {
        final String stripeInvoiceId = data.path("id").asText(null);
        final String subscriptionId = data.path("subscription").asText(null);

        log.warn("Invoice payment failed: Stripe invoice {} subscription {}",
                stripeInvoiceId, subscriptionId);

        if (stripeInvoiceId != null) {
            invoiceService.syncInvoiceStatus(stripeInvoiceId, "uncollectible");
        }

        if (subscriptionId != null) {
            subscriptionService.syncSubscriptionStatus(subscriptionId, "PAST_DUE");
        }
    }

    private void handleSubscriptionUpdated(final JsonNode data) {
        final String stripeSubscriptionId = data.path("id").asText(null);
        final String status = data.path("status").asText(null);

        log.info("Subscription updated: Stripe subscription {} status {}",
                stripeSubscriptionId, status);

        if (stripeSubscriptionId != null && status != null) {
            subscriptionService.syncSubscriptionStatus(stripeSubscriptionId, status.toUpperCase());
        }
    }

    private void handleSubscriptionDeleted(final JsonNode data) {
        final String stripeSubscriptionId = data.path("id").asText(null);

        log.info("Subscription deleted: Stripe subscription {}", stripeSubscriptionId);

        if (stripeSubscriptionId != null) {
            subscriptionService.syncSubscriptionStatus(stripeSubscriptionId, "CANCELED");
        }
    }
}
