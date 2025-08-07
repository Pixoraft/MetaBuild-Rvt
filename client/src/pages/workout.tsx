import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCircle } from "@/components/progress-circle";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Dumbbell } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Workout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: workoutTypes = [] } = useQuery<any[]>({
    queryKey: ['/api/workout-types'],
    enabled: !!user,
  });

  const { data: workoutLogs = [] } = useQuery<any[]>({
    queryKey: ['/api/workout-logs', today],
    enabled: !!user,
  });

  // Get today's workout type (simplified - using day of week)
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todaysWorkout = workoutTypes.find(w => w.name.includes(['Push', 'Pull', 'Legs', 'Core', 'Power', 'Stretch', 'Rest'][dayOfWeek]));

  const { data: todaysExercises = [] } = useQuery<any[]>({
    queryKey: ['/api/exercises', todaysWorkout?.id],
    enabled: !!todaysWorkout,
  });

  const completedExercises = workoutLogs.filter(log => log.completed).length;
  const totalExercises = todaysExercises.length;
  const workoutPercentage = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;

  const updateWorkoutLogMutation = useMutation({
    mutationFn: async ({ exerciseId, completed }: { exerciseId: string; completed: boolean }) => {
      // Find existing log or create new one
      const existingLog = workoutLogs.find(log => log.exerciseId === exerciseId);
      
      if (existingLog) {
        const response = await apiRequest('PATCH', `/api/workout-logs/${existingLog.id}`, {
          completed,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      } else {
        const response = await apiRequest('POST', '/api/workout-logs', {
          exerciseId,
          completed,
          date: today,
          completedAt: completed ? new Date().toISOString() : null,
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/workout-logs'] });
      toast({ title: "Exercise updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating exercise", variant: "destructive" });
    },
  });

  const handleToggleExercise = (exerciseId: string) => {
    const existingLog = workoutLogs.find(log => log.exerciseId === exerciseId);
    const isCompleted = existingLog?.completed || false;
    updateWorkoutLogMutation.mutate({ exerciseId, completed: !isCompleted });
  };

  const getWorkoutDayName = () => {
    const dayNames = ['Rest Day', 'Push Day', 'Pull Day', 'Legs Day', 'Core Day', 'Power Day', 'Stretch Day'];
    return dayNames[dayOfWeek] || 'Workout Day';
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Workout</h1>
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
                <h2 className="text-lg font-semibold text-gray-800">Today's Workout</h2>
                <span className="text-sm text-gray-600">{getWorkoutDayName()}</span>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <ProgressCircle percentage={workoutPercentage} color="green" size={80} />
                <div>
                  <p className="text-sm text-gray-600">
                    {workoutPercentage === 100 ? "All exercises completed!" : `${completedExercises} of ${totalExercises} exercises`}
                  </p>
                  <p className="text-xs text-green-600">
                    {workoutPercentage === 100 ? "Great job!" : "Keep going!"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Workout Tabs */}
        <section className="p-4">
          <Tabs defaultValue="daily" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="daily">Daily Workout</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Plan</TabsTrigger>
            </TabsList>
            
            <TabsContent value="daily" className="space-y-3 mt-4">
              {todaysExercises.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">
                      {dayOfWeek === 0 ? "Rest day! Take it easy and recover." : "No workout plan found for today."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                todaysExercises.map((exercise) => {
                  const existingLog = workoutLogs.find(log => log.exerciseId === exercise.id);
                  const isCompleted = existingLog?.completed || false;
                  
                  return (
                    <Card key={exercise.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-800">{exercise.name}</h3>
                          <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {exercise.sets && exercise.reps 
                              ? `${exercise.sets} sets × ${exercise.reps} reps`
                              : exercise.duration || 'Complete'
                            }
                          </span>
                          <div className="flex items-center space-x-2">
                            {isCompleted ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                ✓ Complete
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleExercise(exercise.id)}
                                disabled={updateWorkoutLogMutation.isPending}
                              >
                                Mark Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>
            
            <TabsContent value="weekly" className="space-y-3 mt-4">
              <div className="grid gap-3">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                  const dayWorkout = ['Rest', 'Push', 'Pull', 'Legs', 'Core', 'Power', 'Stretch'][index];
                  const isToday = index === dayOfWeek;
                  
                  return (
                    <Card key={day} className={isToday ? 'ring-2 ring-green-500' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">{day}</h3>
                            <p className="text-sm text-gray-600">{dayWorkout} Day</p>
                          </div>
                          {isToday && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Today
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
}
