import { cn } from '../../ui/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  isCompatibilityMode?: boolean;
}

export function ResponsiveGrid({ children, className, isCompatibilityMode = false }: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
        isCompatibilityMode ? '' : 'gap-4 sm:gap-6 lg:gap-8',
        className,
      )}
      style={isCompatibilityMode ? { 
        display: 'flex',
        flexWrap: 'wrap',
        margin: '0 -12px',
      } : {}}
    >
      {isCompatibilityMode 
        ? (Array.isArray(children) ? children : [children]).map((child, i) => (
            <div key={i} style={{ 
              width: '50%', 
              padding: '12px', 
              boxSizing: 'border-box',
              float: 'left' // Extra fallback for very old engines
            }}>
              {child}
            </div>
          ))
        : children
      }
    </div>
  );
}
