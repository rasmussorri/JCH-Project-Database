import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { Project, UpdateProjectPayload } from '../types';
import { getInitials } from '../../../utils/formatting';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { stripHtml } from '../../../lib/sanitizeHtml';
import * as projectService from '../services/projectService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { ScrollArea } from '../../../ui/scroll-area';
import { Loader2, Sparkles, Trash2 } from 'lucide-react';

interface EditProjectDialogProps {
  project: Project;
  password: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: UpdateProjectPayload) => Promise<void>;
  onImageDeleted?: () => void;
}

interface FormState {
  title: string;
  descriptionHtml: string;
  category: string;
  status: Project['status'];
  startDate: string;
  team: string;
  technologies: string;
  contact: string;
}

export function EditProjectDialog({
  project,
  password,
  open,
  onOpenChange,
  onSave,
  onImageDeleted,
}: EditProjectDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(() => ({
    title: project.title,
    descriptionHtml: project.description_html ?? project.description,
    category: project.category,
    status: project.status,
    startDate: project.startDate.split('T')[0],
    team: project.team.join(', '),
    technologies: project.technologies.join(', '),
    contact: project.contact ?? '',
  }));

  // AI regeneration state
  const [showAiForm, setShowAiForm] = useState(false);
  const [aiProblem, setAiProblem] = useState('');
  const [aiGoal, setAiGoal] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState('');

  // Image management state
  const [deletingImage, setDeletingImage] = useState<string | null>(null);

  const isSubmitDisabled = useMemo(() => {
    return !form.title.trim() || !stripHtml(form.descriptionHtml).trim();
  }, [form.title, form.descriptionHtml]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');

    const members = form.team
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
      .map((name) => ({ name, initials: getInitials(name) }));

    const tech = form.technologies
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await onSave({
        projectId: project.id,
        password,
        title: form.title.trim(),
        description_html: form.descriptionHtml,
        category: form.category.trim() || 'Uncategorized',
        status: form.status,
        startedAt: form.startDate,
        members,
        tech,
        contact: form.contact.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to update project:', err);
      setError('Failed to update project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateAI = async () => {
    setAiGenerating(true);
    try {
      const technologies = form.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const html = await projectService.generateDescription({
        title: form.title,
        problem: aiProblem,
        goal: aiGoal,
        technologies,
        status: form.status,
        notes: aiNotes,
      });
      setAiPreview(html);
    } catch (err) {
      console.error('AI generation failed:', err);
      setError('AI description generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleAcceptAI = () => {
    setForm((prev) => ({ ...prev, descriptionHtml: aiPreview }));
    setAiPreview('');
    setShowAiForm(false);
  };

  const handleDeleteImage = async (storagePath: string) => {
    setDeletingImage(storagePath);
    try {
      await projectService.deleteProjectImage(project.id, password, storagePath);
      onImageDeleted?.();
    } catch (err) {
      console.error('Failed to delete image:', err);
      setError('Failed to delete image.');
    } finally {
      setDeletingImage(null);
    }
  };

  const imageStoragePaths = useMemo(() => {
    if (!project.imageUrls) return [];
    return project.imageUrls.map((url) => {
      const match = url.match(/project-images\/(.+?)(?:\?|$)/);
      return { url, storagePath: match ? decodeURIComponent(match[1]) : '' };
    });
  }, [project.imageUrls]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-3xl bg-slate-900 border-slate-800"
        aria-describedby="edit-project-description"
      >
        <DialogHeader>
          <DialogTitle className="text-slate-100">Edit Project</DialogTitle>
          <DialogDescription id="edit-project-description" className="sr-only">
            Edit project details including title, description, status, and images.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form
            className="space-y-6 text-slate-200"
            onSubmit={handleSubmit}
            id="edit-project-form"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Project Title</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Category</span>
                <input
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Description</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAiForm(!showAiForm)}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 text-xs"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {showAiForm ? 'Hide AI' : 'Regenerate with AI'}
                </Button>
              </div>

              {showAiForm && (
                <div className="space-y-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                  <p className="text-xs text-slate-500">
                    Fill in details and AI will generate a new description.
                  </p>
                  <textarea
                    value={aiProblem}
                    onChange={(e) => setAiProblem(e.target.value)}
                    placeholder="What problem does this project solve?"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none min-h-[60px] resize-y"
                  />
                  <textarea
                    value={aiGoal}
                    onChange={(e) => setAiGoal(e.target.value)}
                    placeholder="What is the desired outcome?"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none min-h-[60px] resize-y"
                  />
                  <textarea
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    placeholder="Additional notes"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none min-h-[40px] resize-y"
                  />
                  <Button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={aiGenerating || !form.title.trim()}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-sm"
                  >
                    {aiGenerating ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 mr-1" />
                        Generate Description
                      </>
                    )}
                  </Button>

                  {aiPreview && (
                    <div className="space-y-2">
                      <span className="text-xs text-slate-400">AI Preview:</span>
                      <div
                        className="p-3 bg-slate-900 rounded border border-slate-700 text-sm text-slate-300 max-h-40 overflow-y-auto [&_p]:my-1 [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-4"
                        dangerouslySetInnerHTML={{ __html: aiPreview }}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAcceptAI}
                          className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm"
                        >
                          Use this description
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAiPreview('')}
                          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-sm"
                        >
                          Discard
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <RichTextEditor
                value={form.descriptionHtml}
                onChange={(html) =>
                  setForm((prev) => ({ ...prev, descriptionHtml: html }))
                }
                placeholder="Describe the project goals and outcomes..."
                minHeight="120px"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Status</span>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="In Progress">In Progress</option>
                  <option value="Finished">Finished</option>
                  <option value="History">History</option>
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Start Date</span>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:outline-none"
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Team Members</span>
                <input
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  placeholder="Comma-separated names"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Technologies</span>
                <input
                  name="technologies"
                  value={form.technologies}
                  onChange={handleChange}
                  placeholder="Comma-separated technologies"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Contact Info</span>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Email or phone number"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
              />
            </label>

            {/* Image management */}
            {imageStoragePaths.length > 0 && (
              <div className="space-y-3">
                <span className="text-sm text-slate-400">Images</span>
                <div className="grid grid-cols-4 gap-3">
                  {imageStoragePaths.map(({ url, storagePath }) => (
                    <div
                      key={storagePath}
                      className="relative group aspect-square rounded-lg overflow-hidden bg-slate-800"
                    >
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(storagePath)}
                        disabled={deletingImage === storagePath}
                        className="absolute top-1 right-1 p-1 bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        {deletingImage === storagePath ? (
                          <Loader2 className="w-3 h-3 text-white animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Hover over an image and click the trash icon to remove it.
                  To add more images, use the upload link in the project detail view.
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-project-form"
            disabled={isSubmitDisabled || submitting}
            className="text-white bg-cyan-600 hover:bg-cyan-500"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
