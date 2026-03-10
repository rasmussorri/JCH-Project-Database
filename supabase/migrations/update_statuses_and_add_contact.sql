-- Drop old CHECK constraint first so the UPDATEs can succeed
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_status_check;

-- Update status values: 'Testing' → 'Finished', 'Completed' → 'History'
UPDATE public.projects SET status = 'Finished' WHERE status = 'Testing';
UPDATE public.projects SET status = 'History' WHERE status = 'Completed';

-- Add new CHECK constraint
ALTER TABLE public.projects ADD CONSTRAINT projects_status_check
  CHECK (status = ANY (ARRAY['In Progress'::text, 'Finished'::text, 'History'::text]));

-- Add contact column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS contact text;
