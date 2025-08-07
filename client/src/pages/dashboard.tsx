import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CalendarGrid } from "@/components/calendar-grid";
import { ExportModal } from "@/components/export-modal";
import { ChevronLeft, ChevronRight, Flame, Trophy, Download } from "lucide-react";
import { useState } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: todaysPerformance } = useQuery<any>({
    queryKey: ['/api/daily-performance', today],
    enabled: !!user,
  });

  const { data: waterIntake } = useQuery<any>({
    queryKey: ['/api/water-intake', today],
    enabled: !!user,
  });

  const { data: tasks } = useQuery<any[]>({
    queryKey: ['/api/tasks', today],
    enabled: !!user,
  });

  const { data: workoutLogs } = useQuery<any[]>({
    queryKey: ['/api/workout-logs', today],
    enabled: !!user,
  });

  const performanceData = [
    { name: "Daily Tasks", progress: todaysPerformance?.tasksScore || 0, color: "bg-blue-500", icon: "📋" },
    { name: "Workout", progress: todaysPerformance?.workoutScore || 0, color: "bg-green-500", icon: "💪" },
    { name: "Mind Workout", progress: todaysPerformance?.mindScore || 0, color: "bg-purple-500", icon: "🧠" },
    { name: "Daily Routine", progress: todaysPerformance?.routineScore || 0, color: "bg-orange-500", icon: "🌅" },
    { name: "Dev Progress", progress: todaysPerformance?.devScore || 0, color: "bg-red-500", icon: "💻" },
  ];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    setCurrentDate(newDate);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚡</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-2">
            <ExportModal>
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <Download className="w-4 h-4" />
              </Button>
            </ExportModal>
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-green-600">
                {user?.currentStreak || 0}🔥
              </span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">👤</span>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Streaks Section */}
        <section className="p-4">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm opacity-90">Current Streak</p>
                <p className="text-2xl font-bold">{user?.currentStreak || 0} days</p>
              </div>
              <div className="text-right">
                <p className="text-sm opacity-90">Best Streak</p>
                <p className="text-2xl font-bold">{user?.bestStreak || 0} days</p>
              </div>
            </div>
          </div>
        </section>

        {/* Today's Performance */}
        <section className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">Today's Performance</h2>
          <Card>
            <CardContent className="p-4">
              {performanceData.map((category, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm">{category.icon}</span>
                    </div>
                    <span className="font-medium text-gray-700">{category.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={category.progress} className="w-16" />
                    <span className="text-sm font-medium text-gray-600">{category.progress}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Monthly Calendar */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CalendarGrid currentDate={currentDate} />
        </section>

        {/* Weekly Summary */}
        <section className="p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">This Week</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Tasks Completed</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {tasks?.filter(t => t.completed).length || 0}
                </p>
                <p className="text-xs text-green-600">This week</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Flame className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-gray-700">Workout Days</span>
                </div>
                <p className="text-2xl font-bold text-gray-800">
                  {workoutLogs?.filter(w => w.completed).length || 0}/7
                </p>
                <p className="text-xs text-green-600">This week</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
