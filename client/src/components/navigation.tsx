import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, CheckSquare, Dumbbell, Brain, Moon, Code, Plus } from "lucide-react";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/tasks", icon: CheckSquare, label: "Tasks" },
    { path: "/workout", icon: Dumbbell, label: "Workout" },
    { path: "/mind", icon: Brain, label: "Mind" },
    { path: "/routine", icon: Moon, label: "Routine" },
    { path: "/dev", icon: Code, label: "Dev" },
  ];

  const handleQuickAdd = () => {
    // Navigate to appropriate add modal based on current page
    if (location === "/tasks") {
      // This will be handled by the tasks page
      const event = new CustomEvent('openAddModal');
      window.dispatchEvent(event);
    }
    // Add more quick add functionality for other pages
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          onClick={handleQuickAdd}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-md mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            
            return (
              <Button
                key={item.path}
                variant="ghost"
                className={`flex flex-col items-center py-2 px-3 ${
                  isActive ? 'text-blue-500' : 'text-gray-400'
                }`}
                onClick={() => setLocation(item.path)}
              >
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
