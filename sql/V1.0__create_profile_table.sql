CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(100) NOT NULL,
    auth VARCHAR(5000) NOT NULL, 
    owner VARCHAR(100) NOT NULL,
    is_main BOOLEAN, 
    last_action TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp for when the record was last updated
);
