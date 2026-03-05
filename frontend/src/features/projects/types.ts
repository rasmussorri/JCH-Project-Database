export interface Project {
  id: string;
  title: string;
  /** Plain text fallback; prefer description_html when present. */
  description: string;
  /** Rich text (HTML) from editor. Stored in DB as description_html. */
  description_html?: string;
  category: string;
  status: 'In Progress' | 'Testing' | 'Completed';
  team: string[];
  imageUrl?: string;
  imageUrls?: string[];
  startDate: string;
  technologies: string[];
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
}
