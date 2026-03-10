import type { Project } from '../types';
import { resolveProjectImages } from '../resolveProjectImages';
import { ProjectCard } from './ProjectCard';
import { ResponsiveGrid } from '../../../components/layout/ResponsiveGrid';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  return (
    <ResponsiveGrid>
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          images={resolveProjectImages(project)}
          onClick={() => onProjectClick(project)}
        />
      ))}
    </ResponsiveGrid>
  );
}
