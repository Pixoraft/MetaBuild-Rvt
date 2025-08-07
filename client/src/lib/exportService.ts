import { format } from 'date-fns';

export interface ExportData {
  date: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    currentStreak: number;
    bestStreak: number;
  };
  tasks: Array<{
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string;
    dueTime?: string;
  }>;
  workouts: Array<{
    exerciseName: string;
    completed: boolean;
    completedAt?: string;
    workoutType: string;
  }>;
  mindExercises: Array<{
    name: string;
    time: string;
    duration: number;
    completed: boolean;
    completedAt?: string;
  }>;
  routines: Array<{
    name: string;
    type: string;
    description?: string;
    completed: boolean;
    completedAt?: string;
  }>;
  devGoals: Array<{
    title: string;
    type: string;
    description?: string;
    targetHours?: number;
    hoursSpent: number;
    completed: boolean;
  }>;
  waterIntake: {
    amount: number;
    target: number;
  };
  performance: {
    tasksScore: number;
    workoutScore: number;
    mindScore: number;
    routineScore: number;
    devScore: number;
    overallScore: number;
  };
}

export async function fetchDayData(date: string): Promise<ExportData> {
  const [
    userResponse,
    tasksResponse,
    workoutLogsResponse,
    workoutTypesResponse,
    exercisesResponse,
    mindExercisesResponse,
    mindExerciseLogsResponse,
    routinesResponse,
    routineLogsResponse,
    devGoalsResponse,
    devGoalLogsResponse,
    waterIntakeResponse,
    performanceResponse
  ] = await Promise.all([
    fetch('/api/auth/user'),
    fetch(`/api/tasks?date=${date}`),
    fetch(`/api/workout-logs?date=${date}`),
    fetch('/api/workout-types'),
    fetch('/api/exercises/all'),
    fetch('/api/mind-exercises'),
    fetch(`/api/mind-exercise-logs?date=${date}`),
    fetch('/api/routines'),
    fetch(`/api/routine-logs?date=${date}`),
    fetch('/api/dev-goals'),
    fetch(`/api/dev-goal-logs?date=${date}`),
    fetch(`/api/water-intake?date=${date}`),
    fetch(`/api/daily-performance?date=${date}`)
  ]);

  const [
    user,
    tasks,
    workoutLogs,
    workoutTypes,
    exercises,
    mindExercises,
    mindExerciseLogs,
    routines,
    routineLogs,
    devGoals,
    devGoalLogs,
    waterIntake,
    performance
  ] = await Promise.all([
    userResponse.ok ? userResponse.json() : null,
    tasksResponse.ok ? tasksResponse.json() : [],
    workoutLogsResponse.ok ? workoutLogsResponse.json() : [],
    workoutTypesResponse.ok ? workoutTypesResponse.json() : [],
    exercisesResponse.ok ? exercisesResponse.json() : [],
    mindExercisesResponse.ok ? mindExercisesResponse.json() : [],
    mindExerciseLogsResponse.ok ? mindExerciseLogsResponse.json() : [],
    routinesResponse.ok ? routinesResponse.json() : [],
    routineLogsResponse.ok ? routineLogsResponse.json() : [],
    devGoalsResponse.ok ? devGoalsResponse.json() : [],
    devGoalLogsResponse.ok ? devGoalLogsResponse.json() : [],
    waterIntakeResponse.ok ? waterIntakeResponse.json() : { amount: 0, target: 3000 },
    performanceResponse.ok ? performanceResponse.json() : { tasksScore: 0, workoutScore: 0, mindScore: 0, routineScore: 0, devScore: 0, overallScore: 0 }
  ]);

  // Process workout data - Handle empty arrays safely
  const processedWorkouts = (workoutLogs || []).map((log: any) => {
    // Find the exercise details
    const exercise = (exercises || []).find((ex: any) => ex.id === log.exerciseId);
    
    return {
      exerciseName: exercise?.name || 'Unknown Exercise',
      completed: log.completed,
      completedAt: log.completedAt,
      workoutType: exercise?.workoutTypeName || 'Unknown Type'
    };
  });

  // Process mind exercise data - Handle empty arrays safely
  const processedMindExercises = (mindExercises || []).map((exercise: any) => {
    const log = (mindExerciseLogs || []).find((log: any) => log.mindExerciseId === exercise.id);
    return {
      name: exercise.name,
      time: exercise.time,
      duration: exercise.duration,
      completed: log?.completed || false,
      completedAt: log?.completedAt
    };
  });

  // Process routine data - Handle empty arrays safely
  const processedRoutines = (routines || []).map((routine: any) => {
    const log = (routineLogs || []).find((log: any) => log.routineId === routine.id);
    return {
      name: routine.name,
      type: routine.type,
      description: routine.description,
      completed: log?.completed || false,
      completedAt: log?.completedAt
    };
  });

  // Process dev goal data - Handle empty arrays safely
  const processedDevGoals = (devGoals || []).map((goal: any) => {
    const log = (devGoalLogs || []).find((log: any) => log.devGoalId === goal.id);
    return {
      title: goal.title,
      type: goal.type,
      description: goal.description,
      targetHours: goal.targetHours,
      hoursSpent: log?.hoursSpent || 0,
      completed: log?.completed || false
    };
  });

  return {
    date,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      currentStreak: user.currentStreak,
      bestStreak: user.bestStreak
    },
    tasks: (tasks || []).map((task: any) => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      completedAt: task.completedAt,
      dueTime: task.dueTime
    })),
    workouts: processedWorkouts,
    mindExercises: processedMindExercises,
    routines: processedRoutines,
    devGoals: processedDevGoals,
    waterIntake: {
      amount: waterIntake?.amount || 0,
      target: waterIntake?.target || 3000
    },
    performance: {
      tasksScore: performance?.tasksScore || 0,
      workoutScore: performance?.workoutScore || 0,
      mindScore: performance?.mindScore || 0,
      routineScore: performance?.routineScore || 0,
      devScore: performance?.devScore || 0,
      overallScore: performance?.overallScore || 0
    }
  };
}

