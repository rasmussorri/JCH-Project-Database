-- Migration: add creation_sessions table
-- Supports the mobile-first project creation flow where a desktop user
-- generates a QR code and a phone user fills out the project form.

CREATE TABLE public.creation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,
  project_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT creation_sessions_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Allow anon reads so Supabase Realtime subscriptions work from the frontend
ALTER TABLE public.creation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on creation_sessions"
  ON public.creation_sessions
  FOR SELECT
  TO anon
  USING (true);

-- Also add description_html column if not already present (idempotent)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS description_html text;

-- Enable Realtime for creation_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.creation_sessions;
