CREATE TABLE survey.surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    creator_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
    max_responses INT,
    response_count INT NOT NULL DEFAULT 0,
    starts_at TIMESTAMP,
    ends_at TIMESTAMP,
    published_at TIMESTAMP,
    closed_at TIMESTAMP,
    template_id UUID,
    category VARCHAR(100),
    tags TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by VARCHAR(255)
);

CREATE TABLE survey.questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES survey.surveys(id) ON DELETE CASCADE,
    text VARCHAR(1000) NOT NULL,
    description VARCHAR(2000),
    question_type VARCHAR(30) NOT NULL,
    required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    min_value INT,
    max_value INT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE survey.question_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES survey.questions(id) ON DELETE CASCADE,
    text VARCHAR(500) NOT NULL,
    value VARCHAR(255),
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE survey.survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES survey.surveys(id),
    question_id UUID REFERENCES survey.questions(id),
    respondent_id VARCHAR(255),
    session_id VARCHAR(100),
    text_answer VARCHAR(4000),
    numeric_answer INT,
    selected_option_id VARCHAR(255),
    file_url VARCHAR(500),
    responded_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    version BIGINT DEFAULT 0
);

CREATE TABLE survey.survey_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description VARCHAR(2000),
    category VARCHAR(100) NOT NULL,
    creator_id VARCHAR(255) NOT NULL,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    usage_count INT NOT NULL DEFAULT 0,
    template_data JSONB NOT NULL,
    tags TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP,
    version BIGINT DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE survey.survey_branch_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES survey.surveys(id) ON DELETE CASCADE,
    source_question_id UUID NOT NULL REFERENCES survey.questions(id),
    target_question_id UUID NOT NULL REFERENCES survey.questions(id),
    condition_type VARCHAR(30) NOT NULL,
    condition_value VARCHAR(500) NOT NULL,
    operator VARCHAR(10) NOT NULL DEFAULT 'AND',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE survey.survey_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES survey.surveys(id),
    channel VARCHAR(50) NOT NULL,
    target VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    responded_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP
);

CREATE INDEX idx_surveys_creator ON survey.surveys(creator_id) WHERE deleted = FALSE;
CREATE INDEX idx_surveys_status ON survey.surveys(status) WHERE deleted = FALSE;
CREATE INDEX idx_surveys_category ON survey.surveys(category);
CREATE INDEX idx_questions_survey ON survey.questions(survey_id) WHERE deleted = FALSE;
CREATE INDEX idx_question_options_question ON survey.question_options(question_id) WHERE deleted = FALSE;
CREATE INDEX idx_survey_responses_survey ON survey.survey_responses(survey_id);
CREATE INDEX idx_survey_responses_respondent ON survey.survey_responses(respondent_id);
CREATE INDEX idx_survey_responses_session ON survey.survey_responses(session_id);
CREATE INDEX idx_survey_templates_category ON survey.survey_templates(category) WHERE deleted = FALSE;
CREATE INDEX idx_survey_templates_creator ON survey.survey_templates(creator_id);
CREATE INDEX idx_survey_branch_rules_survey ON survey.survey_branch_rules(survey_id);
CREATE INDEX idx_survey_distributions_survey ON survey.survey_distributions(survey_id);
CREATE INDEX idx_surveys_fulltext ON survey.surveys USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
