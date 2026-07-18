package com.backofficepro.surveyplatform.audit.domain.repository;

import com.backofficepro.surveyplatform.audit.domain.NotificationEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationEventRepository extends JpaRepository<NotificationEvent, Long> {

    List<NotificationEvent> findByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);

    long countByUserIdAndStatus(String userId, String status);

    Page<NotificationEvent> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    @Modifying
    @Query("UPDATE NotificationEvent n SET n.status = 'READ', n.readAt = CURRENT_TIMESTAMP WHERE n.id = :id")
    void markAsReadById(@Param("id") Long id);

    void deleteByStatusAndCreatedAtBefore(String status, LocalDateTime createdAt);
}
