import { useState } from 'react';
import type { Project, UpdateProjectPayload } from '../types';
import { getInitials } from '../../../utils/formatting';
import { statusColors, categoryColors } from '../constants';
import { resolveProjectImages } from '../resolveProjectImages';
import { sanitizeDescriptionHtml } from '../../../lib/sanitizeHtml';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../ui/dialog';
import { Badge } from '../../../ui/badge';
import { Avatar, AvatarFallback } from '../../../ui/avatar';
import { ImageCarousel } from '../../../components/ImageCarousel';
import { Button } from '../../../ui/button';
import { Calendar, Users, Code2, Info, Trash2, Pencil, Mail } from 'lucide-react';
import { ScrollArea } from '../../../ui/scroll-area';
import { PasswordDialog } from '../../auth/components/PasswordDialog';
import { UploadLink } from '../../uploads/components/UploadLink';
import { EditProjectDialog } from './EditProjectDialog';

interface ProjectDetailProps {
  project: Project | null;
  onClose: () => void;
  onDelete?: (projectId: string, password: string) => Promise<boolean>;
  onUpdate?: (payload: UpdateProjectPayload) => Promise<void>;
}

export function ProjectDetail({ project, onClose, onDelete, onUpdate }: ProjectDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditPinDialog, setShowEditPinDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editPinError, setEditPinError] = useState('');

  if (!project) return null;

  const images = resolveProjectImages(project);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async (password: string) => {
    if (!onDelete) return;

    setPasswordError('');
    const success = await onDelete(project.id, password);
    
    if (success) {
      setShowDeleteDialog(false);
      onClose();
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditPinDialog(true);
  };

  const handleEditPinConfirm = async (password: string) => {
    setEditPinError('');
    setEditPassword(password);
    setShowEditPinDialog(false);
    setShowEditDialog(true);
  };

  return (
    <>
      <Dialog open={!!project} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl h-[90vh] max-h-[90vh] p-0 bg-slate-900 border-slate-800 flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="relative h-80 overflow-hidden bg-slate-800">
                <ImageCarousel images={images} alt={project.title} />
                <div className="absolute top-6 left-6 flex gap-3">
                  <Badge className={statusColors[project.status]}>
                    {project.status}
                  </Badge>
                  <Badge variant="outline" className={`${categoryColors[project.category] ?? ''} border-0 text-white`}>
                    {project.category}
                  </Badge>
                </div>
              </div>

              <div className="p-8 space-y-8">
                <DialogHeader>
                  <DialogTitle className="text-slate-100">{project.title}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-300">
                      <Info className="w-5 h-5" />
                      <span>Project Description</span>
                    </div>
                    <div
                      className="text-slate-400 pl-7 max-w-none [&_p]:my-1 [&_strong]:font-bold [&_em]:italic [&_u]:underline [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-0.5 [&_li]:list-item"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDescriptionHtml(project.description_html ?? project.description),
                      }}
                    />
                  </div>

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

                  {project.contact && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-5 h-5" />
                        <span>Contact</span>
                      </div>
                      <p className="text-slate-400 pl-7">{project.contact}</p>
                    </div>
                  )}

                  <UploadLink projectId={project.id} projectTitle={project.title} />
                </div>
              </div>
            </ScrollArea>
          </div>
          {(onDelete || onUpdate) && (
            <DialogFooter className="border-t border-slate-800 px-8 py-4 flex-shrink-0 bg-slate-900 relative z-50 pointer-events-auto">
              <div className="flex gap-2 w-full justify-between">
                {onUpdate && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleEditClick}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 pointer-events-auto"
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Project
                  </Button>
                )}
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteClick}
                    className="bg-red-600 hover:bg-red-700 text-white pointer-events-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Project
                  </Button>
                )}
              </div>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <PasswordDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) {
            setPasswordError('');
          }
        }}
        onConfirm={handleConfirmDelete}
        projectTitle={project.title}
        error={passwordError}
      />

      <PasswordDialog
        open={showEditPinDialog}
        onOpenChange={(open) => {
          setShowEditPinDialog(open);
          if (!open) {
            setEditPinError('');
          }
        }}
        onConfirm={handleEditPinConfirm}
        projectTitle={project.title}
        error={editPinError}
        title="Edit Project"
        description={`Enter the PIN to edit ${project.title}.`}
        confirmLabel="Continue"
        variant="default"
      />

      {showEditDialog && onUpdate && (
        <EditProjectDialog
          project={project}
          password={editPassword}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={onUpdate}
        />
      )}
    </>
  );
}
