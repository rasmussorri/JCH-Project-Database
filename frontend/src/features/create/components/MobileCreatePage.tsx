import { useState, useRef, useCallback } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import {
  X,
  CheckCircle,
  Loader2,
  ArrowLeft,
  ArrowRight,
  Camera,
  Send,
  Upload,
} from 'lucide-react';
import { Button } from '../../../ui/button';
import { StepIndicator } from '../../../components/StepIndicator';
import { getInitials } from '../../../utils/formatting';
import { createProjectWithAI } from '../../projects/services/projectService';
import { compressImageForUpload } from '../../../lib/imageOptimization';
import { PROJECT_STATUSES } from '../../projects/types';
import type { MobileCreateProjectPayload, Project } from '../../projects/types';

const STEP_LABELS = ['Info', 'Describe', 'Images', 'Review'];
const MAX_IMAGES = 10;

interface FormState {
  title: string;
  category: string;
  status: Project['status'];
  startDate: string;
  team: string;
  technologies: string;
  deletePin: string;
  contact: string;
  problem: string;
  goal: string;
  notes: string;
}

interface ImageFile {
  file: File;
  preview: string;
}

function getFileExtension(file: File): string {
  const fromName = file.name.split('.').pop();
  if (fromName) return fromName.toLowerCase();
  const fromType = file.type.split('/').pop();
  return fromType ? fromType.toLowerCase() : 'jpg';
}

