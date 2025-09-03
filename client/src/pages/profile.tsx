import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Badge, BadgeApplication, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GRADUATE_PROFILE_LABELS, GRADUATE_PROFILE_ICONS } from "@/types";

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = "1";

export default function ProfilePage() {
  // Fetch user data
  const { data: user } = useQuery<User>({
    queryKey: ['/api/users', MOCK_USER_ID],
  });

  // Fetch user applications
  const { data: applications = [] } = useQuery<(BadgeApplication & { badge: Badge; evidence: any[] })[]>({
    queryKey: ['/api/users', MOCK_USER_ID, 'applications'],
  });

  // Get earned badges
  const earnedBadges = applications.filter(app => app.status === 'earned');

  // Group earned badges by graduate profile
  const badgesByProfile = earnedBadges.reduce((acc, app) => {
    const profile = app.badge.graduateProfile;
    if (!acc[profile]) {
      acc[profile] = [];
    }
    acc[profile].push(app);
    return acc;
  }, {} as Record<string, (BadgeApplication & { badge: Badge; evidence: any[] })[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (!user) {
    return (
      <>
        <Header title="Profile" description="Your personal badge portfolio" />
        <div className="p-6">
          <div className="text-center">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Profile" description="Your personal badge portfolio" />
      
      <div className="p-6 overflow-y-auto h-full">
        {/* User Info Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-2xl" data-testid="user-avatar">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2" data-testid="user-name">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground mb-1" data-testid="user-email">{user.email}</p>
                <p className="text-muted-foreground mb-4" data-testid="user-username">@{user.username}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-trophy text-success"></i>
                    <span data-testid="earned-badges-count">{earnedBadges.length} badges earned</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <i className="fas fa-calendar"></i>
                    <span data-testid="join-date">Joined {formatDate(user.createdAt.toString())}</span>
                  </span>
                </div>
              </div>
              <Button variant="outline" data-testid="button-edit-profile">
                <i className="fas fa-edit mr-2"></i>
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Badge Showcase */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6" data-testid="badge-showcase-title">Badge Showcase</h2>
          
          {earnedBadges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <i className="fas fa-medal text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No badges earned yet</h3>
                <p className="text-muted-foreground mb-4">Start your badge journey by exploring available badges</p>
                <Button data-testid="button-browse-badges">
                  <i className="fas fa-search mr-2"></i>
                  Browse Badges
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {Object.entries(GRADUATE_PROFILE_LABELS).map(([profile, label]) => {
                const profileBadges = badgesByProfile[profile] || [];
                
                if (profileBadges.length === 0) return null;
                
                return (
                  <Card key={profile}>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center graduate-profile-${profile}`}>
                          <i className={`${GRADUATE_PROFILE_ICONS[profile]} text-lg`}></i>
                        </div>
                        <span data-testid={`profile-section-${profile}`}>{label}</span>
                        <span className="text-sm font-normal text-muted-foreground">
                          ({profileBadges.length} badge{profileBadges.length !== 1 ? 's' : ''})
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {profileBadges.map((application) => (
                          <div key={application.id} className="p-4 border border-border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold" data-testid={`earned-badge-${application.badge.id}`}>
                                {application.badge.name}
                              </h4>
                              <i className="fas fa-check-circle text-success"></i>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {application.badge.description}
                            </p>
                            <div className="text-xs text-muted-foreground">
                              Earned on {application.reviewedAt ? formatDate(application.reviewedAt.toString()) : 'Unknown date'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="recent-activity-title">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {applications
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 5)
                .map((application, index) => (
                  <div key={application.id} className="flex items-center space-x-4 p-3 rounded-lg bg-muted/50">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center graduate-profile-${application.badge.graduateProfile}`}>
                      <i className={`${GRADUATE_PROFILE_ICONS[application.badge.graduateProfile]} text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`activity-${index}-title`}>
                        {application.status === 'earned' ? 'Earned' : 'Applied for'} {application.badge.name}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`activity-${index}-date`}>
                        {formatDate(application.createdAt.toString())}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      application.status === 'earned' 
                        ? 'bg-success/10 text-success' 
                        : application.status === 'in_progress'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-warning/10 text-warning'
                    }`}>
                      {application.status.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              
              {applications.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No activity yet. Start applying for badges to see your progress here.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
