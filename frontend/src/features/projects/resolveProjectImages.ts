import type { Project } from './types';

/**
 * Resolves the display images for a project, falling back through
 * imageUrls → imageUrl.
 */
export function resolveProjectImages(project: Project): string[] {
  if (project.imageUrls && project.imageUrls.length > 0) {
    return project.imageUrls;
  }
  if (project.imageUrl) {
    return [project.imageUrl];
  }
  return [];
}
