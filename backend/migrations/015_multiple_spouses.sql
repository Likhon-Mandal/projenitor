-- Migration 015: Support Multiple Spouses
CREATE TABLE IF NOT EXISTS member_spouses (
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    spouse_id UUID REFERENCES members(id) ON DELETE CASCADE,
    PRIMARY KEY (member_id, spouse_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Migrate existing spouse_id data
-- We insert both directions to make lookups easier
INSERT INTO member_spouses (member_id, spouse_id)
SELECT id, spouse_id FROM members WHERE spouse_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO member_spouses (member_id, spouse_id)
SELECT spouse_id, id FROM members WHERE spouse_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Note: We keep members.spouse_id for backward compatibility for now, 
-- but we will transition the code to use member_spouses.
