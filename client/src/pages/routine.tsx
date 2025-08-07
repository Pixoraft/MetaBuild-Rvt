import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCircle } from "@/components/progress-circle";
import { MoreVertical, Moon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

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
    enabled: !!user,
  });

  const morningRoutines = routines.filter(r => r.type === 'morning');
  const nightRoutines = routines.filter(r => r.type === 'night');
  const weeklyRoutines = routines.filter(r => r.type === 'weekly');

  const completedRoutines = routineLogs.filter(log => log.completed).length;
  const totalRoutines = routines.length;
  const routinePercentage = totalRoutines > 0 ? Math.round((completedRoutines / totalRoutines) * 100) : 0;

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
      toast({ title: "Routine updated successfully!" });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
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
            <div className="bg-green-100 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-green-600">
                {user?.currentStreak || 0}🔥
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 rounded-full p-0"
              onClick={() => window.location.href = "/api/logout"}
            >
              👤
            </Button>
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
                    {routinePercentage === 100 ? "Almost done!" : `${completedRoutines} of ${totalRoutines} tasks completed`}
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
              <RoutineList routines={weeklyRoutines} title="Weekly Routine" />
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
