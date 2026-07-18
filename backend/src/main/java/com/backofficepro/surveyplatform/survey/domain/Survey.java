package com.backofficepro.surveyplatform.survey.domain;

import com.backofficepro.surveyplatform.shared.domain.AggregateRoot;
import com.backofficepro.surveyplatform.shared.domain.exception.BusinessRuleValidationException;
import com.backofficepro.surveyplatform.survey.domain.event.SurveyCreatedEvent;
import com.backofficepro.surveyplatform.survey.domain.event.SurveyPublishedEvent;
import com.backofficepro.surveyplatform.survey.domain.event.SurveyClosedEvent;
import com.backofficepro.surveyplatform.survey.domain.valueobject.SurveyStatus;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Survey aggregate root representing a survey in the system.
 *
 * @author BackOffice Pro
 */
@Getter
@Entity
@Table(name = "surveys", schema = "survey")
public class Survey extends AggregateRoot {

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
    private List<Question> questions = new ArrayList<>();

    protected Survey() {
        super();
    }

    /**
     * Creates a new survey.
     *
     * @param title       the survey title
     * @param description the survey description
     * @param creatorId   the creator's user identifier
     * @param anonymous   whether the survey is anonymous
     * @return the new Survey aggregate
     */
    public static Survey create(final String title,
                                final String description,
                                final String creatorId,
                                final boolean anonymous) {
        if (title == null || title.isBlank()) {
            throw new BusinessRuleValidationException(
                    "SurveyTitleRequired", "Survey title must not be blank");
        }
        final Survey survey = new Survey();
        survey.title = title.trim();
        survey.description = description;
        survey.creatorId = creatorId;
        survey.status = SurveyStatus.DRAFT.getValue();
        survey.anonymous = anonymous;
        survey.responseCount = 0;
        survey.registerEvent(new SurveyCreatedEvent(null, title, creatorId));
        return survey;
    }

    /**
     * Adds a question to the survey.
     *
     * @param question the question to add
     */
    public void addQuestion(final Question question) {
        if (!SurveyStatus.DRAFT.getValue().equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "SurveyNotEditable",
                    "Questions can only be added to surveys in DRAFT status");
        }
        question.setSurvey(this);
        question.setSortOrder(this.questions.size() + 1);
        this.questions.add(question);
    }

    /**
     * Removes a question from the survey.
     *
     * @param questionId the question identifier
     */
    public void removeQuestion(final String questionId) {
        if (!SurveyStatus.DRAFT.getValue().equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "SurveyNotEditable",
                    "Questions can only be removed from surveys in DRAFT status");
        }
        this.questions.removeIf(q -> q.getId() != null && q.getId().toString().equals(questionId));
    }

    /**
     * Publishes the survey, making it available for responses.
     */
    public void publish() {
        if (!SurveyStatus.DRAFT.getValue().equals(this.status)) {
            throw new BusinessRuleValidationException(
                    "SurveyCannotPublish",
                    "Only surveys in DRAFT status can be published");
        }
        if (this.questions.isEmpty()) {
            throw new BusinessRuleValidationException(
                    "SurveyNoQuestions",
                    "Cannot publish a survey without questions");
        }
        this.status = SurveyStatus.ACTIVE.getValue();
        this.publishedAt = LocalDateTime.now();
        this.startsAt = LocalDateTime.now();
        registerEvent(new SurveyPublishedEvent(
                getId().toString(), title, creatorId, this.questions.size()));
    }

    /**
     * Pauses the survey.
     */
    public void pause() {
        final SurveyStatus current = SurveyStatus.of(this.status);
        this.status = current.transitionTo(SurveyStatus.PAUSED).getValue();
    }

    /**
     * Resumes a paused survey.
     */
    public void resume() {
        final SurveyStatus current = SurveyStatus.of(this.status);
        this.status = current.transitionTo(SurveyStatus.ACTIVE).getValue();
    }

    /**
     * Closes the survey, preventing further responses.
     */
    public void close() {
        final SurveyStatus current = SurveyStatus.of(this.status);
        this.status = current.transitionTo(SurveyStatus.CLOSED).getValue();
        this.closedAt = LocalDateTime.now();
        registerEvent(new SurveyClosedEvent(getId().toString(), title, creatorId));
    }

    /**
     * Archives the survey.
     */
    public void archive() {
        final SurveyStatus current = SurveyStatus.of(this.status);
        this.status = current.transitionTo(SurveyStatus.ARCHIVED).getValue();
    }

    /**
     * Increments the response count.
     */
    public void incrementResponseCount() {
        if (maxResponses != null && responseCount >= maxResponses) {
            throw new BusinessRuleValidationException(
                    "SurveyMaxResponses",
                    "Survey has reached maximum response limit");
        }
        this.responseCount++;
    }

    /**
     * Checks if the survey is currently accepting responses.
     *
     * @return true if the survey is active and within the response window
     */
    public boolean isAcceptingResponses() {
        if (!SurveyStatus.ACTIVE.getValue().equals(this.status)) {
            return false;
        }
        if (endsAt != null && LocalDateTime.now().isAfter(endsAt)) {
            return false;
        }
        return maxResponses == null || responseCount < maxResponses;
    }
}
