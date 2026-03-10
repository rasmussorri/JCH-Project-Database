import type { Project } from './types';

/** Shape of a project row as returned by the Supabase `projects` query with joins. */
export interface SupabaseProject {
  id: string;
  title: string;
  description: string | null;
  description_html: string | null;
  category: string | null;
  status: Project['status'] | null;
  started_at: string | null;
  contact: string | null;
  created_at: string | null;
  project_members?: Array<{ name: string | null; initials: string | null }>;
  project_tech?: Array<{ tech: string | null }>;
  project_images?: Array<{ storage_path: string; created_at: string | null }>;
}
