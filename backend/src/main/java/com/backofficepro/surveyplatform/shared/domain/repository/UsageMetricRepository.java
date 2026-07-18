package com.backofficepro.surveyplatform.shared.domain.repository;

import com.backofficepro.surveyplatform.shared.domain.model.UsageMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UsageMetricRepository extends JpaRepository<UsageMetric, UUID> {

    Optional<UsageMetric> findByOrganizationIdAndMetricTypeAndPeriodYearAndPeriodMonth(
            String organizationId,
            UsageMetric.MetricType metricType,
            int periodYear,
            int periodMonth);

    List<UsageMetric> findByOrganizationIdAndPeriodYearAndPeriodMonth(
            String organizationId,
            int periodYear,
            int periodMonth);
}
