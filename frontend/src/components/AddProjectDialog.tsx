import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { CreateProjectPayload, Project } from '../types/project';
import { RichTextEditor } from './RichTextEditor';
import { stripHtml } from '../lib/sanitizeHtml';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface AddProjectDialogProps {
  onCreate: (payload: CreateProjectPayload) => Promise<void>;
  existingCategories: string[];
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
}

export function AddProjectDialog({
  onCreate,
  existingCategories,
}: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    descriptionHtml: '',
    category: existingCategories[0] ?? '',
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    team: '',
    technologies: '',
    deletePin: '',
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
    });
    setError('');
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase();

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
      await onCreate({
        title: form.title.trim(),
        description_html: form.descriptionHtml.trim() || '<p></p>',
        category: form.category.trim() || 'Uncategorized',
        status: form.status,
        startedAt: form.startDate,
        deletePin: form.deletePin.trim(),
        members,
        tech,
      });
      setOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="border-white text-white hover:bg-white/10 hover:text-white"
      >
        + Add Project
      </Button>
      <DialogContent className="max-w-3xl bg-slate-900 border-slate-800" aria-describedby="add-project-description">
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

            <label className="flex flex-col gap-2">
              <span className="text-sm text-slate-400">Description *</span>
              <RichTextEditor
                value={form.descriptionHtml}
                onChange={(html) => setForm((prev) => ({ ...prev, descriptionHtml: html }))}
                placeholder="Describe the project goals and outcomes..."
                minHeight="120px"
              />
            </label>

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
                  <option value="Testing">Testing</option>
                  <option value="Completed">Completed</option>
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
              <span className="text-sm text-slate-400">Project PIN *</span>
              <input
                type="password"
                name="deletePin"
                value={form.deletePin}
                onChange={handleChange}
                placeholder="Min 4 characters"
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
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

