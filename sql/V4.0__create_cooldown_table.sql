CREATE TABLE cooldown_states (
    id SERIAL PRIMARY KEY, 
    category VARCHAR(100) NOT NULL,
    computername VARCHAR(100) NOT NULL,
    cooldown_period INTEGER NOT NULL,
    last_run BIGINT NOT NULL

);