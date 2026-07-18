package com.backofficepro.surveyplatform.survey.application.mapper;

import com.backofficepro.surveyplatform.survey.application.dto.request.CreateSurveyRequest;
import com.backofficepro.surveyplatform.survey.application.dto.response.SurveyResponse;
import com.backofficepro.surveyplatform.survey.domain.Question;
import com.backofficepro.surveyplatform.survey.domain.QuestionOption;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * MapStruct mapper for converting between Survey domain entities and DTOs.
 *
 * @author BackOffice Pro
 */
@Mapper(componentModel = "spring")
public interface SurveyMapper {

    /**
     * Maps a Survey domain entity to a SurveyResponse DTO.
     *
     * @param survey the Survey entity
     * @return the SurveyResponse DTO
     */
    @Mapping(target = "questions", source = "questions", qualifiedByName = "mapQuestions")
    SurveyResponse toResponse(Survey survey);

    /**
     * Maps a list of Survey entities to a list of SurveyResponse DTOs.
     *
     * @param surveys the list of Survey entities
     * @return the list of SurveyResponse DTOs
     */
    List<SurveyResponse> toResponseList(List<Survey> surveys);

    /**
     * Converts a list of Question entities to QuestionResponse DTOs.
     *
     * @param questions the list of Question entities
     * @return the list of QuestionResponse DTOs
     */
    @Named("mapQuestions")
    default List<SurveyResponse.QuestionResponse> mapQuestions(final List<Question> questions) {
        if (questions == null) {
            return Collections.emptyList();
        }
        return questions.stream()
                .map(q -> SurveyResponse.QuestionResponse.builder()
                        .id(q.getId())
                        .text(q.getText())
                        .description(q.getDescription())
                        .questionType(q.getQuestionType())
                        .required(q.isRequired())
                        .sortOrder(q.getSortOrder())
                        .options(mapOptions(q.getOptions()))
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Converts a list of QuestionOption entities to OptionResponse DTOs.
     *
     * @param options the list of QuestionOption entities
     * @return the list of OptionResponse DTOs
     */
    default List<SurveyResponse.OptionResponse> mapOptions(final List<QuestionOption> options) {
        if (options == null) {
            return Collections.emptyList();
        }
        return options.stream()
                .map(o -> SurveyResponse.OptionResponse.builder()
                        .id(o.getId())
                        .text(o.getText())
                        .value(o.getValue())
                        .sortOrder(o.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }
}
