package com.backofficepro.surveyplatform.audit.application;

import com.backofficepro.surveyplatform.audit.domain.NotificationEvent;
import com.backofficepro.surveyplatform.audit.domain.repository.NotificationEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationEventRepository notificationEventRepository;

    @Async
    public void createNotification(String userId, String type, String title, String message, String channel) {
        NotificationEvent event = NotificationEvent.create(userId, type, title, message, channel);
        notificationEventRepository.save(event);
        log.info("Notification created: userId={}, type={}, channel={}", userId, type, channel);
    }

    @Transactional(readOnly = true)
    public Page<NotificationEvent> getNotifications(String userId, int page, int size) {
        log.debug("Fetching notifications for userId={}, page={}, size={}", userId, page, size);
        return notificationEventRepository.findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(String userId) {
        return notificationEventRepository.countByUserIdAndStatus(userId, "UNREAD");
    }

    public void markAsRead(Long notificationId) {
        notificationEventRepository.markAsReadById(notificationId);
        log.info("Notification marked as read: id={}", notificationId);
    }

    public void markAllAsRead(String userId) {
        var unread = notificationEventRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, "UNREAD");
        for (NotificationEvent event : unread) {
            event.markAsRead();
            notificationEventRepository.save(event);
        }
        log.info("All notifications marked as read for userId={}", userId);
    }

    public void archiveNotification(Long notificationId) {
        notificationEventRepository.findById(notificationId).ifPresent(event -> {
            event.archive();
            notificationEventRepository.save(event);
            log.info("Notification archived: id={}", notificationId);
        });
    }

    public void deleteOldNotifications(int olderThanDays) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(olderThanDays);
        notificationEventRepository.deleteByStatusAndCreatedAtBefore("ARCHIVED", cutoff);
        log.info("Deleted archived notifications older than {} days", olderThanDays);
    }
}
