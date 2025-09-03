import { GraduateProfileProgress, GRADUATE_PROFILE_LABELS } from "@/types";
import { Progress } from "@/components/ui/progress";

interface GraduateProfileProgressProps {
  progress: GraduateProfileProgress[];
}

export default function GraduateProfileProgressComponent({ progress }: GraduateProfileProgressProps) {
  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h2 className="text-xl font-bold mb-6" data-testid="graduate-profile-title">Graduate Profile Progress</h2>
      <div className="space-y-6">
        {progress.map((item) => (
          <div key={item.profile} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium" data-testid={`profile-name-${item.profile}`}>
                {GRADUATE_PROFILE_LABELS[item.profile]}
              </h3>
              <span className="text-sm text-muted-foreground" data-testid={`profile-count-${item.profile}`}>
                {item.earnedCount}/{item.totalCount} badges
              </span>
            </div>
            <Progress 
              value={item.percentage} 
              className="w-full" 
              data-testid={`progress-bar-${item.profile}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
