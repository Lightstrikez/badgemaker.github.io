import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import BadgeCatalog from "@/pages/badge-catalog";
import Evidence from "@/pages/evidence";
import Progress from "@/pages/progress";
import Profile from "@/pages/profile";
import BadgeBuilder from "@/pages/badge-builder";
import NotFound from "@/pages/not-found";
import Sidebar from "@/components/layout/sidebar";

function Router() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/badges" component={BadgeCatalog} />
          <Route path="/evidence" component={Evidence} />
          <Route path="/progress" component={Progress} />
          <Route path="/profile" component={Profile} />
          <Route path="/badge-builder" component={BadgeBuilder} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
