import { useState } from 'react';
import type { Project } from '../types/project';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Button } from '../ui/button';
import { Calendar, Users, Code2, Info, Trash2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface ProjectDetailProps {
  project: Project | null;
  onClose: () => void;
  onDelete?: (projectId: string) => void;
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

export function ProjectDetail({ project, onClose, onDelete }: ProjectDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!project) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(project.id);
    }
    setShowDeleteDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={!!project} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-slate-900 border-slate-800">
          <ScrollArea className="max-h-[90vh]">
          <div className="relative h-80 overflow-hidden bg-slate-800">
            {(() => {
              const imageSrc =
                project.imageUrl ??
                (project.image ? imageMap[project.image] : undefined);

              if (!imageSrc) {
                return (
                  <div className="w-full h-full flex items-center justify-center text-slate-500">
                    No image provided
                  </div>
                );
              }

              return (
                <ImageWithFallback
                  src={imageSrc}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              );
            })()}
            <div className="absolute top-6 right-6 flex gap-3">
              <Badge className={statusColors[project.status]}>
                {project.status}
              </Badge>
              <Badge variant="outline" className={`${categoryColors[project.category as keyof typeof categoryColors]} border-0`}>
                {project.category}
              </Badge>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <DialogHeader>
              <DialogTitle className="text-slate-100">{project.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Description */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Info className="w-5 h-5" />
                  <span>Project Description</span>
                </div>
                <p className="text-slate-400 pl-7">{project.description}</p>
              </div>

              {/* Team Members */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Users className="w-5 h-5" />
                  <span>Team Members</span>
                </div>
                <div className="pl-7 space-y-3">
                  {project.team.map((member, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-slate-700 text-slate-200">
                          {getInitials(member)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-slate-300">{member}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technologies */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Code2 className="w-5 h-5" />
                  <span>Technologies & Tools</span>
                </div>
                <div className="pl-7 flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary" className="bg-slate-800 text-slate-300 hover:bg-slate-800">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-300">
                  <Calendar className="w-5 h-5" />
                  <span>Project Started</span>
                </div>
                <p className="text-slate-400 pl-7">
                  {new Date(project.startDate).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </ScrollArea>
        {onDelete && (
          <DialogFooter className="border-t border-slate-800 px-8 py-4">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Project
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>

    <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <DialogContent className="bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Delete Project</DialogTitle>
        </DialogHeader>
        <p className="text-slate-300 py-4">
          Are you sure you want to delete <span className="font-semibold">{project.title}</span>? This action cannot be undone.
        </p>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteDialog(false)}
            className="text-slate-300 hover:text-slate-100"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirmDelete}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}