import { supabase } from '../../../lib/supabaseClient';
import type { CreateProjectPayload, Project } from '../types';
import type { SupabaseProject } from '../supabaseTypes';

function mapSupabaseProject(row: SupabaseProject): Project {
  const imageUrls = (row.project_images ?? [])
    .slice()
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return aTime - bTime;
    })
    .map(
      (image) =>
        supabase.storage
          .from('project-images')
          .getPublicUrl(image.storage_path).data.publicUrl,
    );

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    description_html: row.description_html ?? undefined,
    category: row.category ?? 'Uncategorized',
    status: row.status ?? 'In Progress',
    startDate: row.started_at ?? row.created_at ?? new Date().toISOString(),
    team: (row.project_members ?? [])
      .map((member) => member.name ?? '')
      .filter(Boolean),
    technologies: (row.project_tech ?? [])
      .map((item) => item.tech ?? '')
      .filter(Boolean),
    imageUrl: imageUrls[0],
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id,title,description,description_html,category,status,started_at,created_at,
       project_members(name,initials),
       project_tech(tech),
       project_images(storage_path,created_at)`,
    )
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch projects: ${error.message}`);
  }

  return (data as SupabaseProject[]).map(mapSupabaseProject);
}

export async function createProject(payload: CreateProjectPayload): Promise<void> {
  const { error } = await supabase.functions.invoke('create-project', {
    body: payload,
  });

  if (error) {
    throw error;
  }
}

export async function deleteProject(
  projectId: string,
  password: string,
): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-project', {
    body: { projectId, password },
  });

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}
