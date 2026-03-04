-- Add description_html column for rich text project descriptions (HTML from Tiptap editor).
-- Run this in the Supabase SQL Editor if the column does not exist yet.
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS description_html text;

COMMENT ON COLUMN public.projects.description_html IS 'Rich text description (HTML). Rendered in app after sanitization.';
