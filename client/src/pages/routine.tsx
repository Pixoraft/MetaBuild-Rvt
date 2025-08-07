import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCircle } from "@/components/progress-circle";
import { ExportModal } from "@/components/export-modal";
import { MoreVertical, Moon, Download } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Routine() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: routines = [] } = useQuery<any[]>({
    queryKey: ['/api/routines'],
    enabled: !!user,
  });

  const { data: routineLogs = [] } = useQuery<any[]>({
    queryKey: ['/api/routine-logs', today],
    queryFn: () => fetch(`/api/routine-logs?date=${today}`).then(res => res.json()),
    enabled: !!user,
  });

  const morningRoutines = routines.filter(r => r.type === 'morning');
  const nightRoutines = routines.filter(r => r.type === 'night');
  // For weekly routines, show only today's relevant ones based on day of week
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const weeklyRoutines = routines.filter(r => r.type === 'weekly');
  const todaysWeeklyRoutines = weeklyRoutines.filter(r => {
    // If routine has a specific day assignment, check it matches today
    if (r.dayOfWeek !== undefined && r.dayOfWeek !== null) {
      return r.dayOfWeek === dayOfWeek;
    }
    // Otherwise show all weekly routines for flexibility
    return true;
  });

  // Calculate progress for all routine types
  const completedMorning = routineLogs.filter(log => {
    const routine = routines.find(r => r.id === log.routineId);
    return routine && routine.type === 'morning' && log.completed;
  }).length;
  
  const completedNight = routineLogs.filter(log => {
    const routine = routines.find(r => r.id === log.routineId);
    return routine && routine.type === 'night' && log.completed;
  }).length;
  
  const completedWeekly = routineLogs.filter(log => {
    const routine = routines.find(r => r.id === log.routineId);
    return routine && routine.type === 'weekly' && log.completed;
  }).length;
  
  const totalDaily = morningRoutines.length + nightRoutines.length + todaysWeeklyRoutines.length;
  const completedDaily = completedMorning + completedNight + completedWeekly;
  const routinePercentage = totalDaily > 0 ? Math.round((completedDaily / totalDaily) * 100) : 0;

  const updateRoutineLogMutation = useMutation({
    mutationFn: async ({ routineId, completed }: { routineId: string; completed: boolean }) => {
      const existingLog = routineLogs.find(log => log.routineId === routineId);
      
      if (existingLog) {
        const response = await apiRequest('PATCH', `/api/routine-logs/${existingLog.id}`, {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/routine-logs', {
          routineId,
          completed,
          date: today,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routine-logs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/daily-performance'] });
      toast({ title: "Routine updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating routine", variant: "destructive" });
    },
  });

  const handleToggleRoutine = (routineId: string) => {
    const existingLog = routineLogs.find(log => log.routineId === routineId);
    const isCompleted = existingLog?.completed || false;
    updateRoutineLogMutation.mutate({ routineId, completed: !isCompleted });
  };

  const RoutineList = ({ routines: routineList, title }: { routines: any[]; title: string }) => (
    <div className="space-y-3">
      <h3 className="text-md font-semibold text-gray-800">{title}</h3>
      {routineList.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">No {title.toLowerCase()} routines found.</p>
          </CardContent>
        </Card>
      ) : (
        routineList.map((routine) => {
          const existingLog = routineLogs.find(log => log.routineId === routine.id);
          const isCompleted = existingLog?.completed || false;
          
          return (
            <Card key={routine.id}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={isCompleted}
                    onCheckedChange={(checked) => handleToggleRoutine(routine.id)}
                    disabled={updateRoutineLogMutation.isPending}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                      {routine.name}
                    </p>
                    {routine.description && (
                      <p className="text-xs text-gray-500">{routine.description}</p>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Moon className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Daily Routine</h1>
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
        {/* Progress Overview */}
        <section className="p-4">
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">Daily Routine</h2>
                <span className="text-sm text-gray-600">Today</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <ProgressCircle percentage={routinePercentage} color="orange" size={80} />
                <div>
                  <p className="text-sm text-gray-600">
                    {routinePercentage === 100 ? "All routines completed!" : `${completedDaily} of ${totalDaily} tasks completed`}
                  </p>
                  <p className="text-xs text-gray-500">
                    {routinePercentage >= 90 ? "Excellent progress!" : "Keep going!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Routine Tabs */}
        <section className="p-4">
          <Tabs defaultValue="morning" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="morning">Morning</TabsTrigger>
              <TabsTrigger value="night">Night</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
            </TabsList>
            
            <TabsContent value="morning" className="mt-4">
              <RoutineList routines={morningRoutines} title="Morning Routine" />
            </TabsContent>
            
            <TabsContent value="night" className="mt-4">
              <RoutineList routines={nightRoutines} title="Night Routine" />
            </TabsContent>
            
            <TabsContent value="weekly" className="mt-4">
              <RoutineList routines={todaysWeeklyRoutines} title="Today's Weekly Tasks" />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
