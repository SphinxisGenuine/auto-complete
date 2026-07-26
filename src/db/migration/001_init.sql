CREATE TABLE search_term (
    id SERIAL PRIMARY KEY,
    word  varchar(255) NOT NULL,
    frequency BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    );
    CREATE INDEX idx_frequency
    ON search_term(frequency DESC);