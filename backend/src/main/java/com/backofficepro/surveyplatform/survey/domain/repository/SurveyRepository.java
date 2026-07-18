package com.backofficepro.surveyplatform.survey.domain.repository;

import com.backofficepro.surveyplatform.survey.domain.Survey;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for the Survey aggregate root.
 *
 * @author BackOffice Pro
 */
public interface SurveyRepository {

    /**
     * Finds a survey by its identifier.
     *
     * @param id the survey identifier
     * @return an Optional containing the survey if found
     */
    Optional<Survey> findById(UUID id);

    /**
     * Finds all surveys created by a specific user.
     *
     * @param creatorId the creator's user identifier
     * @param pageable  the pagination parameters
     * @return a page of surveys
     */
    Page<Survey> findByCreatorId(String creatorId, Pageable pageable);

    /**
     * Finds all surveys with the specified status.
     *
     * @param status   the survey status
     * @param pageable the pagination parameters
     * @return a page of surveys
     */
    Page<Survey> findByStatus(String status, Pageable pageable);

    /**
     * Finds all active surveys.
     *
     * @param pageable the pagination parameters
     * @return a page of active surveys
     */
    Page<Survey> findAllActive(Pageable pageable);

    /**
     * Searches surveys by title.
     *
     * @param title    the search term
     * @param pageable the pagination parameters
     * @return a page of matching surveys
     */
    Page<Survey> searchByTitle(String title, Pageable pageable);

    /**
     * Saves a survey entity.
     *
     * @param survey the survey to save
     * @return the saved survey
     */
    Survey save(Survey survey);

    /**
     * Deletes a survey by its identifier.
     *
     * @param id the survey identifier
     */
    void deleteById(UUID id);

    /**
     * Counts the number of responses for a survey.
     *
     * @param surveyId the survey identifier
     * @return the response count
     */
    long countResponses(UUID surveyId);
}
