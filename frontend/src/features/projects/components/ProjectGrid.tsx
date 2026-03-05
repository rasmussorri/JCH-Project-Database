import type { Project } from '../types';
import { resolveProjectImages } from '../resolveProjectImages';
import { ProjectCard } from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

export function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          images={resolveProjectImages(project)}
          onClick={() => onProjectClick(project)}
        />
      ))}
    </div>
  );
}
