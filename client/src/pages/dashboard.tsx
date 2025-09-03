import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import StatsOverview from "@/components/stats/stats-overview";
import GraduateProfileProgressComponent from "@/components/progress/graduate-profile-progress";
import BadgeCard from "@/components/badge/badge-card";
import EvidenceModal from "@/components/badge/evidence-modal";
import { UserStats, GraduateProfileProgress } from "@/types";
import { Badge, BadgeApplication } from "@shared/schema";

// Mock user ID - in a real app this would come from auth context
const MOCK_USER_ID = "1";

export default function Dashboard() {
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);

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

  // Fetch all badges for evidence modal
  const { data: badges = [] } = useQuery<Badge[]>({
    queryKey: ['/api/badges'],
  });

  // Get current applications (in progress or submitted)
  const currentApplications = applications.filter(app => 
    ['in_progress', 'submitted', 'in_review'].includes(app.status)
  ).slice(0, 3);

  const recentActivities = [
    {
      type: 'badge_earned',
      title: 'Leadership Badge Earned',
      timestamp: '2 days ago',
      icon: 'fas fa-check',
      color: 'bg-success'
    },
    {
      type: 'evidence_submitted',
      title: 'Evidence submitted for Teamwork',
      timestamp: '5 days ago',
      icon: 'fas fa-upload',
      color: 'bg-warning'
    },
    {
      type: 'application_started',
      title: 'Started Creative Thinking badge',
      timestamp: '1 week ago',
      icon: 'fas fa-plus',
      color: 'bg-primary'
    }
  ];

  return (
    <>
      <Header 
        title="Dashboard" 
        description="Track your badge progress and achievements"
        onSubmitEvidence={() => setIsEvidenceModalOpen(true)}
      />
      
      <div className="p-6 overflow-y-auto h-full">
        <StatsOverview stats={stats} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GraduateProfileProgressComponent progress={progress} />
          </div>
          
          <div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h2 className="text-xl font-bold mb-6" data-testid="recent-activity-title">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-8 h-8 ${activity.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <i className={`${activity.icon} text-white text-xs`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium" data-testid={`activity-title-${index}`}>{activity.title}</p>
                      <p className="text-xs text-muted-foreground" data-testid={`activity-time-${index}`}>{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" data-testid="current-applications-title">Current Badge Applications</h2>
            <a href="/badges" className="text-primary hover:underline text-sm font-medium" data-testid="link-view-all">
              View all
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentApplications.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <i className="fas fa-medal text-4xl text-muted-foreground mb-4"></i>
                <h3 className="text-lg font-medium mb-2">No active applications</h3>
                <p className="text-muted-foreground mb-4">Start your badge journey by browsing available badges</p>
                <a href="/badges" className="text-primary hover:underline">Browse Badge Catalog</a>
              </div>
            ) : (
              currentApplications.map((application) => (
                <BadgeCard
                  key={application.id}
                  badge={application.badge}
                  application={application}
                  onContinueApplication={() => console.log('Continue application:', application.id)}
                  onViewApplication={() => console.log('View application:', application.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      <EvidenceModal
        isOpen={isEvidenceModalOpen}
        onClose={() => setIsEvidenceModalOpen(false)}
        badges={badges}
      />
    </>
  );
}
