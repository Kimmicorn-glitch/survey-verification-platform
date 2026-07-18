CREATE INDEX IF NOT EXISTS idx_vr_survey_id ON verification.verification_requests(survey_id);
CREATE INDEX IF NOT EXISTS idx_vr_respondent_id ON verification.verification_requests(respondent_id);

CREATE INDEX IF NOT EXISTS idx_sr_survey_id ON survey.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_sr_respondent_id ON survey.survey_responses(respondent_id);
CREATE INDEX IF NOT EXISTS idx_sr_survey_respondent ON survey.survey_responses(survey_id, respondent_id);

CREATE INDEX IF NOT EXISTS idx_wc_user_id ON identity.wallet_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_al_user_id ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_al_created_at ON audit.audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_ne_user_id ON audit.notification_events(user_id);
CREATE INDEX IF NOT EXISTS idx_ne_status ON audit.notification_events(status);

CREATE INDEX IF NOT EXISTS idx_sub_user_id ON payment.subscriptions(user_id);
