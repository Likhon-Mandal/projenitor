-- Migration 031: Create sammelans table for সম্মেলন কথা (Sammelan Katha)
CREATE TABLE IF NOT EXISTS sammelans (
    id SERIAL PRIMARY KEY,
    edition INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    bengali_date VARCHAR(100),
    date DATE,
    time VARCHAR(100),
    home_id INTEGER REFERENCES homes(id) ON DELETE SET NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT,
    map_link TEXT,
    president_name VARCHAR(255),
    secretary_name VARCHAR(255),
    description TEXT,
    special_notes TEXT,
    cover_image_url TEXT,
    images JSONB DEFAULT '[]',
    is_next BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sammelans_edition ON sammelans(edition DESC);
CREATE INDEX IF NOT EXISTS idx_sammelans_is_next ON sammelans(is_next);
CREATE INDEX IF NOT EXISTS idx_sammelans_home_id ON sammelans(home_id);
