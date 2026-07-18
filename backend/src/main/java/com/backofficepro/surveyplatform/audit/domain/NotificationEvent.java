package com.backofficepro.surveyplatform.audit.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Table(name = "notification_events", schema = "audit")
public class NotificationEvent extends BaseEntity {

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false, length = 50)
    private String type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(nullable = false, length = 20)
    private String channel;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(columnDefinition = "jsonb")
    private String metadata;

    private LocalDateTime readAt;

    private LocalDateTime sentAt;

    public static NotificationEvent create(String userId, String type, String title, String message, String channel) {
        NotificationEvent event = NotificationEvent.builder()
                .userId(userId)
                .type(type)
                .title(title)
                .message(message)
                .channel(channel)
                .status("UNREAD")
                .build();
        event.markAsSent();
        return event;
    }

    public void markAsRead() {
        this.status = "READ";
        this.readAt = LocalDateTime.now();
    }

    public void archive() {
        this.status = "ARCHIVED";
    }

    private void markAsSent() {
        this.sentAt = LocalDateTime.now();
    }
}
