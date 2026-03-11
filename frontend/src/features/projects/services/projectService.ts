import { supabase } from '../../../lib/supabaseClient';
import type {
  CreateProjectPayload,
  MobileCreateProjectPayload,
  MobileCreateProjectResponse,
  CreateCreationSessionResponse,
  UpdateProjectPayload,
  GenerateDescriptionPayload,
  Project,
} from '../types';
import { normalizeProjectStatus } from '../types';
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
    status: normalizeProjectStatus(row.status),
    startDate: row.started_at ?? row.created_at ?? new Date().toISOString(),
    team: (row.project_members ?? [])
      .map((member) => member.name ?? '')
      .filter(Boolean),
    technologies: (row.project_tech ?? [])
      .map((item) => item.tech ?? '')
      .filter(Boolean),
    imageUrl: imageUrls[0],
    imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
    contact: row.contact ?? undefined,
  };
}

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(
      `id,title,description,description_html,category,status,started_at,contact,created_at,
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
  const { data, error } = await supabase.functions.invoke('create-project', {
    body: payload,
  });

  const errMsg = (data as { error?: string } | null)?.error;
  if (errMsg) throw new Error(errMsg);
  if (error) throw error;
}

export async function deleteProject(
  projectId: string,
  password: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('delete-project', {
    body: { projectId, password },
  });

  if (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }

  const response = data as { ok?: boolean; error?: string } | null;
  if (response?.error) throw new Error(response.error);
}

export async function createCreationSession(
  appBaseUrl: string,
): Promise<CreateCreationSessionResponse> {
  const { data, error } = await supabase.functions.invoke(
    'create-creation-session',
    { body: { appBaseUrl } },
  );

  if (error) throw new Error('Failed to create creation session.');

  const response = data as CreateCreationSessionResponse | null;
  if (!response?.token || !response?.createUrl)
    throw new Error('Invalid creation session response.');

  return response;
}

export async function createProjectWithAI(
  payload: MobileCreateProjectPayload,
): Promise<MobileCreateProjectResponse> {
  const { data, error } = await supabase.functions.invoke(
    'create-project-with-ai',
    { body: payload },
  );

  if (error) {
    const msg =
      typeof error === 'object' && 'message' in error
        ? (error as { message: string }).message
        : String(error);
    throw new Error(msg);
  }

  const errMsg = (data as { error?: string } | null)?.error;
  if (errMsg) throw new Error(errMsg);

  const response = data as MobileCreateProjectResponse | null;
  if (!response?.projectId) throw new Error('Project creation failed.');

  return response;
}

export async function updateProject(
  payload: UpdateProjectPayload,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('update-project', {
    body: payload,
  });

  if (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }

  const response = data as { success?: boolean; error?: string } | null;
  if (response?.error) throw new Error(response.error);
}

export async function deleteProjectImage(
  projectId: string,
  password: string,
  storagePath: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke(
    'delete-project-image',
    { body: { projectId, password, storagePath } },
  );

  if (error) throw new Error(`Failed to delete image: ${error.message}`);

  const response = data as { success?: boolean; error?: string } | null;
  if (response?.error) throw new Error(response.error);
}

export const API_CREDITS_EXHAUSTED_MESSAGE =
  'API credits exhausted. AI descriptions are temporarily unavailable.';

export async function generateDescription(
  payload: GenerateDescriptionPayload,
): Promise<string> {
  const { data, error } = await supabase.functions.invoke(
    'generate-description',
    { body: payload },
  );

  const response = data as {
    descriptionHtml?: string;
    error?: string;
    message?: string;
  } | null;

  if (response?.error === 'API_CREDITS_EXHAUSTED') {
    throw new Error(response.message ?? API_CREDITS_EXHAUSTED_MESSAGE);
  }

  if (error) throw new Error('AI description generation failed.');

  if (!response?.descriptionHtml) throw new Error('Empty AI response.');

  return response.descriptionHtml;
}
