import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import { PROJECT_STATUSES } from '../types';
import type { CreateProjectPayload, Project } from '../types';
import { getInitials } from '../../../utils/formatting';
import { RichTextEditor } from '../../../components/RichTextEditor';
import { stripHtml } from '../../../lib/sanitizeHtml';
import * as projectService from '../services/projectService';
import { useApiStatus } from '../../../contexts/ApiStatusContext';
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
import { Loader2, Sparkles } from 'lucide-react';

interface AddProjectDialogProps {
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  existingCategories: string[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

interface FormState {
  title: string;
  descriptionHtml: string;
  category: string;
  status: Project['status'];
  startDate: string;
  team: string;
  technologies: string;
  deletePin: string;
  contact: string;
}

export function AddProjectDialog({
  onCreate,
  existingCategories,
  externalOpen,
  onExternalOpenChange,
}: AddProjectDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled
    ? (v: boolean) => onExternalOpenChange?.(v)
    : setInternalOpen;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const apiStatus = useApiStatus();
  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    descriptionHtml: '',
    category: existingCategories[0] ?? '',
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    team: '',
    technologies: '',
    deletePin: '',
    contact: '',
  }));

  const isSubmitDisabled = useMemo(() => {
    return (
      !form.title.trim() ||
      !stripHtml(form.descriptionHtml).trim() ||
      form.deletePin.trim().length < 4
    );
  }, [form.title, form.descriptionHtml, form.deletePin]);

  const resetForm = () => {
    setForm({
      title: '',
      descriptionHtml: '',
      category: existingCategories[0] ?? '',
      status: 'In Progress',
      startDate: new Date().toISOString().split('T')[0],
      team: '',
      technologies: '',
      deletePin: '',
      contact: '',
    });
    setError('');
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerateWithAI = async () => {
    setError('');
    setAiGenerating(true);
    try {
      const technologies = form.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const html = await projectService.generateDescription({
        title: form.title.trim(),
        problem: '',
        goal: '',
        technologies,
        status: form.status,
        notes: stripHtml(form.descriptionHtml).trim() || '',
      });
      setForm((prev) => ({ ...prev, descriptionHtml: html || '<p></p>' }));
    } catch (err) {
      console.error('AI description generation failed:', err);
      const message = err instanceof Error ? err.message : '';
      if (message.includes('API credits') || message.includes('credits exhausted')) {
        apiStatus?.setApiCreditsExhausted(true);
      }
      setError(message || 'AI description generation failed. Please try again.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    if (form.deletePin.trim().length < 4) {
      setError('Project PIN must be at least 4 characters.');
      return;
    }
    setSubmitting(true);
    setError('');

    const members = form.team
      .split(',')
      .map((member) => member.trim())
      .filter(Boolean)
      .map((name) => ({ name, initials: getInitials(name) }));

    const tech = form.technologies
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const descriptionHtml = (form.descriptionHtml ?? '').trim() || '<p></p>';
      await onCreate({
        title: form.title.trim(),
        description_html: descriptionHtml,
        category: form.category.trim() || 'Uncategorized',
        status: form.status,
        startedAt: form.startDate,
        deletePin: form.deletePin.trim(),
        members,
        tech,
        contact: form.contact.trim() || undefined,
      });
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create project:', err);
      const message = err instanceof Error ? err.message : 'Failed to create project. Please try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <Button
          variant="outline"
          onClick={() => setOpen(true)}
          className="border-white text-white hover:bg-white/10 hover:text-white"
        >
          + Add Project
        </Button>
      )}
      <DialogContent className="max-w-[calc(100%-1rem)] sm:max-w-[calc(100%-2rem)] md:max-w-3xl bg-slate-900 border-slate-800" aria-describedby="add-project-description">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add New Project</DialogTitle>
          <DialogDescription id="add-project-description" className="sr-only">
            Form to add a new project with title, category, description, status, date, team, and technologies.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4">
          <form
            className="space-y-6 text-slate-200"
            onSubmit={handleSubmit}
            id="add-project-form"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Project Title *</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Robotics Capstone"
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
                  list="project-categories"
                  placeholder="IoT, Robotics, AR/VR..."
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
                <datalist id="project-categories">
                  {existingCategories.map((category) => (
                    <option value={category} key={category} />
                  ))}
                </datalist>
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Description *</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating || !form.title.trim()}
                  className="text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 text-xs"
                >
                  {aiGenerating ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Optional: generate from title, technologies, status, and any notes you add here.
              </p>
              <RichTextEditor
                value={form.descriptionHtml}
                onChange={(html) => setForm((prev) => ({ ...prev, descriptionHtml: html }))}
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
                  {PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Start Date</span>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleChange}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
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
              <span className="text-xs text-slate-500">
                So others can reach the project creator.
              </span>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Project PIN *</span>
              <input
                type="text"
                name="deletePin"
                value={form.deletePin}
                onChange={handleChange}
                placeholder="Min 4 characters"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none pin-mask"
                autoComplete="off"
                data-1p-ignore=""
                data-lpignore="true"
                minLength={4}
                required
              />
              <span className="text-xs text-slate-500">
                Required for deleting this project and generating phone uploads.
              </span>
            </label>

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
            onClick={() => {
              resetForm();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-project-form"
            disabled={isSubmitDisabled || submitting}
            className="text-white bg-cyan-600 hover:bg-cyan-500"
          >
            {submitting ? 'Saving...' : 'Save project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
