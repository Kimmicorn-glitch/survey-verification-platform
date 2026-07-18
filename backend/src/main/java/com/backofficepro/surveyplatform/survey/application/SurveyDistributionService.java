package com.backofficepro.surveyplatform.survey.application;

import com.backofficepro.surveyplatform.shared.domain.exception.EntityNotFoundException;
import com.backofficepro.surveyplatform.survey.domain.Survey;
import com.backofficepro.surveyplatform.survey.domain.SurveyDistribution;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyDistributionRepository;
import com.backofficepro.surveyplatform.survey.domain.repository.SurveyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Transactional
public class SurveyDistributionService {

    private static final Logger log = LoggerFactory.getLogger(SurveyDistributionService.class);

    private final SurveyRepository surveyRepository;
    private final SurveyDistributionRepository distributionRepository;

    public SurveyDistributionService(final SurveyRepository surveyRepository,
                                      final SurveyDistributionRepository distributionRepository) {
        this.surveyRepository = surveyRepository;
        this.distributionRepository = distributionRepository;
    }

    public SurveyDistribution distributeSurvey(final String surveyId,
                                                final String channel,
                                                final String target,
                                                final String userId) {
        final Survey survey = surveyRepository.findById(UUID.fromString(surveyId))
                .orElseThrow(() -> new EntityNotFoundException("Survey", surveyId));
        if (!survey.getCreatorId().equals(userId)) {
            throw new com.backofficepro.surveyplatform.shared.domain.exception
                    .BusinessRuleValidationException("Unauthorized", "You are not authorized to distribute this survey");
        }

        final SurveyDistribution distribution = SurveyDistribution.create(survey, channel, target);
        final SurveyDistribution saved = distributionRepository.save(distribution);

        saved.markSent();
        distributionRepository.save(saved);

        log.info("Survey {} distributed via {} to {}", surveyId, channel, target);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<SurveyDistribution> getDistributions(final String surveyId) {
        return distributionRepository.findBySurveyIdAndDeletedFalse(UUID.fromString(surveyId));
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDistributionStats(final String surveyId) {
        final UUID id = UUID.fromString(surveyId);
        final Map<String, Object> stats = new HashMap<>();

        stats.put("total", distributionRepository.countBySurveyIdAndDeletedFalse(id));
        stats.put("sent", distributionRepository.countBySurveyIdAndStatusAndDeletedFalse(id, "SENT"));
        stats.put("delivered", distributionRepository.countBySurveyIdAndStatusAndDeletedFalse(id, "DELIVERED"));
        stats.put("opened", distributionRepository.countBySurveyIdAndStatusAndDeletedFalse(id, "OPENED"));
        stats.put("responded", distributionRepository.countBySurveyIdAndStatusAndDeletedFalse(id, "RESPONDED"));
        stats.put("failed", distributionRepository.countBySurveyIdAndStatusAndDeletedFalse(id, "FAILED"));

        final List<Object[]> channelCounts = distributionRepository.countByChannelForSurvey(id);
        final Map<String, Long> byChannel = new HashMap<>();
        for (final Object[] row : channelCounts) {
            byChannel.put((String) row[0], (Long) row[1]);
        }
        stats.put("byChannel", byChannel);

        return stats;
    }

    public void markDelivered(final String distributionId) {
        final SurveyDistribution dist = distributionRepository.findById(UUID.fromString(distributionId))
                .orElseThrow(() -> new EntityNotFoundException("Distribution", distributionId));
        dist.markDelivered();
        distributionRepository.save(dist);
    }

    public void markOpened(final String distributionId) {
        final SurveyDistribution dist = distributionRepository.findById(UUID.fromString(distributionId))
                .orElseThrow(() -> new EntityNotFoundException("Distribution", distributionId));
        dist.markOpened();
        distributionRepository.save(dist);
    }

    public void markResponded(final String distributionId) {
        final SurveyDistribution dist = distributionRepository.findById(UUID.fromString(distributionId))
                .orElseThrow(() -> new EntityNotFoundException("Distribution", distributionId));
        dist.markResponded();
        distributionRepository.save(dist);
    }
}
