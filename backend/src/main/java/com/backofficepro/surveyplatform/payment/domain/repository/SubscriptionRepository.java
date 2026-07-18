package com.backofficepro.surveyplatform.payment.domain.repository;

import com.backofficepro.surveyplatform.payment.domain.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, UUID> {

    Optional<Subscription> findByUserIdAndStatus(String userId, String status);

    List<Subscription> findByUserId(String userId);

    Optional<Subscription> findByStripeSubscriptionId(String stripeSubscriptionId);

    Optional<Subscription> findByStripeCustomerId(String stripeCustomerId);

    boolean existsByUserIdAndStatus(String userId, String status);

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.currentPeriodEnd < CURRENT_TIMESTAMP")
    List<Subscription> findExpiredSubscriptions();

    @Query("SELECT s FROM Subscription s WHERE s.status = 'ACTIVE' AND s.usageResetAt < CURRENT_TIMESTAMP")
    List<Subscription> findSubscriptionsNeedingUsageReset();
}
