import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  description: string;
  onSubmitEvidence?: () => void;
}

export default function Header({ title, description, onSubmitEvidence }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="header-title">{title}</h1>
          <p className="text-muted-foreground" data-testid="header-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button 
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-notifications"
            >
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full"></span>
            </button>
          </div>
          {onSubmitEvidence && (
            <Button 
              onClick={onSubmitEvidence}
              data-testid="button-submit-evidence"
            >
              Submit Evidence
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
