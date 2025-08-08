import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProgressCircle } from "@/components/progress-circle";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreVertical, Dumbbell } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
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
    queryFn: async () => {
      try {
        const response = await fetch(`/api/workout-logs?date=${today}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!user,
  });

  // Get today's workout type based on day of week
  const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
  const [selectedDay, setSelectedDay] = useState(dayOfWeek);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState<string | null>(null);
  
  // Group workout types by weekly plans
  const weeklyPlans = workoutTypes.filter(w => w.isWeekly);
  const dayWorkouts = ['Rest', 'Push', 'Pull', 'Legs', 'Core', 'Power', 'Stretch'];
  const todaysWorkout = workoutTypes.find(w => w.name.toLowerCase().includes(dayWorkouts[dayOfWeek].toLowerCase()));

  // Get exercises for selected workout type and day
  const activeWorkoutType = selectedWorkoutType ? workoutTypes.find(w => w.id === selectedWorkoutType) : todaysWorkout;
  const { data: exercises = [] } = useQuery<any[]>({
    queryKey: ['/api/exercises', activeWorkoutType?.id],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/exercises/${activeWorkoutType?.id}`);
        if (!response.ok) return [];
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch {
        return [];
      }
    },
    enabled: !!activeWorkoutType,
  });
  
  // Filter exercises for selected day (only matters in weekly plan view)
  const selectedDayExercises = selectedWorkoutType ? 
    exercises.filter(e => e.dayOfWeek === selectedDay) : exercises;

  // Count today's workout progress including both daily and weekly workouts for today
  const todaysExercises = exercises.filter(e => {
    // If we're in selectedWorkoutType mode, filter by selected day
    if (selectedWorkoutType) {
      return e.dayOfWeek === dayOfWeek;
    }
    // Otherwise, include all exercises that should run today (includes weekly workouts for today)
    return !e.dayOfWeek || e.dayOfWeek === dayOfWeek;
  });
  
  const todaysCompletedLogs = workoutLogs.filter(log => {
    const exercise = todaysExercises.find(e => e.id === log.exerciseId);
    return exercise && log.completed;
  });
  
  const workoutPercentage = todaysExercises.length > 0 ? 
    Math.round((todaysCompletedLogs.length / todaysExercises.length) * 100) : 0;

  // Prepare pie chart data for today's workout types
  const workoutTypeStats = todaysExercises.reduce((acc: any, exercise: any) => {
    const workoutType = workoutTypes.find(w => w.id === exercise.workoutTypeId);
    const typeName = workoutType?.name || 'Unknown';
    const isCompleted = workoutLogs.some(log => log.exerciseId === exercise.id && log.completed);
    
    if (!acc[typeName]) {
      acc[typeName] = { total: 0, completed: 0 };
    }
    acc[typeName].total += 1;
    if (isCompleted) acc[typeName].completed += 1;
    
    return acc;
  }, {});

  const pieChartData = Object.entries(workoutTypeStats).map(([name, stats]: [string, any]) => ({
    name,
    completed: stats.completed,
    remaining: stats.total - stats.completed,
    total: stats.total,
    percentage: Math.round((stats.completed / stats.total) * 100)
  }));

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16'];

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
      queryClient.invalidateQueries({ queryKey: ['/api/daily-performance'] });
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

      {/* Today's Workout Distribution Pie Chart - Only show in daily view, not weekly */}
      {!selectedWorkoutType && pieChartData.length > 0 && (
        <section className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Today's Workout Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="completed"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any, name: any, props: any) => [
                        `${value}/${props.payload.total} exercises`,
                        `${props.payload.name} (${props.payload.percentage}%)`
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {pieChartData.map((item, index) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">
                      {item.name}: {item.completed}/{item.total}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

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
                    {workoutPercentage === 100 ? "Today's workout complete!" : `${todaysCompletedLogs.length} of ${todaysExercises.length} exercises`}
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
          {selectedWorkoutType ? (
            // Weekly Plan View with Day Tabs
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedWorkoutType(null)}
                  className="text-blue-600"
                >
                  ← Back to Plans
                </Button>
                <h3 className="font-medium text-gray-800">
                  {workoutTypes.find(w => w.id === selectedWorkoutType)?.name}
                </h3>
              </div>
              
              {/* Day Tabs */}
              <Tabs value={selectedDay.toString()} onValueChange={(val) => setSelectedDay(parseInt(val))} className="w-full">
                <TabsList className="grid w-full grid-cols-7 text-xs">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                    <TabsTrigger key={index} value={index.toString()} className="p-1">
                      {day}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {[0,1,2,3,4,5,6].map(dayIndex => (
                  <TabsContent key={dayIndex} value={dayIndex.toString()} className="space-y-3 mt-4">
                    {selectedDayExercises.length === 0 ? (
                      <Card>
                        <CardContent className="p-6 text-center">
                          <p className="text-gray-500">
                            {dayIndex === 0 ? "Rest day! Take it easy and recover." : "No exercises for this day."}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      selectedDayExercises.map((exercise) => {
                        const existingLog = workoutLogs.find(log => log.exerciseId === exercise.id);
                        const isCompleted = existingLog?.completed || false;
                        
                        return (
                          <Card key={exercise.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={isCompleted}
                                  onCheckedChange={() => handleToggleExercise(exercise.id)}
                                  disabled={updateWorkoutLogMutation.isPending}
                                />
                                <div className="flex-1">
                                  <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                    {exercise.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {exercise.sets && exercise.reps 
                                      ? `${exercise.sets} sets × ${exercise.reps} reps`
                                      : exercise.duration || 'Complete'
                                    }
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          ) : (
            // Main Workout View
            <Tabs defaultValue="daily" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Today's Workout</TabsTrigger>
                <TabsTrigger value="weekly">Weekly Plans</TabsTrigger>
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
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => handleToggleExercise(exercise.id)}
                              disabled={updateWorkoutLogMutation.isPending}
                            />
                            <div className="flex-1">
                              <p className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                                {exercise.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {exercise.sets && exercise.reps 
                                  ? `${exercise.sets} sets × ${exercise.reps} reps`
                                  : exercise.duration || 'Complete'
                                }
                              </p>
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
                  {weeklyPlans.map((plan) => (
                    <Card key={plan.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-gray-800">{plan.name}</h3>
                            <p className="text-sm text-gray-600">7-day workout plan • {plan.maxTime} min max</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedWorkoutType(plan.id);
                              setSelectedDay(dayOfWeek);
                            }}
                          >
                            View Plan
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
    </div>
  );
}
