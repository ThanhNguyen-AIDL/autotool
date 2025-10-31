-- Insert test SSL record for Sosovalue platform
-- This record will be used for testing SSL functionality

INSERT INTO emails (
    email,
    iscreated,
    isverified,
    verifycount,
    lastaction,
    lasttraining,
    computername,
    ismain,
    domain,
    ssl_isverified,
    ssl_lastaction
) VALUES (
    'hello@sharklasers.com', -- email (updated to new account)
    true,                       -- iscreated
    false,                      -- isverified (CMC verification)
    0,                          -- verifycount
    0,                          -- lastaction (CMC last action)
    0,                          -- lasttraining
    'henry',                    -- computername
    false,                      -- ismain
    '',          -- domain
    true,                       -- ssl_isverified (SSL verification - set to true)
    0                           -- ssl_lastaction (SSL last action)
) ON CONFLICT (email) DO UPDATE SET
    ssl_isverified = EXCLUDED.ssl_isverified,
    ssl_lastaction = EXCLUDED.ssl_lastaction,
    computername = EXCLUDED.computername,
    domain = EXCLUDED.domain;

-- Add comment for the test record
COMMENT ON COLUMN emails.ssl_isverified IS 'Test record: hello@sharklasers.comwith password TopOne1990@'; 