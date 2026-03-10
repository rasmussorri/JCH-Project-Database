import { cn } from '../../ui/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'main' | 'header' | 'footer' | 'section';
}

export function PageContainer({
  children,
  className,
  as: Tag = 'div',
}: PageContainerProps) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full max-w-[1800px] px-4 sm:px-6 lg:px-12',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
