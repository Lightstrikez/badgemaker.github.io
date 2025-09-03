import { Badge, BadgeApplication } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BADGE_STATUS_LABELS, GRADUATE_PROFILE_ICONS } from "@/types";
import { cn } from "@/lib/utils";

interface BadgeCardProps {
  badge: Badge;
  application?: BadgeApplication & { evidence: any[] };
  onStartApplication?: () => void;
  onContinueApplication?: () => void;
  onViewApplication?: () => void;
}

export default function BadgeCard({ 
  badge, 
  application, 
  onStartApplication, 
  onContinueApplication, 
  onViewApplication 
}: BadgeCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned':
        return 'bg-success/10 text-success';
      case 'in_review':
      case 'submitted':
        return 'bg-warning/10 text-warning';
      case 'in_progress':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted/50 text-muted-foreground';
    }
  };

  const getProgressPercentage = () => {
    if (!application) return 0;
    const submitted = application.evidence?.length || 0;
    return Math.round((submitted / badge.requiredEvidenceCount) * 100);
  };

  const getActionButton = () => {
    if (!application) {
      return (
        <Button 
          onClick={onStartApplication}
          variant="outline"
          className="w-full"
          data-testid={`button-start-${badge.id}`}
        >
          Start Application
        </Button>
      );
    }

    switch (application.status) {
      case 'in_progress':
        return (
          <Button 
            onClick={onContinueApplication}
            className="w-full"
            data-testid={`button-continue-${badge.id}`}
          >
            Continue Application
          </Button>
        );
      case 'submitted':
      case 'in_review':
      case 'earned':
        return (
          <Button 
            onClick={onViewApplication}
            variant="outline"
            className="w-full"
            data-testid={`button-view-${badge.id}`}
          >
            View Application
          </Button>
        );
      default:
        return (
          <Button 
            onClick={onStartApplication}
            variant="outline"
            className="w-full"
            data-testid={`button-start-${badge.id}`}
          >
            Start Application
          </Button>
        );
    }
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center",
          `graduate-profile-${badge.graduateProfile}`
        )}>
          <i className={`${GRADUATE_PROFILE_ICONS[badge.graduateProfile]} text-xl`}></i>
        </div>
        {application && (
          <span className={cn(
            "px-2 py-1 text-xs font-medium rounded-full",
            getStatusColor(application.status)
          )} data-testid={`status-${badge.id}`}>
            {BADGE_STATUS_LABELS[application.status]}
          </span>
        )}
      </div>
      
      <h3 className="font-semibold mb-2" data-testid={`badge-name-${badge.id}`}>
        {badge.name}
      </h3>
      <p className="text-muted-foreground text-sm mb-4" data-testid={`badge-description-${badge.id}`}>
        {badge.description}
      </p>
      
      {application && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span>Evidence Submitted</span>
            <span className="font-medium" data-testid={`evidence-count-${badge.id}`}>
              {application.evidence?.length || 0}/{badge.requiredEvidenceCount}
            </span>
          </div>
          <Progress 
            value={getProgressPercentage()} 
            className="w-full" 
            data-testid={`progress-${badge.id}`}
          />
        </div>
      )}
      
      {getActionButton()}
    </div>
  );
}