export function exportToJSON(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivity-data-${data.date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: ExportData): void {
  const csvLines: string[] = [];
  
  // Header information
  csvLines.push('Meta Build - Productivity Data Export');
  csvLines.push(`Date: ${data.date}`);
  csvLines.push(`User: ${data.user.firstName} ${data.user.lastName} (${data.user.email})`);
  csvLines.push(`Current Streak: ${data.user.currentStreak} days`);
  csvLines.push(`Best Streak: ${data.user.bestStreak} days`);
  csvLines.push('');

  // Performance Overview
  csvLines.push('PERFORMANCE OVERVIEW');
  csvLines.push('Category,Score');
  csvLines.push(`Tasks,${data.performance.tasksScore}%`);
  csvLines.push(`Workouts,${data.performance.workoutScore}%`);
  csvLines.push(`Mind Exercises,${data.performance.mindScore}%`);
  csvLines.push(`Routines,${data.performance.routineScore}%`);
  csvLines.push(`Development,${data.performance.devScore}%`);
  csvLines.push(`Overall,${data.performance.overallScore}%`);
  csvLines.push('');

  // Water Intake
  csvLines.push('WATER INTAKE');
  csvLines.push('Consumed,Target,Progress');
  csvLines.push(`${data.waterIntake.amount}ml,${data.waterIntake.target}ml,${Math.round((data.waterIntake.amount / data.waterIntake.target) * 100)}%`);
  csvLines.push('');

  // Tasks
  csvLines.push('DAILY TASKS');
  csvLines.push('Task,Status,Completed At,Due Time');
  data.tasks.forEach(task => {
    csvLines.push(`"${task.title}",${task.completed ? 'Completed' : 'Pending'},"${task.completedAt || ''}","${task.dueTime || ''}"`);
  });
  csvLines.push('');

  // Workouts
  csvLines.push('WORKOUTS');
  csvLines.push('Exercise,Type,Status,Completed At');
  data.workouts.forEach(workout => {
    csvLines.push(`"${workout.exerciseName}","${workout.workoutType}",${workout.completed ? 'Completed' : 'Pending'},"${workout.completedAt || ''}"`);
  });
  csvLines.push('');

  // Mind Exercises
  csvLines.push('MIND EXERCISES');
  csvLines.push('Exercise,Time,Duration (min),Status,Completed At');
  data.mindExercises.forEach(exercise => {
    csvLines.push(`"${exercise.name}","${exercise.time}",${exercise.duration},${exercise.completed ? 'Completed' : 'Pending'},"${exercise.completedAt || ''}"`);
  });
  csvLines.push('');

  // Routines
  csvLines.push('ROUTINES');
  csvLines.push('Routine,Type,Description,Status,Completed At');
  data.routines.forEach(routine => {
    csvLines.push(`"${routine.name}","${routine.type}","${routine.description || ''}",${routine.completed ? 'Completed' : 'Pending'},"${routine.completedAt || ''}"`);
  });
  csvLines.push('');

  // Dev Goals
  csvLines.push('DEVELOPMENT GOALS');
  csvLines.push('Goal,Type,Target Hours,Hours Spent,Status,Description');
  data.devGoals.forEach(goal => {
    csvLines.push(`"${goal.title}","${goal.type}",${goal.targetHours || ''},${goal.hoursSpent},${goal.completed ? 'Completed' : 'In Progress'},"${goal.description || ''}"`);
  });

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivity-data-${data.date}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToText(data: ExportData): void {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════');
  lines.push('          META BUILD - DAILY REPORT          ');
  lines.push('═══════════════════════════════════════════');
  lines.push('');
  lines.push(`📅 Date: ${format(new Date(data.date), 'EEEE, MMMM do, yyyy')}`);
  lines.push(`👤 User: ${data.user.firstName} ${data.user.lastName}`);
  lines.push(`📧 Email: ${data.user.email}`);
  lines.push(`🔥 Current Streak: ${data.user.currentStreak} days`);
  lines.push(`🏆 Best Streak: ${data.user.bestStreak} days`);
  lines.push('');

  // Performance Summary
  lines.push('📊 PERFORMANCE OVERVIEW');
  lines.push('───────────────────────');
  lines.push(`📋 Tasks: ${data.performance.tasksScore}%`);
  lines.push(`💪 Workouts: ${data.performance.workoutScore}%`);
  lines.push(`🧠 Mind Exercises: ${data.performance.mindScore}%`);
  lines.push(`🌅 Routines: ${data.performance.routineScore}%`);
  lines.push(`💻 Development: ${data.performance.devScore}%`);
  lines.push(`⭐ Overall Score: ${data.performance.overallScore}%`);
  lines.push('');

  // Water Intake
  lines.push('💧 WATER INTAKE');
  lines.push('──────────────');
  const waterProgress = Math.round((data.waterIntake.amount / data.waterIntake.target) * 100);
  lines.push(`${data.waterIntake.amount}ml / ${data.waterIntake.target}ml (${waterProgress}%)`);
  lines.push('');

  // Tasks
  lines.push('📋 DAILY TASKS');
  lines.push('─────────────');
  if (data.tasks.length === 0) {
    lines.push('No tasks for this day');
  } else {
    data.tasks.forEach(task => {
      const status = task.completed ? '✅' : '⏳';
      const timeInfo = task.dueTime ? ` (Due: ${task.dueTime})` : '';
      const completedInfo = task.completed && task.completedAt ? ` - Completed at ${format(new Date(task.completedAt), 'HH:mm')}` : '';
      lines.push(`${status} ${task.title}${timeInfo}${completedInfo}`);
    });
  }
  lines.push('');

  // Workouts
  lines.push('💪 WORKOUTS');
  lines.push('──────────');
  if (data.workouts.length === 0) {
    lines.push('No workouts for this day');
  } else {
    data.workouts.forEach(workout => {
      const status = workout.completed ? '✅' : '⏳';
      const completedInfo = workout.completed && workout.completedAt ? ` - Completed at ${format(new Date(workout.completedAt), 'HH:mm')}` : '';
      lines.push(`${status} ${workout.exerciseName} (${workout.workoutType})${completedInfo}`);
    });
  }
  lines.push('');

  // Mind Exercises
  lines.push('🧠 MIND EXERCISES');
  lines.push('────────────────');
  if (data.mindExercises.length === 0) {
    lines.push('No mind exercises for this day');
  } else {
    data.mindExercises.forEach(exercise => {
      const status = exercise.completed ? '✅' : '⏳';
      const completedInfo = exercise.completed && exercise.completedAt ? ` - Completed at ${format(new Date(exercise.completedAt), 'HH:mm')}` : '';
      lines.push(`${status} ${exercise.name} (${exercise.time}, ${exercise.duration} min)${completedInfo}`);
    });
  }
  lines.push('');

  // Routines
  lines.push('🌅 ROUTINES');
  lines.push('──────────');
  if (data.routines.length === 0) {
    lines.push('No routines for this day');
  } else {
    const groupedRoutines = data.routines.reduce((acc, routine) => {
      if (!acc[routine.type]) acc[routine.type] = [];
      acc[routine.type].push(routine);
      return acc;
    }, {} as Record<string, typeof data.routines>);

    Object.entries(groupedRoutines).forEach(([type, routines]) => {
      lines.push(`  ${type.toUpperCase()}:`);
      routines.forEach(routine => {
        const status = routine.completed ? '✅' : '⏳';
        const completedInfo = routine.completed && routine.completedAt ? ` - Completed at ${format(new Date(routine.completedAt), 'HH:mm')}` : '';
        lines.push(`    ${status} ${routine.name}${completedInfo}`);
      });
    });
  }
  lines.push('');

  // Development Goals
  lines.push('💻 DEVELOPMENT GOALS');
  lines.push('───────────────────');
  if (data.devGoals.length === 0) {
    lines.push('No development goals for this day');
  } else {
    const groupedGoals = data.devGoals.reduce((acc, goal) => {
      if (!acc[goal.type]) acc[goal.type] = [];
      acc[goal.type].push(goal);
      return acc;
    }, {} as Record<string, typeof data.devGoals>);

    Object.entries(groupedGoals).forEach(([type, goals]) => {
      lines.push(`  ${type.toUpperCase()}:`);
      goals.forEach(goal => {
        const status = goal.completed ? '✅' : '📝';
        const hoursInfo = goal.targetHours ? ` (${goal.hoursSpent}h / ${goal.targetHours}h)` : goal.hoursSpent > 0 ? ` (${goal.hoursSpent}h)` : '';
        lines.push(`    ${status} ${goal.title}${hoursInfo}`);
      });
    });
  }
  lines.push('');
  lines.push('═══════════════════════════════════════════');
  lines.push(`Generated on ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`);
  lines.push('═══════════════════════════════════════════');

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `productivity-report-${data.date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function exportMultipleDays(startDate: string, endDate: string, format: 'json' | 'csv' | 'txt'): Promise<void> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const allData: ExportData[] = [];
  
  // Fetch data for each day
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    try {
      const dayData = await fetchDayData(dateStr);
      allData.push(dayData);
    } catch (error) {
      console.error(`Failed to fetch data for ${dateStr}:`, error);
    }
  }

  if (format === 'json') {
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-data-${startDate}-to-${endDate}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // For CSV and TXT, combine all days into a single file
    const combinedData = allData.map(data => {
      if (format === 'csv') {
        return `DATE: ${data.date}\n` + 
               `OVERALL SCORE: ${data.performance.overallScore}%\n` +
               `TASKS: ${data.tasks.filter(t => t.completed).length}/${data.tasks.length}\n` +
               `WORKOUTS: ${data.workouts.filter(w => w.completed).length}/${data.workouts.length}\n` +
               `MIND: ${data.mindExercises.filter(m => m.completed).length}/${data.mindExercises.length}\n` +
               `ROUTINES: ${data.routines.filter(r => r.completed).length}/${data.routines.length}\n` +
               `DEV GOALS: ${data.devGoals.filter(d => d.completed).length}/${data.devGoals.length}\n`;
      } else {
        return `${data.date}: Overall ${data.performance.overallScore}% | Tasks ${data.tasks.filter(t => t.completed).length}/${data.tasks.length} | Workouts ${data.workouts.filter(w => w.completed).length}/${data.workouts.length}`;
      }
    }).join('\n\n');

    const blob = new Blob([combinedData], { type: format === 'csv' ? 'text/csv' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-summary-${startDate}-to-${endDate}.${format === 'csv' ? 'csv' : 'txt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}