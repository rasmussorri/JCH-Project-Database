import type { Project } from '../types/project';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Calendar, Users } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  imageUrl?: string;
  onClick: () => void;
}

const statusColors = {
  'In Progress': 'bg-blue-600/90 text-blue-100 hover:bg-blue-600/90',
  'Testing': 'bg-amber-600/90 text-amber-100 hover:bg-amber-600/90',
  'Completed': 'bg-green-600/90 text-green-100 hover:bg-green-600/90',
};

const categoryColors = {
  'IoT': 'bg-purple-600/90 text-purple-100 hover:bg-purple-600/90',
  'AR/VR': 'bg-pink-600/90 text-pink-100 hover:bg-pink-600/90',
  'Robotics': 'bg-cyan-600/90 text-cyan-100 hover:bg-cyan-600/90',
  'AI/ML': 'bg-indigo-600/90 text-indigo-100 hover:bg-indigo-600/90',
};

export function ProjectCard({ project, imageUrl, onClick }: ProjectCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] touch-manipulation bg-slate-900/90 border-slate-800"
      onClick={onClick}
    >
      <div className="relative h-56 overflow-hidden bg-slate-800">
        {imageUrl ? (
          <ImageWithFallback
            src={imageUrl}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
            No image
          </div>
        )}
        <div className="absolute top-4 right-4">
          <Badge className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-slate-100 flex-1">{project.title}</h3>
          <Badge variant="outline" className={`${categoryColors[project.category as keyof typeof categoryColors]} border-0`}>
            {project.category}
          </Badge>
        </div>
        <p className="text-slate-400 line-clamp-2">{project.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-slate-400">
          <Calendar className="w-5 h-5" />
          <span>Started {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.technologies.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-800">
              {tech}
            </Badge>
          ))}
          {project.technologies.length > 3 && (
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-800">
              +{project.technologies.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="border-t border-slate-800 pt-4">
        <div className="flex items-center gap-2 w-full">
          <Users className="w-5 h-5 text-slate-500" />
          <div className="flex -space-x-2">
            {project.team.slice(0, 4).map((member, index) => (
              <Avatar key={index} className="w-9 h-9 border-2 border-slate-900">
                <AvatarFallback className="bg-slate-700 text-slate-200">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.team.length > 4 && (
              <Avatar className="w-9 h-9 border-2 border-slate-900">
                <AvatarFallback className="bg-slate-700 text-slate-200">
                  +{project.team.length - 4}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}