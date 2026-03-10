-- Supabase DB Schema (runnable order: parent tables first)
-- Also ensure: Storage bucket "project-images" exists and RLS allows anon read if you use RLS.

-- 1. Parent table first (referenced by all others)
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT ''::text,
  category text NOT NULL DEFAULT 'Uncategorized'::text,
  status text NOT NULL DEFAULT 'In Progress'::text CHECK (status = ANY (ARRAY['In Progress'::text, 'Finished'::text, 'History'::text])),
  started_at date,
  delete_pin_hash text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  contact text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);

-- 2. Child tables (FK to projects)
CREATE TABLE public.project_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  storage_path text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_images_pkey PRIMARY KEY (id),
  CONSTRAINT project_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.project_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  initials text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.project_tech (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  tech text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT project_tech_pkey PRIMARY KEY (id),
  CONSTRAINT project_tech_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.upload_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT upload_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT upload_sessions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.creation_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  completed_at timestamptz,        -- NULL until project is created
  project_id uuid,                 -- Set when project is created
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT creation_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT creation_sessions_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- If projects already exists with the old category CHECK, run this in Supabase SQL Editor to allow any category:
-- ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_category_check;
