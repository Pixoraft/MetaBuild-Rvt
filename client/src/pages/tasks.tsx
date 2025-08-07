import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ProgressCircle } from "@/components/progress-circle";
import { AddTaskModal } from "@/components/add-task-modal";
import { MoreVertical, Plus, Droplet } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Tasks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ['/api/tasks', today],
    queryFn: () => fetch(`/api/tasks?date=${today}`).then(res => res.json()),
    enabled: !!user,
  });

  const { data: waterIntake } = useQuery<any>({
    queryKey: ['/api/water-intake', today],
    queryFn: () => fetch(`/api/water-intake?date=${today}`).then(res => res.json()),
    enabled: !!user,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, {
        completed,
        completedAt: completed ? new Date().toISOString() : null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      toast({ title: "Task updated successfully!" });
    },
    onError: (error) => {
      toast({ title: "Error updating task", variant: "destructive" });
    },
  });

  const updateWaterMutation = useMutation({
    mutationFn: async (amount: number) => {
      const response = await apiRequest('POST', '/api/water-intake', {
        amount,
        target: 3000,
        date: today,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/water-intake'] });
    },
    onError: (error) => {
      toast({ title: "Error updating water intake", variant: "destructive" });
    },
  });

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalTasks = tasks.length;
  const tasksPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const waterAmount = waterIntake?.amount || 0;
  const waterTarget = waterIntake?.target || 3000;
  const waterPercentage = Math.round((waterAmount / waterTarget) * 100);

  const handleToggleTask = (id: string, completed: boolean) => {
    updateTaskMutation.mutate({ id, completed });
  };

  const handleAddWater = () => {
    const newAmount = Math.min(waterAmount + 250, waterTarget);
    updateWaterMutation.mutate(newAmount);
  };

  return (
    <div className="pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-800">Daily Tasks</h1>
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
                <h2 className="text-lg font-semibold text-gray-800">Today's Progress</h2>
                <span className="text-sm text-gray-600">{format(new Date(), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Tasks Progress Circle */}
                <div className="flex flex-col items-center">
                  <ProgressCircle percentage={tasksPercentage} color="blue" size={80} />
                  <p className="text-xs text-gray-500 mt-1">Tasks</p>
                </div>
                
                {/* Water Intake Circle */}
                <div className="flex flex-col items-center">
                  <ProgressCircle percentage={waterPercentage} color="green" size={64} />
                  <p className="text-xs text-gray-500 mt-1">Water</p>
                </div>
                
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{completedTasks} of {totalTasks} tasks</p>
                  <p className="text-xs text-gray-500">{(waterAmount / 1000).toFixed(1)}L of {(waterTarget / 1000)}L water</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleAddWater}
                    disabled={updateWaterMutation.isPending}
                  >
                    <Droplet className="w-3 h-3 mr-1" />
                    +250ml
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Task List */}
        <section className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-md font-semibold text-gray-800">Today's Tasks</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="text-blue-500 font-medium"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Task
            </Button>
          </div>
          
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No tasks for today. Add one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={task.completed}
                        onCheckedChange={(checked) => handleToggleTask(task.id, !!checked)}
                        disabled={updateTaskMutation.isPending}
                      />
                      <div className="flex-1">
                        <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-700'}`}>
                          {task.title}
                        </p>
                        {task.completed && task.completedAt ? (
                          <p className="text-xs text-gray-500">
                            Completed at {format(new Date(task.completedAt), 'h:mm a')}
                          </p>
                        ) : task.dueTime ? (
                          <p className="text-xs text-gray-500">Due: {task.dueTime}</p>
                        ) : null}
                      </div>
                      <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 right-4 z-40">
        <Button
          size="lg"
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>

      <AddTaskModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
      />
    </div>
  );
}
