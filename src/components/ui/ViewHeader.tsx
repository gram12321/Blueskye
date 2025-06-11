import { cn } from '@/lib/gamemechanics/tailwindUtils';

interface ViewHeaderProps {
  title: string;
  icon?: string;
  description?: string;
  className?: string;
}

export function ViewHeader({ title, icon, description, className }: ViewHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-2xl">{icon}</span>}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      {description && (
        <p className="text-muted-foreground">{description}</p>
      )}
    </div>
  );
} 