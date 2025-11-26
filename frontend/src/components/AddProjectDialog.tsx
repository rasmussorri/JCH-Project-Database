import { useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

import type { Project } from '../types/project';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';

interface AddProjectDialogProps {
  onAdd: (project: Project) => void;
  existingCategories: string[];
}

interface FormState {
  title: string;
  description: string;
  category: string;
  status: Project['status'];
  startDate: string;
  team: string;
  technologies: string;
  imageUrl: string;
}

export function AddProjectDialog({
  onAdd,
  existingCategories,
}: AddProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => ({
    title: '',
    description: '',
    category: existingCategories[0] ?? '',
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    team: '',
    technologies: '',
    imageUrl: '',
  }));

  const imagePreview = imageDataUrl ?? (form.imageUrl.trim() || null);

  const isSubmitDisabled = useMemo(() => {
    return !form.title.trim() || !form.description.trim();
  }, [form.title, form.description]);

  const resetForm = () => {
    setForm({
      title: '',
      description: '',
      category: existingCategories[0] ?? '',
      status: 'In Progress',
      startDate: new Date().toISOString().split('T')[0],
      team: '',
      technologies: '',
      imageUrl: '',
    });
    setImageDataUrl(null);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageDataUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newProject: Project = {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || 'Uncategorized',
      status: form.status,
      startDate: form.startDate,
      team: form.team
        .split(',')
        .map((member) => member.trim())
        .filter(Boolean),
      technologies: form.technologies
        .split(',')
        .map((tech) => tech.trim())
        .filter(Boolean),
      imageUrl: imagePreview ?? undefined,
    };

    onAdd(newProject);
    setOpen(false);
    resetForm();
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
      <DialogContent className="max-w-3xl bg-slate-900 border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Add New Project</DialogTitle>
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
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                placeholder="Describe the project goals and outcomes..."
                required
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

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Image URL</span>
                <input
                  name="imageUrl"
                  value={form.imageUrl}
                  onChange={(event) => {
                    setImageDataUrl(null);
                    handleChange(event);
                  }}
                  placeholder="https://example.com/project.jpg"
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-100 focus:border-cyan-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-slate-400">Upload Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="rounded-lg border border-dashed border-slate-700 bg-slate-900 px-4 py-2 text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-3 file:py-1 file:text-slate-200 hover:border-cyan-500"
                />
              </label>
            </div>

            {imagePreview && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <span className="text-sm text-slate-400">Image Preview</span>
                <img
                  src={imagePreview}
                  alt="Project preview"
                  className="mt-3 h-48 w-full rounded-lg object-cover"
                />
              </div>
            )}
          </form>
        </ScrollArea>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="ghost"
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
            disabled={isSubmitDisabled}
          >
            Save project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

