package com.backofficepro.surveyplatform.payment.domain.repository;

import com.backofficepro.surveyplatform.payment.domain.PaymentHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, UUID> {

    Page<PaymentHistory> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    List<PaymentHistory> findByInvoiceId(UUID invoiceId);

    Optional<PaymentHistory> findByStripePaymentId(String stripePaymentId);

    Page<PaymentHistory> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status, Pageable pageable);
}
