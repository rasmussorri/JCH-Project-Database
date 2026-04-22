import type { Project } from '../types';
import { stripHtml } from '../../../lib/sanitizeHtml';
import { getInitials } from '../../../utils/formatting';
import { statusColors, categoryColors } from '../constants';
import { Card, CardContent, CardFooter, CardHeader } from '../../../ui/card';
import { Badge } from '../../../ui/badge';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { ImageCarousel } from '../../../components/ImageCarousel';
import { Calendar, Users } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  images: string[];
  onClick: () => void;
  isCompatibilityMode?: boolean;
}

export function ProjectCard({ project, images, onClick, isCompatibilityMode = false }: ProjectCardProps) {
  const cardClassName = isCompatibilityMode
    ? "overflow-hidden cursor-pointer touch-manipulation bg-slate-900 border-slate-800"
    : "overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] touch-manipulation bg-slate-900/90 border-slate-800";

  return (
    <Card 
      className={cn(cardClassName, "h-full flex flex-col")}
      onClick={onClick}
      style={isCompatibilityMode ? { height: '100%' } : {}}
    >
      <div className="relative h-40 sm:h-48 lg:h-56 overflow-hidden bg-slate-800">
        <ImageCarousel images={images} alt={project.title} contain isCompatibilityMode={isCompatibilityMode} />
        <div className="absolute top-4 left-4 z-10">
          <Badge className={statusColors[project.status]}>
            {project.status}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className={`flex items-start justify-between ${isCompatibilityMode ? '' : 'gap-3'} mb-2`}>
          <h3 className={`text-slate-100 flex-1 text-base font-semibold line-clamp-1 ${isCompatibilityMode ? 'mr-3' : ''}`}>{project.title}</h3>
          <Badge variant="outline" className={`${categoryColors[project.category] || 'bg-slate-700 text-slate-200'} border-0 flex-shrink-0`}>
            {project.category}
          </Badge>
        </div>
        <p className="text-slate-400 text-sm line-clamp-2">
          {stripHtml(project.description_html ?? project.description)}
        </p>
      </CardHeader>

      <CardContent className={cn(isCompatibilityMode ? 'pb-1' : 'space-y-3 pb-3', "flex-1")}>
        <div className={`flex items-center ${isCompatibilityMode ? 'mb-3' : 'gap-2'} text-slate-400 text-sm`}>
          <Calendar className={`w-4 h-4 flex-shrink-0 ${isCompatibilityMode ? 'mr-2' : ''}`} />
          <span>Started {new Date(project.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
        </div>

        {project.technologies.length > 0 && (
          <div className={`flex flex-wrap ${isCompatibilityMode ? 'mb-2' : 'gap-1.5'}`}>
            {project.technologies.slice(0, 3).map((tech) => (
              <Badge key={tech} variant="secondary" className={`bg-slate-800 text-slate-300 hover:bg-slate-800 text-xs ${isCompatibilityMode ? 'mr-1.5 mb-1.5' : ''}`}>
                {tech}
              </Badge>
            ))}
            {project.technologies.length > 3 && (
              <Badge variant="secondary" className={`bg-slate-800 text-slate-300 hover:bg-slate-800 text-xs ${isCompatibilityMode ? 'mb-1.5' : ''}`}>
                +{project.technologies.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-slate-800 pt-3 pb-3">
        <div className={`flex items-center ${isCompatibilityMode ? '' : 'gap-2'} w-full`}>
          <Users className={`w-4 h-4 text-slate-500 flex-shrink-0 ${isCompatibilityMode ? 'mr-2' : ''}`} />
          <div className={`flex ${isCompatibilityMode ? 'space-x-2' : '-space-x-2'} flex-1 overflow-hidden`}>
            {project.team.slice(0, 4).map((member, index) => (
              <Avatar key={index} className="w-8 h-8 border-2 border-slate-900 flex-shrink-0">
                <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
                  {getInitials(member)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.team.length > 4 && (
              <Avatar className="w-8 h-8 border-2 border-slate-900 flex-shrink-0">
                <AvatarFallback className="bg-slate-700 text-slate-200 text-xs">
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
