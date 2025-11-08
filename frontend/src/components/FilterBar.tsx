import type { Project } from '../types/project';
import { Button } from '../ui/button';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  selectedStatus: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  projects: Project[];
}

export function FilterBar({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  projects,
}: FilterBarProps) {
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const statuses = ['All', ...Array.from(new Set(projects.map(p => p.status)))];

  return (
    <div className="mb-10 space-y-6">
      <div className="flex items-center gap-3">
        <Filter className="w-6 h-6 text-slate-400" />
        <span className="text-slate-300">Filter Projects</span>
      </div>

      <div className="flex flex-wrap gap-6">
        {/* Category Filters */}
        <div className="space-y-3">
          <p className="text-slate-400">Category</p>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                onClick={() => onCategoryChange(category)}
                variant="outline"
                size="lg"
                className={`min-w-[120px] touch-manipulation border-white text-white hover:bg-white/10 hover:text-white ${selectedCategory === category ? 'bg-white text-slate-900 hover:bg-white hover:text-slate-900' : ''}`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Status Filters */}
        <div className="space-y-3">
          <p className="text-slate-400">Status</p>
          <div className="flex flex-wrap gap-3">
            {statuses.map((status) => (
              <Button
                key={status}
                onClick={() => onStatusChange(status)}
                variant="outline"
                size="lg"
                className={`min-w-[120px] touch-manipulation border-white text-white hover:bg-white/10 hover:text-white ${selectedStatus === status ? 'bg-white text-slate-900 hover:bg-white hover:text-slate-900' : ''}`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}