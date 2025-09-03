import { UserStats } from "@/types";

interface StatsOverviewProps {
  stats: UserStats;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  const statItems = [
    {
      label: "Badges Earned",
      value: stats.earnedBadges.toString(),
      icon: "fas fa-trophy",
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      label: "In Progress",
      value: stats.inProgress.toString(),
      icon: "fas fa-clock",
      color: "text-warning",
      bgColor: "bg-warning/10"
    },
    {
      label: "Total Available",
      value: stats.totalBadges.toString(),
      icon: "fas fa-medal",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      label: "Completion Rate",
      value: `${stats.completionRate}%`,
      icon: "fas fa-percentage",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statItems.map((item, index) => (
        <div key={index} className="bg-card p-6 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium" data-testid={`stat-label-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.label}
              </p>
              <p className={`text-3xl font-bold ${item.color}`} data-testid={`stat-value-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                {item.value}
              </p>
            </div>
            <div className={`w-12 h-12 ${item.bgColor} rounded-lg flex items-center justify-center`}>
              <i className={`${item.icon} ${item.color} text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
