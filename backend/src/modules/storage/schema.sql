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
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    expiration_date DATE NOT NULL,
    password_hash TEXT,
    force_password_change BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'matricula'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email'
    ) THEN
        EXECUTE 'ALTER TABLE users RENAME COLUMN matricula TO email';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_expiration_date ON users (expiration_date);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS stored_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    category TEXT NOT NULL,
    file_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    content BYTEA NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    checksum TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'stored_files' AND column_name = 'owner_matricula'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'stored_files' AND column_name = 'owner_email'
    ) THEN
        EXECUTE 'ALTER TABLE stored_files RENAME COLUMN owner_matricula TO owner_email';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stored_files_owner_category ON stored_files (owner_email, category, created_at DESC);

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    device_id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    archive BYTEA NOT NULL,
    checksum TEXT NOT NULL DEFAULT '',
    file_count INTEGER NOT NULL DEFAULT 0,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'whatsapp_sessions' AND column_name = 'owner_matricula'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'whatsapp_sessions' AND column_name = 'owner_email'
    ) THEN
        EXECUTE 'ALTER TABLE whatsapp_sessions RENAME COLUMN owner_matricula TO owner_email';
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
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

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'owner_matricula'
    ) AND NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'contacts' AND column_name = 'owner_email'
    ) THEN
        EXECUTE 'ALTER TABLE contacts RENAME COLUMN owner_matricula TO owner_email';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts (owner_email, name);
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS list_name TEXT NOT NULL DEFAULT 'Geral';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS profissional TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS whatsapp_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    name TEXT NOT NULL,
    whatsapp_group_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (owner_email, whatsapp_group_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_groups_owner_name ON whatsapp_groups (owner_email, name, created_at DESC);

CREATE TABLE IF NOT EXISTS message_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_templates_owner ON message_templates (owner_email, updated_at DESC);

CREATE TABLE IF NOT EXISTS message_template_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES message_templates(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_template_variants_template ON message_template_variants (template_id, created_at ASC);
