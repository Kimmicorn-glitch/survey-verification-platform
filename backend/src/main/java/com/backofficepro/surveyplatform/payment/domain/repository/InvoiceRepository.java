package com.backofficepro.surveyplatform.payment.domain.repository;

import com.backofficepro.surveyplatform.payment.domain.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID> {

    Page<Invoice> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Optional<Invoice> findByInvoiceNumber(String invoiceNumber);

    long countByStatus(String status);

    Optional<Invoice> findByStripeInvoiceId(String stripeInvoiceId);

    @Query("SELECT i FROM Invoice i WHERE i.userId = :userId AND i.status = :status ORDER BY i.createdAt DESC")
    Page<Invoice> findByUserIdAndStatus(@Param("userId") String userId,
                                        @Param("status") String status,
                                        Pageable pageable);

    @Query("SELECT COUNT(i) FROM Invoice i WHERE i.userId = :userId")
    long countByUserId(@Param("userId") String userId);
}
