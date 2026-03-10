export interface Project {
  id: string;
  title: string;
  /** Plain text fallback; prefer description_html when present. */
  description: string;
  /** Rich text (HTML) from editor. Stored in DB as description_html. */
  description_html?: string;
  category: string;
  status: 'In Progress' | 'Finished' | 'History';
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
  status: Project['status'];
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
  status: Project['status'];
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
  status?: Project['status'];
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
