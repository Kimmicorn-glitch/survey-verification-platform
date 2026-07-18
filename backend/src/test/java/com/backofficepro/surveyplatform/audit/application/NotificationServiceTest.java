package com.backofficepro.surveyplatform.audit.application;

import com.backofficepro.surveyplatform.audit.domain.NotificationEvent;
import com.backofficepro.surveyplatform.audit.domain.repository.NotificationEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

    @Mock
    private NotificationEventRepository notificationEventRepository;

    @InjectMocks
    private NotificationService notificationService;

    private static final String USER_ID = "user-123";

    @Test
    void testCreateNotification_Success() {
        when(notificationEventRepository.save(any(NotificationEvent.class)))
                .thenAnswer(inv -> {
                    final NotificationEvent event = inv.getArgument(0);
                    event.setId(1L);
                    return event;
                });

        notificationService.createNotification(
                USER_ID, "SURVEY_PUBLISHED", "Survey Published",
                "Your survey has been published", "IN_APP");

        verify(notificationEventRepository).save(any(NotificationEvent.class));
    }

    @Test
    void testGetNotifications_ReturnsPage() {
        final NotificationEvent event = NotificationEvent.create(
                USER_ID, "SURVEY_PUBLISHED", "Published",
                "Your survey is live", "IN_APP");
        event.setId(1L);

        final Page<NotificationEvent> page = new PageImpl<>(
                List.of(event), PageRequest.of(0, 10), 1);

        when(notificationEventRepository.findByUserIdOrderByCreatedAtDesc(
                eq(USER_ID), any(PageRequest.class)))
                .thenReturn(page);

        final Page<NotificationEvent> result = notificationService.getNotifications(
                USER_ID, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getType()).isEqualTo("SURVEY_PUBLISHED");
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Published");
    }

    @Test
    void testGetUnreadCount_ReturnsCount() {
        when(notificationEventRepository.countByUserIdAndStatus(USER_ID, "UNREAD"))
                .thenReturn(5L);

        final long result = notificationService.getUnreadCount(USER_ID);

        assertThat(result).isEqualTo(5L);
        verify(notificationEventRepository).countByUserIdAndStatus(USER_ID, "UNREAD");
    }

    @Test
    void testMarkAsRead_Success() {
        notificationService.markAsRead(1L);

        verify(notificationEventRepository).markAsReadById(1L);
    }

    @Test
    void testMarkAllAsRead_Success() {
        final NotificationEvent unread1 = NotificationEvent.create(
                USER_ID, "TYPE_A", "Title 1", "Message 1", "IN_APP");
        unread1.setId(1L);

        final NotificationEvent unread2 = NotificationEvent.create(
                USER_ID, "TYPE_B", "Title 2", "Message 2", "EMAIL");
        unread2.setId(2L);

        when(notificationEventRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                USER_ID, "UNREAD"))
                .thenReturn(List.of(unread1, unread2));
        when(notificationEventRepository.save(any(NotificationEvent.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        notificationService.markAllAsRead(USER_ID);

        verify(notificationEventRepository, org.mockito.Mockito.times(2))
                .save(any(NotificationEvent.class));
        assertThat(unread1.getStatus()).isEqualTo("READ");
        assertThat(unread2.getStatus()).isEqualTo("READ");
    }

    @Test
    void testGetUnreadCount_NoUnread_ReturnsZero() {
        when(notificationEventRepository.countByUserIdAndStatus(USER_ID, "UNREAD"))
                .thenReturn(0L);

        final long result = notificationService.getUnreadCount(USER_ID);

        assertThat(result).isZero();
    }

    @Test
    void testGetNotifications_EmptyPage() {
        when(notificationEventRepository.findByUserIdOrderByCreatedAtDesc(
                eq(USER_ID), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0));

        final Page<NotificationEvent> result = notificationService.getNotifications(
                USER_ID, 0, 10);

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }
}
