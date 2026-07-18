package com.backofficepro.surveyplatform.survey.infrastructure.persistence;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA entity for survey persistence.
 *
 * @author BackOffice Pro
 */
@Getter
@Setter
@Entity
@Table(name = "surveys", schema = "survey")
public class SurveyJpaEntity extends BaseEntity {

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "creator_id", nullable = false)
    private String creatorId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "is_anonymous", nullable = false)
    private boolean anonymous;

    @Column(name = "max_responses")
    private Integer maxResponses;

    @Column(name = "response_count", nullable = false)
    private int responseCount;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @Column(name = "closed_at")
    private LocalDateTime closedAt;

    @OneToMany(mappedBy = "survey", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<QuestionJpaEntity> questions = new ArrayList<>();
}
