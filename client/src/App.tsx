import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Tasks from "@/pages/tasks";
import Workout from "@/pages/workout";
import Mind from "@/pages/mind";
import Routine from "@/pages/routine";
import Dev from "@/pages/dev";
import Navigation from "@/components/navigation";

function Router() {
  const { user, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      ) : (
        <div className="min-h-screen max-w-md mx-auto bg-white shadow-xl relative">
          <Route path="/" component={Dashboard} />
          <Route path="/tasks" component={Tasks} />
          <Route path="/workout" component={Workout} />
          <Route path="/mind" component={Mind} />
          <Route path="/routine" component={Routine} />
          <Route path="/dev" component={Dev} />
          <Navigation />
        </div>
      )}
      <Route component={NotFound} />
    </Switch>
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
