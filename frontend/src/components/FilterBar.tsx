import type { Project } from '../types/project';
import { Button } from '../ui/button';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  selectedStatus: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  projects: Project[];
  addProjectSlot?: React.ReactNode;
}

export function FilterBar({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  projects,
  addProjectSlot,
}: FilterBarProps) {
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const statuses = ['All', ...Array.from(new Set(projects.map(p => p.status)))];

  return (
    <div className="mb-6 rounded-lg border border-slate-800 bg-slate-900/80 p-6">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3 shrink-0">
          <Filter className="w-6 h-6 text-slate-400" />
          <span className="text-slate-300">Filter Projects</span>
        </div>
        <div className="flex flex-wrap items-center gap-6 flex-1 min-w-0">
          {/* Category: label and buttons in a row, vertically centered */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-slate-400 text-sm shrink-0">Category</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  variant="outline"
                  size="sm"
                  className={`min-w-[80px] touch-manipulation border-white text-white hover:bg-white/10 hover:text-white ${selectedCategory === category ? 'bg-white text-slate-900 hover:bg-white hover:text-slate-900' : ''}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
          {/* Status: label and buttons in a row, vertically centered */}
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-slate-400 text-sm shrink-0">Status</p>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  onClick={() => onStatusChange(status)}
                  variant="outline"
                  size="sm"
                  className={`min-w-[80px] touch-manipulation border-white text-white hover:bg-white/10 hover:text-white ${selectedStatus === status ? 'bg-white text-slate-900 hover:bg-white hover:text-slate-900' : ''}`}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <div className="shrink-0">{addProjectSlot}</div>
      </div>
    </div>
  );
}