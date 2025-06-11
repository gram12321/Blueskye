import { ViewHeader } from '@/components/ui/ViewHeader';
import { Card, CardContent } from '@/components/ui/ShadCN/Card';

interface PlaceholderViewProps {
  title: string;
  icon: string;
  description?: string;
}

export function PlaceholderView({ title, icon, description }: PlaceholderViewProps) {
  return (
    <div className="min-h-screen pb-16">
      <ViewHeader 
        title={title}
        icon={icon}
        description={description || `${title} functionality coming soon.`}
      />
      
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">{icon}</div>
            <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
            <p className="text-muted-foreground">
              This {title.toLowerCase()} feature is currently under development.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 