export function MobileCreatePage() {
  const { token } = useParams();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    title: '',
    category: '',
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    team: '',
    technologies: '',
    deletePin: '',
    contact: '',
    problem: '',
    goal: '',
    notes: '',
  });
  const [images, setImages] = useState<ImageFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    [],
  );

  const handleImageSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      if (files.length === 0) return;

      const remaining = MAX_IMAGES - images.length;
      const toAdd = files.slice(0, remaining);

      // Show uploading indicator on the UI if we want, but compressing is usually quick enough
      for (const rawFile of toAdd) {
        try {
          const compressedFile = await compressImageForUpload(rawFile);
          
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              setImages((prev) => [
                ...prev,
                { file: compressedFile, preview: ev.target!.result as string },
              ]);
            }
          };
          reader.readAsDataURL(compressedFile);
        } catch (err) {
          console.error("Failed to compress file", err);
        }
      }

      if (e.target) e.target.value = '';
    },
    [images.length],
  );

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const canProceedStep1 = form.title.trim() !== '' && form.deletePin.trim().length >= 4;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || !token) return;

    setSubmitting(true);
    setError('');

    try {
      const members = form.team
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean)
        .map((name) => ({ name, initials: getInitials(name) }));

      const technologies = form.technologies
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: MobileCreateProjectPayload = {
        token,
        title: form.title.trim(),
        problem: form.problem.trim(),
        goal: form.goal.trim(),
        technologies,
        status: form.status,
        category: form.category.trim() || 'Uncategorized',
        startDate: form.startDate,
        members,
        notes: form.notes.trim(),
        deletePin: form.deletePin.trim(),
        contact: form.contact.trim() || undefined,
        images: images.map((img) => ({
          fileExt: getFileExtension(img.file),
          contentType: img.file.type || 'image/jpeg',
        })),
      };

      setSubmitPhase('Generating description...');
      const { uploadUrls } = await createProjectWithAI(payload);

      if (uploadUrls.length > 0 && images.length > 0) {
        setSubmitPhase('Uploading images...');
        const uploads = images.map((img, i) => {
          if (!uploadUrls[i]) return Promise.resolve();
          return fetch(uploadUrls[i], {
            method: 'PUT',
            headers: {
              'content-type': img.file.type || 'image/jpeg',
              'x-upsert': 'true',
            },
            body: img.file,
          });
        });
        await Promise.all(uploads);
      }

      setSubmitPhase('Done!');
      setSubmitted(true);
    } catch (err) {
      console.error('Create project error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 overflow-x-hidden px-4 py-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">Invalid link</h1>
          <p className="text-slate-400">This creation link is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 overflow-x-hidden px-4 py-6 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6">
          <CheckCircle className="w-14 h-14 sm:w-16 sm:h-16 text-green-500 mx-auto" />
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-100">Project created!</h1>
          <p className="text-slate-400">
            The project has been added to the database. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none';
  const labelClass = 'text-sm text-slate-400';

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs text-slate-500 mb-1">JHC Project Database</p>
          <h1 className="text-xl font-semibold text-slate-100">Create Project</h1>
        </div>

        <StepIndicator totalSteps={4} currentStep={step} labels={STEP_LABELS} />

        {/* Step 1 — Basic Info */}
        {step === 1 && (
          <div className="space-y-5">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Project Title *</span>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Smart Greenhouse Monitor"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Category</span>
              <input
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. IoT, Robotics, AR/VR"
                className={inputClass}
                list="mobile-categories"
              />
              <datalist id="mobile-categories">
                {['IoT', 'Robotics', 'AR/VR', 'Software', 'Hardware', 'AI/ML'].map(
                  (c) => (
                    <option value={c} key={c} />
                  ),
                )}
              </datalist>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className={inputClass}
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5 overflow-hidden">
              <span className={labelClass}>Start Date</span>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className={`${inputClass} min-w-0 max-w-full`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Team Members</span>
              <input
                name="team"
                value={form.team}
                onChange={handleChange}
                placeholder="Comma-separated: Ada Lovelace, Alan Turing"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Technologies</span>
              <input
                name="technologies"
                value={form.technologies}
                onChange={handleChange}
                placeholder="Comma-separated: React, Arduino, Python"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Contact Info</span>
              <input
                name="contact"
                value={form.contact}
                onChange={handleChange}
                placeholder="Email or phone number"
                className={inputClass}
              />
              <span className="text-xs text-slate-500">
                So others can reach you about this project.
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Project PIN *</span>
              <input
                type="text"
                name="deletePin"
                value={form.deletePin}
                onChange={handleChange}
                placeholder="Min 4 characters"
                className={`${inputClass} pin-mask`}
                autoComplete="off"
                data-1p-ignore=""
                data-lpignore="true"
                minLength={4}
              />
              <span className="text-xs text-slate-500">
                Needed for edits, uploads, and deletion.
              </span>
            </label>

            <Button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3"
            >
              Next: Describe Project
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2 — Describe */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-xs text-slate-500 italic">
              Don't worry about writing perfectly — AI will format your description
              into a clean summary.
            </p>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Problem</span>
              <textarea
                name="problem"
                value={form.problem}
                onChange={handleChange}
                placeholder="What problem does this project solve?"
                className={`${inputClass} min-h-[100px] resize-y`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Goal</span>
              <textarea
                name="goal"
                value={form.goal}
                onChange={handleChange}
                placeholder="What is the desired outcome?"
                className={`${inputClass} min-h-[100px] resize-y`}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={labelClass}>Additional Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Any extra details, context, or progress updates"
                className={`${inputClass} min-h-[80px] resize-y`}
              />
            </label>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                Next: Images
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Images */}
        {step === 3 && (
          <div className="space-y-5">
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => galleryInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="w-full border-dashed border-2 border-slate-700 hover:border-cyan-500 bg-slate-800/50 text-slate-300 py-6"
              >
                <Upload className="w-5 h-5 mr-2" />
                {images.length === 0 ? 'Choose from gallery' : `Add more (${images.length}/${MAX_IMAGES})`}
              </Button>
              <Button
                variant="outline"
                onClick={() => cameraInputRef.current?.click()}
                disabled={images.length >= MAX_IMAGES}
                className="w-full border-dashed border-2 border-slate-700 hover:border-cyan-500 bg-slate-800/50 text-slate-300 py-6"
              >
                <Camera className="w-5 h-5 mr-2" />
                Take photo
              </Button>
            </div>
            <p className="text-xs text-slate-500 text-center">
              Choose existing photos from gallery or take new ones. Up to {MAX_IMAGES} images.
            </p>

            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-slate-800"
                  >
                    <img
                      src={img.preview}
                      alt={`Preview ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-full"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={() => setStep(4)}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white"
              >
                {images.length === 0 ? 'Skip' : 'Next: Review'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Review & Submit */}
        {step === 4 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-slate-900 rounded-lg border border-slate-800 p-5 space-y-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Title</span>
                <p className="text-slate-100 font-medium">{form.title}</p>
              </div>

              {form.category && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Category</span>
                  <p className="text-slate-300">{form.category}</p>
                </div>
              )}

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Status</span>
                <p className="text-slate-300">{form.status}</p>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wide">Start Date</span>
                <p className="text-slate-300">
                  {new Date(form.startDate).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {form.team.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Team</span>
                  <p className="text-slate-300">{form.team}</p>
                </div>
              )}

              {form.technologies.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Technologies</span>
                  <p className="text-slate-300">{form.technologies}</p>
                </div>
              )}

              {form.contact.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Contact</span>
                  <p className="text-slate-300">{form.contact}</p>
                </div>
              )}

              {form.problem.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Problem</span>
                  <p className="text-slate-300 text-sm">{form.problem}</p>
                </div>
              )}

              {form.goal.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Goal</span>
                  <p className="text-slate-300 text-sm">{form.goal}</p>
                </div>
              )}

              {form.notes.trim() && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Notes</span>
                  <p className="text-slate-300 text-sm">{form.notes}</p>
                </div>
              )}

              {images.length > 0 && (
                <div>
                  <span className="text-xs text-slate-500 uppercase tracking-wide">
                    Images ({images.length})
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2">
                    {images.map((img, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded overflow-hidden bg-slate-800"
                      >
                        <img
                          src={img.preview}
                          alt={`Preview ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-800 bg-red-900/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                disabled={submitting}
                className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white py-3"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {submitPhase}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
