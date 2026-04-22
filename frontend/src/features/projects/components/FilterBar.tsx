import type { Project } from '../types';
import { Filter } from 'lucide-react';

interface FilterBarProps {
  selectedCategory: string;
  selectedStatus: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  projects: Project[];
  addProjectSlot?: React.ReactNode;
  isCompatibilityMode?: boolean;
}

const selectClassName =
  'w-full sm:w-auto sm:min-w-[140px] rounded-md border border-white/30 bg-slate-900 px-3 py-2.5 sm:py-2 text-sm text-white focus:border-white focus:outline-none focus:ring-2 focus:ring-white/30 touch-manipulation cursor-pointer [&>option]:bg-slate-800 [&>option]:text-white';

export function FilterBar({
  selectedCategory,
  selectedStatus,
  onCategoryChange,
  onStatusChange,
  projects,
  addProjectSlot,
  isCompatibilityMode = false,
}: FilterBarProps) {
  const categories = ['All', ...Array.from(new Set(projects.map(p => p.category)))];
  const statuses = ['All', ...Array.from(new Set(projects.map(p => p.status)))];

  const gapClass = isCompatibilityMode ? '' : 'gap-4 sm:gap-6';
  const innerGapClass = isCompatibilityMode ? '' : 'gap-3 sm:gap-6';
  const labelGapClass = isCompatibilityMode ? '' : 'gap-1.5 sm:gap-3';

  return (
    <div className="mb-4 sm:mb-6 rounded-lg border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
      <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center ${gapClass}`}>
        <div className={`flex items-center shrink-0 ${isCompatibilityMode ? 'sm:mr-6 mb-4 sm:mb-0' : 'gap-3'}`}>
          <Filter className={`w-5 h-5 sm:w-6 sm:h-6 text-slate-400 ${isCompatibilityMode ? 'mr-3' : ''}`} />
          <span className="text-slate-300">Filter Projects</span>
        </div>
        <div className={`flex flex-col sm:flex-row sm:flex-wrap sm:items-center flex-1 min-w-0 ${innerGapClass}`}>
          <div className={`flex flex-col sm:flex-row sm:items-center ${labelGapClass} ${isCompatibilityMode ? 'sm:mr-6 mb-3 sm:mb-0' : ''}`}>
            <label htmlFor="filter-category" className={`text-slate-400 text-sm shrink-0 ${isCompatibilityMode ? 'mb-1 sm:mb-0 sm:mr-3' : ''}`}>
              Category
            </label>
            <select
              id="filter-category"
              value={selectedCategory}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={selectClassName}
              aria-label="Filter by category"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div className={`flex flex-col sm:flex-row sm:items-center ${labelGapClass} ${isCompatibilityMode ? 'sm:mr-6 mb-3 sm:mb-0' : ''}`}>
            <label htmlFor="filter-status" className={`text-slate-400 text-sm shrink-0 ${isCompatibilityMode ? 'mb-1 sm:mb-0 sm:mr-3' : ''}`}>
              Status
            </label>
            <select
              id="filter-status"
              value={selectedStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className={selectClassName}
              aria-label="Filter by status"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">{addProjectSlot}</div>
      </div>
    </div>
  );
}
