export interface UserStats {
  earnedBadges: number;
  inProgress: number;
  totalBadges: number;
  completionRate: number;
}

export interface GraduateProfileProgress {
  profile: string;
  earnedCount: number;
  totalCount: number;
  percentage: number;
}

export interface RecentActivity {
  id: string;
  type: 'badge_earned' | 'evidence_submitted' | 'application_started';
  title: string;
  timestamp: string;
  badgeId?: string;
  applicationId?: string;
}

export const GRADUATE_PROFILE_LABELS: Record<string, string> = {
  excellence: 'Excellence',
  innovation: 'Innovation',
  integrity: 'Integrity',
  inspiration: 'Inspiration',
  hauora: 'Hauora (Wellbeing)',
  relationships: 'Relationships'
};

export const GRADUATE_PROFILE_ICONS: Record<string, string> = {
  excellence: 'fas fa-trophy',
  innovation: 'fas fa-lightbulb',
  integrity: 'fas fa-shield-alt',
  inspiration: 'fas fa-star',
  hauora: 'fas fa-heart',
  relationships: 'fas fa-users'
};

export const BADGE_STATUS_LABELS: Record<string, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  submitted: 'Submitted',
  in_review: 'In Review',
  earned: 'Earned',
  rejected: 'Rejected'
};

export const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  written_reflection: 'Written Reflection',
  file_upload: 'File Upload',
  project_link: 'Project Link',
  video_submission: 'Video Submission'
};
