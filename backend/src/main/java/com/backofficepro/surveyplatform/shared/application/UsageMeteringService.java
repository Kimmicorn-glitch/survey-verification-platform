package com.backofficepro.surveyplatform.shared.application;

import com.backofficepro.surveyplatform.shared.domain.model.UsageMetric;
import com.backofficepro.surveyplatform.shared.domain.repository.UsageMetricRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
@Transactional
public class UsageMeteringService {

    private static final Logger log = LoggerFactory.getLogger(UsageMeteringService.class);

    private final UsageMetricRepository usageMetricRepository;

    public UsageMeteringService(final UsageMetricRepository usageMetricRepository) {
        this.usageMetricRepository = usageMetricRepository;
    }

    public void incrementUsage(final String organizationId,
                               final UsageMetric.MetricType metricType,
                               final long amount) {
        final LocalDate now = LocalDate.now();
        final UsageMetric metric = usageMetricRepository
                .findByOrganizationIdAndMetricTypeAndPeriodYearAndPeriodMonth(
                        organizationId, metricType, now.getYear(), now.getMonthValue())
                .orElseGet(() -> UsageMetric.create(
                        organizationId, metricType, now.getYear(), now.getMonthValue()));

        metric.increment(amount);
        usageMetricRepository.save(metric);

        log.debug("Usage incremented for org {} type {} by {} to {}",
                organizationId, metricType, amount, metric.getCount());
    }

    @Transactional(readOnly = true)
    public UsageMetric getUsage(final String organizationId,
                                final UsageMetric.MetricType metricType) {
        final LocalDate now = LocalDate.now();
        return usageMetricRepository
                .findByOrganizationIdAndMetricTypeAndPeriodYearAndPeriodMonth(
                        organizationId, metricType, now.getYear(), now.getMonthValue())
                .orElse(UsageMetric.create(organizationId, metricType, now.getYear(), now.getMonthValue()));
    }
}
