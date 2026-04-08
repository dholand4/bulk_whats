CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS app_state (
    id SMALLINT PRIMARY KEY DEFAULT 1,
    state JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT app_state_single_row CHECK (id = 1)
);

CREATE INDEX IF NOT EXISTS idx_app_state_updated_at ON app_state (updated_at DESC);

CREATE TABLE IF NOT EXISTS users (
    matricula TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    expiration_date DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_expiration_date ON users (expiration_date);

CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_matricula TEXT NOT NULL REFERENCES users(matricula) ON DELETE CASCADE,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    content BYTEA NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stored_files_owner_category ON stored_files (owner_matricula, category, created_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    device_id TEXT PRIMARY KEY,
    owner_matricula TEXT NOT NULL REFERENCES users(matricula) ON DELETE CASCADE,
    archive BYTEA NOT NULL,
    checksum TEXT NOT NULL DEFAULT '',
    file_count INTEGER NOT NULL DEFAULT 0,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_matricula TEXT NOT NULL REFERENCES users(matricula) ON DELETE CASCADE,
    list_name TEXT NOT NULL DEFAULT 'Geral',
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    paciente TEXT NOT NULL DEFAULT '',
    profissional TEXT NOT NULL DEFAULT '',
    data TEXT NOT NULL DEFAULT '',
    hora TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts (owner_matricula, name);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS list_name TEXT NOT NULL DEFAULT 'Geral';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS profissional TEXT NOT NULL DEFAULT '';
