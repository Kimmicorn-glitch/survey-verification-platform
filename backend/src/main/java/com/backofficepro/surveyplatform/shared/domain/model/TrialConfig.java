package com.backofficepro.surveyplatform.shared.domain.model;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

public final class TrialConfig {

    public static final int TRIAL_DURATION_DAYS = 14;
    public static final int MAX_SURVEYS_IN_TRIAL = 5;
    public static final int MAX_RESPONSES_IN_TRIAL = 500;

    private TrialConfig() {
    }

    public static boolean isTrialActive(final LocalDateTime trialStart, final LocalDateTime trialEnd) {
        if (trialStart == null || trialEnd == null) {
            return false;
        }
        final LocalDateTime now = LocalDateTime.now();
        return now.isAfter(trialStart) && now.isBefore(trialEnd);
    }

    public static long getDaysRemaining(final LocalDateTime trialEnd) {
        if (trialEnd == null) {
            return 0;
        }
        final long remaining = ChronoUnit.DAYS.between(LocalDateTime.now(), trialEnd);
        return Math.max(remaining, 0);
    }
}
