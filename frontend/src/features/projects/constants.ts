import type { ProjectStatus } from './types';

export const statusColors: Record<ProjectStatus, string> = {
  'In Progress': 'bg-blue-600/90 text-blue-100 hover:bg-blue-600/90',
  'Finished': 'bg-green-600/90 text-green-100 hover:bg-green-600/90',
  'History': 'bg-slate-600/90 text-slate-100 hover:bg-slate-600/90',
};

export const categoryColors: Record<string, string> = {
  'IoT': 'bg-purple-600/90 text-purple-100 hover:bg-purple-600/90',
  'AR/VR': 'bg-pink-600/90 text-pink-100 hover:bg-pink-600/90',
  'Robotics': 'bg-cyan-600/90 text-cyan-100 hover:bg-cyan-600/90',
  'AI/ML': 'bg-indigo-600/90 text-indigo-100 hover:bg-indigo-600/90',
};
