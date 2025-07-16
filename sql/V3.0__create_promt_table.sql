CREATE TABLE IF NOT EXISTS prompt_inputs (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp for when the record was last updated


);
