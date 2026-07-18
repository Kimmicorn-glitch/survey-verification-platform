package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.SurveyResponse;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyResponseRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SurveyAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(SurveyAnalyticsService.class);

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;

    public SurveyAnalyticsService(final SurveyRepository surveyRepository,
                                   final SurveyResponseRepository responseRepository) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
    }

    public Map<String, Object> getSurveyAnalytics(final String surveyId) {
        final UUID id = UUID.fromString(surveyId);
        final Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));

        final Map<String, Object> analytics = new HashMap<>();
        analytics.put("surveyId", id.toString());
        analytics.put("title", survey.getTitle());
        analytics.put("status", survey.getStatus());
        analytics.put("totalResponses", survey.getResponseCount());
        analytics.put("maxResponses", survey.getMaxResponses());
        analytics.put("uniqueRespondents", responseRepository.countDistinctRespondentsBySurveyId(id));
        analytics.put("questionCount", survey.getQuestions().size());

        final List<Map<String, Object>> questionAnalytics = new ArrayList<>();
        // TODO: N+1 query issue - analyzeQuestion() executes multiple repository queries per question.
        // Optimization: use a single grouped query (e.g., GROUP BY questionId) to fetch all answer
        // counts/statistics in one pass instead of one query per question.
        for (final Question question : survey.getQuestions()) {
            final Map<String, Object> qAnalytics = analyzeQuestion(id, question);
            questionAnalytics.add(qAnalytics);
        }
        analytics.put("questions", questionAnalytics);

        analytics.put("responseTimeline", getResponseTimeline(id));
        analytics.put("completionRate", calculateCompletionRate(id, survey));
        analytics.put("averageTimeToComplete", calculateAverageCompletionTime(id));

        return analytics;
    }

    public Map<String, Object> getQuestionAnalytics(final String surveyId, final String questionId) {
        final UUID sId = UUID.fromString(surveyId);
        final UUID qId = UUID.fromString(questionId);

        final Survey survey = surveyRepository.findById(sId)
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));

        final Question question = survey.getQuestions().stream()
                .filter(q -> q.getId().equals(qId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Question", questionId));

        return analyzeQuestion(sId, question);
    }

    public Map<String, Object> getResponseTimeline(final String surveyId) {
        final UUID id = UUID.fromString(surveyId);
        return getResponseTimeline(id);
    }

    public Map<String, Object> getOverviewAnalytics() {
        final Map<String, Object> overview = new HashMap<>();
        overview.put("totalSurveys", surveyRepository.count());
        overview.put("activeSurveys", countActiveSurveys());
        overview.put("totalResponses", getTotalResponses());
        overview.put("recentActivity", getRecentActivity());
        return overview;
    }

    private Map<String, Object> analyzeQuestion(final UUID surveyId, final Question question) {
        final Map<String, Object> analysis = new HashMap<>();
        analysis.put("questionId", question.getId().toString());
        analysis.put("text", question.getText());
        analysis.put("type", question.getQuestionType());
        analysis.put("required", question.isRequired());
        analysis.put("totalAnswers", responseRepository
                .findBySurveyIdAndQuestionIdAndDeletedFalse(surveyId, question.getId()).size());

        final String type = question.getQuestionType();
        if ("TEXT".equals(type)) {
            final List<Object[]> textCounts = responseRepository.countTextAnswersByQuestion(surveyId, question.getId());
            final List<Map<String, Object>> distribution = textCounts.stream()
                    .limit(10)
                    .map(row -> {
                        final Map<String, Object> item = new HashMap<>();
                        item.put("answer", row[0]);
                        item.put("count", row[1]);
                        return item;
                    })
                    .collect(Collectors.toList());
            analysis.put("distribution", distribution);
        } else if ("RATING".equals(type) || "SCALE".equals(type)) {
            final List<Object[]> numericCounts = responseRepository.countNumericAnswersByQuestion(surveyId, question.getId());
            final Double average = responseRepository.averageNumericAnswerByQuestion(surveyId, question.getId());
            analysis.put("average", average != null ? Math.round(average * 100.0) / 100.0 : 0);
            final List<Map<String, Object>> distribution = numericCounts.stream()
                    .map(row -> {
                        final Map<String, Object> item = new HashMap<>();
                        item.put("value", row[0]);
                        item.put("count", row[1]);
                        return item;
                    })
                    .collect(Collectors.toList());
            analysis.put("distribution", distribution);
        } else if ("SINGLE_CHOICE".equals(type) || "MULTIPLE_CHOICE".equals(type) || "YES_NO".equals(type)) {
            final List<Object[]> choiceCounts = responseRepository.countChoiceAnswersByQuestion(surveyId, question.getId());
            final long total = choiceCounts.stream().mapToLong(row -> (Long) row[1]).sum();
            final List<Map<String, Object>> distribution = choiceCounts.stream()
                    .map(row -> {
                        final Map<String, Object> item = new HashMap<>();
                        item.put("optionId", row[0]);
                        item.put("count", row[1]);
                        item.put("percentage", total > 0 ? Math.round((Long) row[1] * 100.0 / total) : 0);
                        return item;
                    })
                    .collect(Collectors.toList());
            analysis.put("distribution", distribution);
        }

        return analysis;
    }

    private Map<String, Object> getResponseTimeline(final UUID surveyId) {
        final Map<String, Object> timeline = new HashMap<>();
        final List<Map<String, Object>> hourly = new ArrayList<>();
        final LocalDateTime now = LocalDateTime.now();
        for (int i = 23; i >= 0; i--) {
            final LocalDateTime hourStart = now.minusHours(i).withMinute(0).withSecond(0).withNano(0);
            final LocalDateTime hourEnd = hourStart.plusHours(1);
            final List<SurveyResponse> responses = responseRepository.findBySurveyIdAndDateRange(surveyId, hourStart, hourEnd);
            final Map<String, Object> point = new HashMap<>();
            point.put("time", hourStart.toLocalTime().withMinute(0).toString());
            point.put("count", responses.size());
            hourly.add(point);
        }
        timeline.put("hourly", hourly);

        final List<Map<String, Object>> daily = new ArrayList<>();
        for (int i = 29; i >= 0; i--) {
            final LocalDateTime dayStart = now.minusDays(i).toLocalDate().atStartOfDay();
            final LocalDateTime dayEnd = dayStart.plusDays(1);
            final List<SurveyResponse> responses = responseRepository.findBySurveyIdAndDateRange(surveyId, dayStart, dayEnd);
            final Map<String, Object> point = new HashMap<>();
            point.put("date", dayStart.toLocalDate().toString());
            point.put("count", responses.size());
            daily.add(point);
        }
        timeline.put("daily", daily);

        return timeline;
    }

    private double calculateCompletionRate(final UUID surveyId, final Survey survey) {
        if (survey.getMaxResponses() == null || survey.getMaxResponses() == 0) return 100.0;
        return Math.round((double) survey.getResponseCount() / survey.getMaxResponses() * 10000.0) / 100.0;
    }

    private double calculateAverageCompletionTime(final UUID surveyId) {
        return 0.0;
    }

    private long countActiveSurveys() {
        return 0L;
    }

    private long getTotalResponses() {
        return 0L;
    }

    private List<Map<String, Object>> getRecentActivity() {
        return new ArrayList<>();
    }
}
