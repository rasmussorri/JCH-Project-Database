import type { Project } from '../types/project';
import { ProjectCard } from './ProjectCard';

interface ProjectGridProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
}

const imageMap: Record<string, string> = {
  'garden': 'https://images.unsplash.com/photo-1628246498566-c846ce32a5b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRvb3IlMjBnYXJkZW4lMjBwbGFudHN8ZW58MXx8fHwxNzYyNjQxMzExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'navigation': 'https://images.unsplash.com/photo-1665594915243-970a1e128ba7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdWdtZW50ZWQlMjByZWFsaXR5JTIwcGhvbmV8ZW58MXx8fHwxNzYyNTUwMDExfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'robot': 'https://images.unsplash.com/photo-1728724654223-ae890fc31f1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb2JvdGljJTIwYXJtJTIwdGVjaG5vbG9neXxlbnwxfHx8fDE3NjI2NDEzMTJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'sign-language': 'https://images.unsplash.com/photo-1739630405609-fd438c446f62?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzaWduJTIwbGFuZ3VhZ2UlMjBoYW5kc3xlbnwxfHx8fDE3NjI1NzgxNzh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'energy': 'https://images.unsplash.com/photo-1655300256620-680cb0f1cec3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzb2xhciUyMGVuZXJneSUyMHBhbmVsfGVufDF8fHx8MTc2MjY0MTMxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'museum': 'https://images.unsplash.com/photo-1562064729-6c3f058785fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNldW0lMjBleGhpYml0aW9ufGVufDF8fHx8MTc2MjY0MTMxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'drone': 'https://images.unsplash.com/photo-1697122235975-8cb2d056aed8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcm9uZSUyMGZseWluZyUyMHRlY2hub2xvZ3l8ZW58MXx8fHwxNzYyNjQxMzEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'wearable': 'https://images.unsplash.com/photo-1532435109783-fdb8a2be0baa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHdhdGNoJTIwZml0bmVzc3xlbnwxfHx8fDE3NjI1MzQ4OTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  'electric-bike': 'https://images.unsplash.com/photo-1557511072-715c2d653926?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJpYyUyMG1vdG9yY3ljbGUlMjByYWNpbmd8ZW58MXx8fHwxNzYyNjQxODgzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
};

export function ProjectGrid({ projects, onProjectClick }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
      {projects.map((project) => {
        // Build image array: prioritize imageUrls, fallback to imageUrl, then imageMap
        const images: string[] = [];
        
        if (project.imageUrls && project.imageUrls.length > 0) {
          images.push(...project.imageUrls);
        } else if (project.imageUrl) {
          images.push(project.imageUrl);
        } else if (project.image && imageMap[project.image]) {
          images.push(imageMap[project.image]);
        }

        return (
          <ProjectCard
            key={project.id}
            project={project}
            imageUrl={images.length > 0 ? images[0] : undefined}
            imageUrls={images.length > 0 ? images : undefined}
            onClick={() => onProjectClick(project)}
          />
        );
      })}
    </div>
  );
}