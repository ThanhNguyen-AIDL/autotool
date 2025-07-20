CREATE TABLE IF NOT EXISTS prompt_inputs (
    id SERIAL PRIMARY KEY, 
    name VARCHAR(9999) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Timestamp for record creation
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Timestamp for when the record was last updated


);


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'prompt_inputs'
      AND column_name = 'owner'
  ) THEN
    ALTER TABLE prompt_inputs
    ADD COLUMN owner VARCHAR(100);
  END IF;
END $$;