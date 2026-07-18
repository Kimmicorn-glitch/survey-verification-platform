package com.backofficepro.surveyplatform.payment.application;

import com.backofficepro.surveyplatform.payment.domain.Invoice;
import com.backofficepro.surveyplatform.payment.domain.Subscription;
import com.backofficepro.surveyplatform.payment.domain.repository.InvoiceRepository;
import com.backofficepro.surveyplatform.payment.domain.repository.SubscriptionRepository;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubscriptionServiceTest {

    @Mock
    private SubscriptionRepository subscriptionRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private SubscriptionService subscriptionService;

    private static final String USER_ID = "user-123";
    private static final String SUBSCRIPTION_ID_STRING = "550e8400-e29b-41d4-a716-446655440000";
    private static final UUID SUBSCRIPTION_ID = UUID.fromString(SUBSCRIPTION_ID_STRING);

    @Test
    void testCreateSubscription_Success() {
        when(subscriptionRepository.existsByUserIdAndStatus(USER_ID, Subscription.STATUS_ACTIVE))
                .thenReturn(false);
        when(subscriptionRepository.save(any(Subscription.class)))
                .thenAnswer(inv -> {
                    final Subscription sub = inv.getArgument(0);
                    sub.setId(SUBSCRIPTION_ID);
                    return sub;
                });

        final Subscription result = subscriptionService.createSubscription(USER_ID, "FREE");

        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(USER_ID);
        assertThat(result.getPlan()).isEqualTo("FREE");
        assertThat(result.getStatus()).isEqualTo(Subscription.STATUS_ACTIVE);
        verify(subscriptionRepository).save(any(Subscription.class));
    }

    @Test
    void testGetSubscription_NotFound_ThrowsException() {
        when(subscriptionRepository.findById(SUBSCRIPTION_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subscriptionService.getSubscription(SUBSCRIPTION_ID_STRING))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Subscription");
    }

    @Test
    void testCancelSubscription_Success() {
        final Subscription subscription = Subscription.create(USER_ID, "PROFESSIONAL");
        subscription.setId(SUBSCRIPTION_ID);

        when(subscriptionRepository.findById(SUBSCRIPTION_ID)).thenReturn(Optional.of(subscription));
        when(subscriptionRepository.save(any(Subscription.class))).thenReturn(subscription);
        when(invoiceRepository.countByStatus(Invoice.STATUS_PENDING)).thenReturn(0L);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(inv -> inv.getArgument(0));

        try (MockedStatic<Invoice> invoiceMock = mockStatic(Invoice.class)) {
            final Invoice mockInvoice = Invoice.create(
                    USER_ID, SUBSCRIPTION_ID, "INV-202607-0001",
                    BigDecimal.ZERO, "USD");
            mockInvoice.setId(UUID.randomUUID());
            invoiceMock.when(() -> Invoice.create(
                    any(), any(), any(), any(), any()))
                    .thenReturn(mockInvoice);

            final Subscription result = subscriptionService.cancelSubscription(
                    USER_ID, SUBSCRIPTION_ID_STRING);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(Subscription.STATUS_CANCELED);
            verify(subscriptionRepository).save(any(Subscription.class));
        }
    }

    @Test
    void testCheckUsageLimits_WithinLimits() {
        final Subscription subscription = Subscription.create(USER_ID, "FREE");
        subscription.setId(SUBSCRIPTION_ID);

        when(subscriptionRepository.findByUserIdAndStatus(USER_ID, Subscription.STATUS_ACTIVE))
                .thenReturn(Optional.of(subscription));

        final boolean result = subscriptionService.checkUsageLimits(USER_ID);

        assertThat(result).isTrue();
    }

    @Test
    void testCheckUsageLimits_ExceedsLimits_ThrowsException() {
        final Subscription subscription = Subscription.create(USER_ID, "FREE");
        subscription.setId(SUBSCRIPTION_ID);

        for (int i = 0; i < Subscription.DEFAULT_MONTHLY_SURVEYS; i++) {
            subscription.incrementSurveyUsage();
        }

        when(subscriptionRepository.findByUserIdAndStatus(USER_ID, Subscription.STATUS_ACTIVE))
                .thenReturn(Optional.of(subscription));

        final boolean result = subscriptionService.checkUsageLimits(USER_ID);

        assertThat(result).isFalse();
    }

    @Test
    void testCreateSubscription_AlreadyHasActive_ThrowsException() {
        when(subscriptionRepository.existsByUserIdAndStatus(USER_ID, Subscription.STATUS_ACTIVE))
                .thenReturn(true);

        assertThatThrownBy(() -> subscriptionService.createSubscription(USER_ID, "FREE"))
                .isInstanceOf(BusinessRuleValidationException.class)
                .satisfies(ex -> assertThat(
                        ((BusinessRuleValidationException) ex).getRuleName())
                        .isEqualTo("SubscriptionAlreadyExists"));
    }

    @Test
    void testGetUserSubscription_NoActive_ThrowsException() {
        when(subscriptionRepository.findByUserIdAndStatus(USER_ID, Subscription.STATUS_ACTIVE))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> subscriptionService.getUserSubscription(USER_ID))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Subscription");
    }
}
