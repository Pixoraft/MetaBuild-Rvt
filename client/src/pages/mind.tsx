import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProgressCircle } from "@/components/progress-circle";
import { MoreVertical, Brain, Play } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Mind() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: mindExercises = [] } = useQuery<any[]>({
    queryKey: ['/api/mind-exercises'],
    enabled: !!user,
  });

  const { data: mindLogs = [] } = useQuery<any[]>({
    queryKey: ['/api/mind-exercise-logs', today],
    enabled: !!user,
  });

  const completedExercises = mindLogs.filter(log => log.completed).length;
  const totalExercises = mindExercises.length;
  const mindPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const updateMindLogMutation = useMutation({
    mutationFn: async ({ exerciseId, completed }: { exerciseId: string; completed: boolean }) => {
      const existingLog = mindLogs.find(log => log.mindExerciseId === exerciseId);
      
      if (existingLog) {
        const response = await apiRequest('PATCH', `/api/mind-exercise-logs/${existingLog.id}`, {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/mind-exercise-logs', {
          mindExerciseId: exerciseId,
          completed,
          date: today,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mind-exercise-logs'] });
      toast({ title: "Mind exercise updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating mind exercise", variant: "destructive" });
    },
  });

  const handleToggleExercise = (exerciseId: string) => {
    const existingLog = mindLogs.find(log => log.mindExerciseId === exerciseId);
    const isCompleted = existingLog?.completed || false;
    updateMindLogMutation.mutate({ exerciseId, completed: !isCompleted });
  };

  const getStatusBadge = (exercise: any) => {
    const existingLog = mindLogs.find(log => log.mindExerciseId === exercise.id);
    const isCompleted = existingLog?.completed || false;
    const currentTime = format(new Date(), 'HH:mm');
    const exerciseTime = exercise.time;
    
    if (isCompleted) {
      return <Badge variant="secondary" className="bg-green-100 text-green-700">✓ Done</Badge>;
    } else if (currentTime >= exerciseTime) {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-700">Ready</Badge>;
    } else {
      return <Badge variant="outline">Pending</Badge>;
    }
  };

  const sortedExercises = mindExercises.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Mind Workout</h1>
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
                <h2 className="text-lg font-semibold text-gray-800">Mind Workout</h2>
                <span className="text-sm text-gray-600">Today</span>
              </div>
              
              <div className="flex items-center space-x-4">
                <ProgressCircle percentage={mindPercentage} color="purple" size={80} />
                <div>
                  <p className="text-sm text-gray-600">{completedExercises} of {totalExercises} exercises</p>
                  <p className="text-xs text-gray-500">
                    {mindPercentage === 100 ? "All done! Great mental workout!" : "Keep going!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Mind Exercise Schedule */}
        <section className="p-4">
          <h3 className="text-md font-semibold text-gray-800 mb-4">Today's Schedule</h3>
          
          <div className="space-y-3">
            {sortedExercises.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No mind exercises scheduled for today.</p>
                </CardContent>
              </Card>
            ) : (
              sortedExercises.map((exercise) => {
                const existingLog = mindLogs.find(log => log.mindExerciseId === exercise.id);
                const isCompleted = existingLog?.completed || false;
                const currentTime = format(new Date(), 'HH:mm');
                const canStart = currentTime >= exercise.time;
                
                return (
                  <Card key={exercise.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-100' 
                            : canStart 
                              ? 'bg-purple-100' 
                              : 'bg-gray-100'
                        }`}>
                          <span className={`text-xs font-semibold ${
                            isCompleted 
                              ? 'text-green-600' 
                              : canStart 
                                ? 'text-purple-600' 
                                : 'text-gray-500'
                          }`}>
                            {exercise.time}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-700">{exercise.name}</p>
                          <p className="text-xs text-gray-500">
                            {exercise.duration ? `${exercise.duration} minutes` : '15 minutes'}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {isCompleted ? (
                            getStatusBadge(exercise)
                          ) : canStart ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleExercise(exercise.id)}
                              disabled={updateMindLogMutation.isPending}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          ) : (
                            getStatusBadge(exercise)
                          )}
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
