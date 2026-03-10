export const PROJECT_STATUSES = ['In Progress', 'Finished', 'History'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export function normalizeProjectStatus(status: string | null | undefined): ProjectStatus {
  if (status === 'Finished' || status === 'History' || status === 'In Progress') {
    return status;
  }

  // Legacy values that may still exist if migrations have not run yet.
  if (status === 'Testing') return 'Finished';
  if (status === 'Completed') return 'History';

  return 'In Progress';
}

export interface Project {
  id: string;
  title: string;
  /** Plain text fallback; prefer description_html when present. */
  description: string;
  /** Rich text (HTML) from editor. Stored in DB as description_html. */
  description_html?: string;
  category: string;
  status: ProjectStatus;
  team: string[];
  imageUrl?: string;
  imageUrls?: string[];
  startDate: string;
  technologies: string[];
  contact?: string;
}

export interface CreateProjectPayload {
  title: string;
  /** Rich text (HTML) for project description. Persisted as description_html. */
  description_html: string;
  category: string;
  status: ProjectStatus;
  startedAt: string;
  deletePin: string;
  members: Array<{ name: string; initials: string }>;
  tech: string[];
  contact?: string;
}

export interface MobileCreateProjectPayload {
  token: string;
  title: string;
  problem: string;
  goal: string;
  technologies: string[];
  status: ProjectStatus;
  category: string;
  startDate: string;
  members: Array<{ name: string; initials: string }>;
  notes: string;
  deletePin: string;
  contact?: string;
  images: Array<{ fileExt: string; contentType: string }>;
}

export interface MobileCreateProjectResponse {
  projectId: string;
  uploadUrls: string[];
}

export interface CreateCreationSessionResponse {
  token: string;
  expiresAt: string;
  createUrl: string;
}

export interface UpdateProjectPayload {
  projectId: string;
  password: string;
  title?: string;
  description_html?: string;
  category?: string;
  status?: ProjectStatus;
  startedAt?: string;
  members?: Array<{ name: string; initials: string }>;
  tech?: string[];
  contact?: string;
}

export interface GenerateDescriptionPayload {
  title: string;
  problem: string;
  goal: string;
  technologies: string[];
  status: string;
  notes: string;
}
