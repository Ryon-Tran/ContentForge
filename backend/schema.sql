CREATE TABLE IF NOT EXISTS production_rows (
    id TEXT PRIMARY KEY,
    stt TEXT,
    character_name TEXT,
    image_prompt TEXT,
    image_versions TEXT, -- JSON string
    current_image_index INTEGER,
    caption_sample TEXT,
    caption_instruction TEXT,
    caption_preset TEXT,
    caption_result TEXT,
    save_path TEXT,
    is_done BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS video_rows (
    id TEXT PRIMARY KEY,
    stt TEXT,
    video_prompt TEXT,
    video_versions TEXT, -- JSON string
    current_video_index INTEGER,
    save_confirmed BOOLEAN,
    is_done BOOLEAN,
    save_path TEXT
);

CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS ai_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    base_url TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    row_id TEXT NOT NULL,
    job_type TEXT NOT NULL,
    payload TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);
