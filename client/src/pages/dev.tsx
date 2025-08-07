import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Code, Clock, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dev() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: devGoals = [] } = useQuery<any[]>({
    queryKey: ['/api/dev-goals'],
    enabled: !!user,
  });

  const { data: devLogs = [] } = useQuery<any[]>({
    queryKey: ['/api/dev-goal-logs', today],
    enabled: !!user,
  });

  const dailyGoals = devGoals.filter(g => g.type === 'daily');
  const weeklyGoals = devGoals.filter(g => g.type === 'weekly');
  const monthlyGoals = devGoals.filter(g => g.type === 'monthly');
  const yearlyGoals = devGoals.filter(g => g.type === 'yearly');

  const updateDevLogMutation = useMutation({
    mutationFn: async ({ goalId, completed, hoursSpent }: { goalId: string; completed: boolean; hoursSpent?: number }) => {
      const existingLog = devLogs.find(log => log.devGoalId === goalId);
      
      if (existingLog) {
        const response = await apiRequest('PATCH', `/api/dev-goal-logs/${existingLog.id}`, {
          completed,
          hoursSpent: hoursSpent !== undefined ? hoursSpent : existingLog.hoursSpent,
        });
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/dev-goal-logs', {
          devGoalId: goalId,
          completed,
          date: today,
          hoursSpent: hoursSpent || 0,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dev-goal-logs'] });
      toast({ title: "Dev goal updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating dev goal", variant: "destructive" });
    },
  });

  const handleToggleGoal = (goalId: string) => {
    const existingLog = devLogs.find(log => log.devGoalId === goalId);
    const isCompleted = existingLog?.completed || false;
    updateDevLogMutation.mutate({ goalId, completed: !isCompleted });
  };

  const getProgressForGoal = (goal: any) => {
    const log = devLogs.find(log => log.devGoalId === goal.id);
    if (goal.targetHours && log?.hoursSpent) {
      return Math.min(Math.round((log.hoursSpent / goal.targetHours) * 100), 100);
    }
    return goal.completed ? 100 : 0;
  };

  const getStatusBadge = (goal: any) => {
    const log = devLogs.find(log => log.devGoalId === goal.id);
    const isCompleted = log?.completed || false;
    const progress = getProgressForGoal(goal);
    
    if (isCompleted || progress === 100) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">Done</Badge>;
    } else if (progress > 0) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700">In Progress</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <Code className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Dev Progress</h1>
          </div>
          <div className="flex items-center space-x-2">
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
                <h2 className="text-lg font-semibold text-gray-800">Development Goals</h2>
                <span className="text-sm text-gray-600">2025</span>
              </div>
              
              <div className="space-y-3">
                {/* Yearly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">2025 Full Stack Goal</span>
                    <span className="text-xs text-gray-600">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
                
                {/* Monthly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">January Milestones</span>
                    <span className="text-xs text-gray-600">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                
                {/* Weekly Progress */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">This Week</span>
                    <span className="text-xs text-gray-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Weekly Checklist */}
        <section className="p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-4">This Week's Goals</h3>
          
          <div className="space-y-3 mb-6">
            {weeklyGoals.map((goal) => {
              const log = devLogs.find(log => log.devGoalId === goal.id);
              const isCompleted = log?.completed || false;
              const progress = getProgressForGoal(goal);
              
              return (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => handleToggleGoal(goal.id)}
                        disabled={updateDevLogMutation.isPending}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {goal.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {goal.targetHours 
                            ? `${log?.hoursSpent || 0}h / ${goal.targetHours}h target`
                            : goal.description
                          }
                        </p>
                      </div>
                      {getStatusBadge(goal)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Daily Dev Routine */}
        <section className="p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-4">Today's Dev Tasks</h3>
          
          <div className="space-y-3">
            {dailyGoals.map((goal) => {
              const log = devLogs.find(log => log.devGoalId === goal.id);
              const isCompleted = log?.completed || false;
              
              return (
                <Card key={goal.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={(checked) => handleToggleGoal(goal.id)}
                        disabled={updateDevLogMutation.isPending}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {goal.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isCompleted && log?.hoursSpent 
                            ? `Completed: ${log.hoursSpent}h`
                            : goal.description || 'Daily practice'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
