package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "survey_distributions", schema = "survey")
public class SurveyDistribution extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "survey_id", nullable = false)
    private Survey survey;

    @Column(name = "channel", nullable = false, length = 50)
    private String channel;

    @Column(name = "target", nullable = false, length = 500)
    private String target;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "opened_at")
    private LocalDateTime openedAt;

    @Column(name = "responded_at")
    private LocalDateTime respondedAt;

    @Column(name = "metadata", columnDefinition = "jsonb")
    private String metadata;

    public static SurveyDistribution create(final Survey survey,
                                             final String channel,
                                             final String target) {
        final SurveyDistribution distribution = new SurveyDistribution();
        distribution.survey = survey;
        distribution.channel = channel.toUpperCase();
        distribution.target = target;
        distribution.status = "PENDING";
        return distribution;
    }

    public void markSent() {
        this.status = "SENT";
        this.sentAt = LocalDateTime.now();
    }

    public void markDelivered() {
        this.status = "DELIVERED";
        this.deliveredAt = LocalDateTime.now();
    }

    public void markOpened() {
        this.openedAt = LocalDateTime.now();
    }

    public void markResponded() {
        this.status = "RESPONDED";
        this.respondedAt = LocalDateTime.now();
    }

    public void markFailed(final String reason) {
        this.status = "FAILED";
        this.metadata = reason;
    }
}
