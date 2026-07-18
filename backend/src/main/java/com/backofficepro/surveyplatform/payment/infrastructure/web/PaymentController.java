package com.backofficepro.surveyplatform.payment.infrastructure.web;

import com.backofficepro.surveyplatform.payment.application.InvoiceService;
import com.backofficepro.surveyplatform.payment.application.SubscriptionService;
import com.backofficepro.surveyplatform.payment.domain.Invoice;
import com.backofficepro.surveyplatform.payment.domain.Subscription;
import com.backofficepro.surveyplatform.shared.infrastructure.web.ApiResponse;
import com.backofficepro.surveyplatform.shared.infrastructure.web.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@Tag(name = "Payments", description = "Payment and subscription management endpoints")
public class PaymentController {

    private final SubscriptionService subscriptionService;
    private final InvoiceService invoiceService;

    public PaymentController(final SubscriptionService subscriptionService,
                             final InvoiceService invoiceService) {
        this.subscriptionService = subscriptionService;
        this.invoiceService = invoiceService;
    }

    @PostMapping("/subscriptions")
    @Operation(summary = "Create subscription", description = "Creates a new subscription for the authenticated user")
    public ResponseEntity<ApiResponse<Subscription>> createSubscription(
            @Valid @RequestBody final CreateSubscriptionRequest request,
            final Authentication authentication) {
        final Subscription subscription = subscriptionService.createSubscription(
                authentication.getName(), request.plan());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(subscription, "Subscription created successfully"));
    }

    @GetMapping("/subscriptions/{id}")
    @Operation(summary = "Get subscription", description = "Retrieves a subscription by its identifier")
    public ResponseEntity<ApiResponse<Subscription>> getSubscription(@PathVariable final String id) {
        final Subscription subscription = subscriptionService.getSubscription(id);
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    @GetMapping("/subscriptions/me")
    @Operation(summary = "Get my subscription", description = "Retrieves the current user's active subscription")
    public ResponseEntity<ApiResponse<Subscription>> getMySubscription(
            final Authentication authentication) {
        final Subscription subscription = subscriptionService.getUserSubscription(
                authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(subscription));
    }

    @PostMapping("/subscriptions/{id}/cancel")
    @Operation(summary = "Cancel subscription", description = "Cancels an active subscription")
    public ResponseEntity<ApiResponse<Subscription>> cancelSubscription(
            @PathVariable final String id,
            final Authentication authentication) {
        final Subscription subscription = subscriptionService.cancelSubscription(
                authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(subscription, "Subscription canceled successfully"));
    }

    @PostMapping("/subscriptions/{id}/reactivate")
    @Operation(summary = "Reactivate subscription", description = "Reactivates a canceled subscription")
    public ResponseEntity<ApiResponse<Subscription>> reactivateSubscription(
            @PathVariable final String id,
            final Authentication authentication) {
        final Subscription subscription = subscriptionService.reactivateSubscription(
                authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(subscription, "Subscription reactivated successfully"));
    }

    @GetMapping("/invoices")
    @Operation(summary = "List invoices", description = "Lists invoices for the authenticated user")
    public ResponseEntity<ApiResponse<PaginatedResponse<Invoice>>> listInvoices(
            @RequestParam(defaultValue = "0") final int page,
            @RequestParam(defaultValue = "10") final int size,
            final Authentication authentication) {
        final Page<Invoice> invoices = invoiceService.getUserInvoices(
                authentication.getName(), PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success(PaginatedResponse.of(invoices)));
    }

    @GetMapping("/invoices/{id}")
    @Operation(summary = "Get invoice", description = "Retrieves an invoice by its identifier")
    public ResponseEntity<ApiResponse<Invoice>> getInvoice(@PathVariable final String id) {
        final Invoice invoice = invoiceService.getInvoice(id);
        return ResponseEntity.ok(ApiResponse.success(invoice));
    }

    @PostMapping("/invoices/{id}/pay")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @Operation(summary = "Pay invoice", description = "Initiates payment for an invoice")
    public ResponseEntity<ApiResponse<Invoice>> payInvoice(
            @PathVariable final String id,
            final Authentication authentication) {
        final Invoice invoice = invoiceService.processPayment(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(invoice, "Payment processing initiated"));
    }

    public record CreateSubscriptionRequest(
            @NotBlank(message = "Plan is required") String plan
    ) {}
}
