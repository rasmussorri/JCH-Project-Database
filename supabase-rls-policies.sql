-- Enable Row Level Security (RLS) on all public tables
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Enable RLS on each table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tech ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Policies: anon can only SELECT portfolio data (read-only for the app)
-- Create/delete go through Edge Functions (service_role), which bypasses RLS.

DROP POLICY IF EXISTS "anon_select_projects" ON public.projects;
CREATE POLICY "anon_select_projects"
  ON public.projects FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_select_project_images" ON public.project_images;
CREATE POLICY "anon_select_project_images"
  ON public.project_images FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_select_project_members" ON public.project_members;
CREATE POLICY "anon_select_project_members"
  ON public.project_members FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "anon_select_project_tech" ON public.project_tech;
CREATE POLICY "anon_select_project_tech"
  ON public.project_tech FOR SELECT
  TO anon
  USING (true);

-- upload_sessions: no anon policy = anon cannot read or write (tokens stay server-side)
-- Edge Functions use service_role and bypass RLS, so they can still manage sessions.
