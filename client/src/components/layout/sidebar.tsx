import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: "fas fa-tachometer-alt" },
  { name: "Badge Catalog", href: "/badges", icon: "fas fa-medal" },
  { name: "My Evidence", href: "/evidence", icon: "fas fa-folder-open" },
  { name: "Progress", href: "/progress", icon: "fas fa-chart-line" },
  { name: "Profile", href: "/profile", icon: "fas fa-user" },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-lg">
            OJC
          </div>
          <div>
            <h1 className="font-semibold text-lg">Badge System</h1>
            <p className="text-muted-foreground text-sm">Student Portal</p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1">
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <a
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span>{item.name}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4">
        <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Student</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
