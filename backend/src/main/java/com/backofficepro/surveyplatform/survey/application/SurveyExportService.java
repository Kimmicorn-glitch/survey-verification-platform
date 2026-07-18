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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SurveyExportService {

    private static final Logger log = LoggerFactory.getLogger(SurveyExportService.class);

    private final SurveyRepository surveyRepository;
    private final SurveyResponseRepository responseRepository;

    public SurveyExportService(final SurveyRepository surveyRepository,
                                final SurveyResponseRepository responseRepository) {
        this.surveyRepository = surveyRepository;
        this.responseRepository = responseRepository;
    }

    public byte[] exportToCsv(final String surveyId) {
        final Survey survey = getSurveyOrThrow(surveyId);
        final List<SurveyResponse> responses = responseRepository.findBySurveyIdAndDeletedFalse(UUID.fromString(surveyId));

        final StringBuilder csv = new StringBuilder();
        final List<Question> questions = survey.getQuestions();

        csv.append("Response ID,Respondent ID,Session ID,Timestamp");
        for (final Question q : questions) {
            csv.append(",").append(escapeCsv(q.getText()));
        }
        csv.append("\n");

        final Map<String, List<SurveyResponse>> grouped = responses.stream()
                .filter(r -> r.getRespondentId() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getRespondentId() + "|" + (r.getSessionId() != null ? r.getSessionId() : ""),
                        LinkedHashMap::new,
                        Collectors.toList()));

        for (final Map.Entry<String, List<SurveyResponse>> entry : grouped.entrySet()) {
            final List<SurveyResponse> group = entry.getValue();
            final SurveyResponse first = group.get(0);
            csv.append(first.getId()).append(",");
            csv.append(first.getRespondentId() != null ? first.getRespondentId() : "").append(",");
            csv.append(first.getSessionId() != null ? first.getSessionId() : "").append(",");
            csv.append(first.getRespondedAt() != null ? first.getRespondedAt() : "").append(",");

            final Map<UUID, String> answerMap = new LinkedHashMap<>();
            for (final SurveyResponse r : group) {
                if (r.getQuestion() != null) {
                    answerMap.put(r.getQuestion().getId(), getAnswerValue(r));
                }
            }

            for (final Question q : questions) {
                csv.append(escapeCsv(answerMap.getOrDefault(q.getId(), ""))).append(",");
            }
            csv.append("\n");
        }

        log.info("Exported {} responses to CSV for survey {}", grouped.size(), surveyId);
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public Map<String, Object> exportToJson(final String surveyId) {
        final Survey survey = getSurveyOrThrow(surveyId);
        final List<SurveyResponse> responses = responseRepository.findBySurveyIdAndDeletedFalse(UUID.fromString(surveyId));

        final Map<String, Object> export = new LinkedHashMap<>();
        export.put("surveyId", surveyId);
        export.put("title", survey.getTitle());
        export.put("description", survey.getDescription());
        export.put("totalResponses", responses.size());
        export.put("exportedAt", java.time.LocalDateTime.now().toString());

        final List<Map<String, Object>> questionDefinitions = new ArrayList<>();
        for (final Question q : survey.getQuestions()) {
            final Map<String, Object> qDef = new LinkedHashMap<>();
            qDef.put("id", q.getId().toString());
            qDef.put("text", q.getText());
            qDef.put("type", q.getQuestionType());
            qDef.put("required", q.isRequired());
            questionDefinitions.add(qDef);
        }
        export.put("questions", questionDefinitions);

        final List<Map<String, Object>> responseData = new ArrayList<>();
        final Map<String, List<SurveyResponse>> grouped = responses.stream()
                .filter(r -> r.getRespondentId() != null)
                .collect(Collectors.groupingBy(
                        r -> r.getRespondentId() + "|" + (r.getSessionId() != null ? r.getSessionId() : "")));

        for (final Map.Entry<String, List<SurveyResponse>> entry : grouped.entrySet()) {
            final List<SurveyResponse> group = entry.getValue();
            final Map<String, Object> row = new LinkedHashMap<>();
            row.put("respondentId", group.get(0).getRespondentId());
            row.put("timestamp", group.get(0).getRespondedAt() != null ? group.get(0).getRespondedAt().toString() : null);

            final Map<String, String> answers = new LinkedHashMap<>();
            for (final SurveyResponse r : group) {
                if (r.getQuestion() != null) {
                    answers.put(r.getQuestion().getId().toString(), getAnswerValue(r));
                }
            }
            row.put("answers", answers);
            responseData.add(row);
        }
        export.put("responses", responseData);

        return export;
    }

    private Survey getSurveyOrThrow(final String surveyId) {
        return surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));
    }

    private String getAnswerValue(final SurveyResponse response) {
        if (response.getTextAnswer() != null) return response.getTextAnswer();
        if (response.getNumericAnswer() != null) return String.valueOf(response.getNumericAnswer());
        if (response.getSelectedOptionId() != null) return response.getSelectedOptionId();
        return "";
    }

    private String escapeCsv(final String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
