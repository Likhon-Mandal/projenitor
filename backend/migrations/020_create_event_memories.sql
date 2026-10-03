-- Migration 020: Create event_memories table
CREATE TABLE IF NOT EXISTS event_memories (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL DEFAULT 'photo', -- 'photo' or 'video'
    media_url TEXT NOT NULL,
    caption TEXT,
    uploaded_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_memories_event_id ON event_memories(event_id);
