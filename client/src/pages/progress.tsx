import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsOverview from "@/components/stats/stats-overview";
import GraduateProfileProgressComponent from "@/components/progress/graduate-profile-progress";
import { Progress } from "@/components/ui/progress";
import { Badge, BadgeApplication } from "@shared/schema";
import { UserStats, GraduateProfileProgress, GRADUATE_PROFILE_LABELS } from "@/types";

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = "1";

export default function ProgressPage() {
  // Fetch user stats
  const { data: stats = { earnedBadges: 0, inProgress: 0, totalBadges: 0, completionRate: 0 } } = useQuery<UserStats>({
    queryKey: ['/api/users', MOCK_USER_ID, 'stats'],
  });

  // Fetch graduate profile progress
  const { data: progress = [] } = useQuery<GraduateProfileProgress[]>({
    queryKey: ['/api/users', MOCK_USER_ID, 'progress'],
  });

  // Fetch user applications
  const { data: applications = [] } = useQuery<(BadgeApplication & { badge: Badge; evidence: any[] })[]>({
    queryKey: ['/api/users', MOCK_USER_ID, 'applications'],
  });

  // Fetch all badges
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Group applications by graduate profile
  const applicationsByProfile = applications.reduce((acc, app) => {
    const profile = app.badge.graduateProfile;
    if (!acc[profile]) {
      acc[profile] = [];
    }
    acc[profile].push(app);
    return acc;
  }, {} as Record<string, (BadgeApplication & { badge: Badge; evidence: any[] })[]>);

  // Group badges by graduate profile
  const badgesByProfile = badges.reduce((acc, badge) => {
    const profile = badge.graduateProfile;
    if (!acc[profile]) {
      acc[profile] = [];
    }
    acc[profile].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'earned':
        return 'text-success';
      case 'in_review':
      case 'submitted':
        return 'text-warning';
      case 'in_progress':
        return 'text-primary';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'earned':
        return 'fas fa-check-circle';
      case 'in_review':
        return 'fas fa-clock';
      case 'submitted':
        return 'fas fa-paper-plane';
      case 'in_progress':
        return 'fas fa-play-circle';
      default:
        return 'fas fa-circle';
    }
  };

  return (
    <>
      <Header 
        title="Progress" 
        description="Track your overall badge progress and achievements"
      />
      
      <div className="p-6 overflow-y-auto h-full">
        <StatsOverview stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <GraduateProfileProgressComponent progress={progress} />
          </div>
          
          <div className="bg-card p-6 rounded-lg border border-border">
            <h2 className="text-xl font-bold mb-6" data-testid="achievement-milestones-title">Achievement Milestones</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-medal text-secondary text-lg"></i>
                  <span className="font-medium">First Badge</span>
                </div>
                <i className={stats.earnedBadges > 0 ? "fas fa-check text-success" : "fas fa-lock text-muted-foreground"}></i>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-fire text-warning text-lg"></i>
                  <span className="font-medium">5 Badges</span>
                </div>
                <i className={stats.earnedBadges >= 5 ? "fas fa-check text-success" : "fas fa-lock text-muted-foreground"}></i>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-crown text-yellow-500 text-lg"></i>
                  <span className="font-medium">Profile Champion</span>
                </div>
                <i className={progress.some(p => p.percentage === 100) ? "fas fa-check text-success" : "fas fa-lock text-muted-foreground"}></i>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-trophy text-yellow-500 text-lg"></i>
                  <span className="font-medium">Badge Master</span>
                </div>
                <i className={stats.completionRate >= 50 ? "fas fa-check text-success" : "fas fa-lock text-muted-foreground"}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Progress by Graduate Profile */}
        <div className="space-y-8">
          {Object.entries(GRADUATE_PROFILE_LABELS).map(([profile, label]) => {
            const profileApplications = applicationsByProfile[profile] || [];
            const profileBadges = badgesByProfile[profile] || [];
            const earnedCount = profileApplications.filter(app => app.status === 'earned').length;
            const totalCount = profileBadges.length;
            const percentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

            return (
              <div key={profile} className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" data-testid={`profile-section-${profile}`}>{label}</h3>
                  <div className="text-sm text-muted-foreground">
                    {earnedCount}/{totalCount} badges ({percentage}%)
                  </div>
                </div>
                
                <Progress value={percentage} className="mb-6" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {profileBadges.map((badge) => {
                    const application = profileApplications.find(app => app.badgeId === badge.id);
                    return (
                      <div key={badge.id} className="p-4 border border-border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium" data-testid={`badge-name-${badge.id}`}>{badge.name}</h4>
                          {application && (
                            <i className={`${getStatusIcon(application.status)} ${getStatusColor(application.status)}`}></i>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3" data-testid={`badge-description-${badge.id}`}>
                          {badge.description}
                        </p>
                        {application ? (
                          <div className="text-xs text-muted-foreground">
                            Status: <span className={getStatusColor(application.status)} data-testid={`badge-status-${badge.id}`}>
                              {application.status.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground" data-testid={`badge-status-${badge.id}`}>
                            Not started
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
