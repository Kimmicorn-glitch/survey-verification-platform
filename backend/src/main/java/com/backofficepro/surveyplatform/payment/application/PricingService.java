package com.backofficepro.surveyplatform.payment.application;

import com.backofficepro.surveyplatform.payment.application.dto.UsageStatus;
import com.backofficepro.surveyplatform.shared.domain.model.UsageMetric;
import com.backofficepro.surveyplatform.shared.domain.repository.UsageMetricRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class PricingService {

    private static final Logger log = LoggerFactory.getLogger(PricingService.class);

    private final UsageMetricRepository usageMetricRepository;

    public PricingService(final UsageMetricRepository usageMetricRepository) {
        this.usageMetricRepository = usageMetricRepository;
    }

    public enum PricingPlan {
        FREE(0, 0, 100),
        STARTER(29, 10, 1000),
        PROFESSIONAL(99, 100, 10000),
        ENTERPRISE(299, Integer.MAX_VALUE, Integer.MAX_VALUE);

        private final int monthlyPrice;
        private final int surveysLimit;
        private final int responsesLimit;

        PricingPlan(final int monthlyPrice, final int surveysLimit, final int responsesLimit) {
            this.monthlyPrice = monthlyPrice;
            this.surveysLimit = surveysLimit;
            this.responsesLimit = responsesLimit;
        }

        public int monthlyPrice() {
            return monthlyPrice;
        }

        public int surveysLimit() {
            return surveysLimit;
        }

        public int responsesLimit() {
            return responsesLimit;
        }
    }

    public UsageStatus checkUsageLimits(final String organizationId) {
        final LocalDate now = LocalDate.now();
        final int year = now.getYear();
        final int month = now.getMonthValue();

        final List<UsageMetric> metrics = usageMetricRepository
                .findByOrganizationIdAndPeriodYearAndPeriodMonth(organizationId, year, month);

        final long surveysUsed = extractCount(metrics, UsageMetric.MetricType.SURVEYS);
        final long responsesUsed = extractCount(metrics, UsageMetric.MetricType.RESPONSES);
        final long apiCallsUsed = extractCount(metrics, UsageMetric.MetricType.API_CALLS);

        final PricingPlan plan = PricingPlan.FREE;
        final long surveysLimit = plan.surveysLimit();
        final long responsesLimit = plan.responsesLimit();

        final boolean withinLimits = surveysUsed < surveysLimit && responsesUsed < responsesLimit;

        log.debug("Usage check for org {}: surveys={}/{}, responses={}/{}, within={}",
                organizationId, surveysUsed, surveysLimit, responsesUsed, responsesLimit, withinLimits);

        return new UsageStatus(
                surveysUsed,
                responsesUsed,
                apiCallsUsed,
                surveysLimit,
                responsesLimit,
                withinLimits);
    }

    public Map<String, Integer> getPlanLimits(final PricingPlan plan) {
        return Map.of(
                "surveysLimit", plan.surveysLimit(),
                "responsesLimit", plan.responsesLimit(),
                "monthlyPrice", plan.monthlyPrice());
    }

    private long extractCount(final List<UsageMetric> metrics, final UsageMetric.MetricType type) {
        return metrics.stream()
                .filter(m -> m.getMetricType() == type)
                .mapToLong(UsageMetric::getCount)
                .sum();
    }
}
