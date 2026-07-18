package com.backofficepro.surveyplatform.shared.domain.model;

import com.backofficepro.surveyplatform.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usage_metrics", schema = "shared")
public class UsageMetric extends BaseEntity {

    @Column(name = "organization_id", nullable = false, length = 100)
    private String organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_type", nullable = false, length = 30)
    private MetricType metricType;

    @Column(name = "count", nullable = false)
    private long count;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    public enum MetricType {
        SURVEYS,
        RESPONSES,
        API_CALLS,
        STORAGE
    }

    protected UsageMetric() {
        super();
    }

    public static UsageMetric create(final String organizationId,
                                     final MetricType metricType,
                                     final int year,
                                     final int month) {
        final UsageMetric metric = new UsageMetric();
        metric.organizationId = organizationId;
        metric.metricType = metricType;
        metric.count = 0;
        metric.periodYear = year;
        metric.periodMonth = month;
        return metric;
    }

    public void increment(final long amount) {
        this.count += amount;
    }
}
