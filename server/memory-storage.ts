import {
  type User,
  type UpsertUser,
  type InsertTask,
  type Task,
  type InsertWorkoutType,
  type WorkoutType,
  type InsertExercise,
  type Exercise,
  type InsertWorkoutLog,
  type WorkoutLog,
  type InsertMindExercise,
  type MindExercise,
  type InsertMindExerciseLog,
  type MindExerciseLog,
  type InsertRoutine,
  type Routine,
  type InsertRoutineLog,
  type RoutineLog,
  type InsertDevGoal,
  type DevGoal,
  type InsertDevGoalLog,
  type DevGoalLog,
  type InsertWaterIntake,
  type WaterIntake,
  type InsertDailyPerformance,
  type DailyPerformance,
} from "@shared/schema";
import { IStorage } from "./storage";

// Generate unique IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private tasks: Map<string, Task> = new Map();
  private workoutTypes: Map<string, WorkoutType> = new Map();
  private exercises: Map<string, Exercise> = new Map();
  private workoutLogs: Map<string, WorkoutLog> = new Map();
  private mindExercises: Map<string, MindExercise> = new Map();
  private mindExerciseLogs: Map<string, MindExerciseLog> = new Map();
  private routines: Map<string, Routine> = new Map();
  private routineLogs: Map<string, RoutineLog> = new Map();
  private devGoals: Map<string, DevGoal> = new Map();
  private devGoalLogs: Map<string, DevGoalLog> = new Map();
  private waterIntake: Map<string, WaterIntake> = new Map();
  private dailyPerformance: Map<string, DailyPerformance> = new Map();

  // Clear all performance data to force recalculation with new logic
  clearPerformanceData() {
    this.dailyPerformance.clear();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const now = new Date();
    const existingUser = this.users.get(userData.id || '');
    const user: User = {
      id: userData.id || generateId(),
      email: userData.email || null,
      firstName: userData.firstName || null,
      lastName: userData.lastName || null,
      profileImageUrl: userData.profileImageUrl || null,
      currentStreak: userData.currentStreak !== undefined ? userData.currentStreak : (existingUser?.currentStreak || 0),
      bestStreak: userData.bestStreak !== undefined ? userData.bestStreak : (existingUser?.bestStreak || 0),
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    return user;
  }

  // Task operations
  async getTasks(userId: string, date: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.userId === userId && task.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createTask(taskData: InsertTask): Promise<Task> {
    const task: Task = {
      id: generateId(),
      userId: taskData.userId,
      title: taskData.title,
      completed: taskData.completed ?? false,
      completedAt: taskData.completedAt ?? null,
      dueTime: taskData.dueTime ?? null,
      date: taskData.date,
      createdAt: new Date(),
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Workout operations
  async getWorkoutTypes(userId: string): Promise<WorkoutType[]> {
    return Array.from(this.workoutTypes.values())
      .filter(type => type.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createWorkoutType(workoutType: InsertWorkoutType): Promise<WorkoutType> {
    const type: WorkoutType = {
      id: generateId(),
      userId: workoutType.userId,
      name: workoutType.name,
      isWeekly: workoutType.isWeekly ?? true,
      maxTime: workoutType.maxTime ?? null,
      createdAt: new Date(),
    };
    this.workoutTypes.set(type.id, type);
    return type;
  }

  async getExercises(workoutTypeId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutTypeId === workoutTypeId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const newExercise: Exercise = {
      id: generateId(),
      workoutTypeId: exercise.workoutTypeId,
      name: exercise.name,
      sets: exercise.sets ?? null,
      reps: exercise.reps ?? null,
      duration: exercise.duration ?? null,
      dayOfWeek: exercise.dayOfWeek ?? null,
      orderIndex: exercise.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.exercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  async getWorkoutLogs(userId: string, date: string): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const newLog: WorkoutLog = {
      id: generateId(),
      userId: log.userId,
      exerciseId: log.exerciseId,
      completed: log.completed ?? false,
      date: log.date,
      completedAt: log.completedAt ?? null,
      createdAt: new Date(),
    };
    this.workoutLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const log = this.workoutLogs.get(id);
    if (!log) return undefined;

    const updatedLog = { ...log, ...updates };
    this.workoutLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Mind exercise operations
  async getMindExercises(userId: string): Promise<MindExercise[]> {
    return Array.from(this.mindExercises.values())
      .filter(exercise => exercise.userId === userId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async createMindExercise(exercise: InsertMindExercise): Promise<MindExercise> {
    const newExercise: MindExercise = {
      id: generateId(),
      userId: exercise.userId,
      name: exercise.name,
      time: exercise.time,
      duration: exercise.duration ?? null,
      orderIndex: exercise.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.mindExercises.set(newExercise.id, newExercise);
    return newExercise;
  }

  async getMindExerciseLogs(userId: string, date: string): Promise<MindExerciseLog[]> {
    return Array.from(this.mindExerciseLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createMindExerciseLog(log: InsertMindExerciseLog): Promise<MindExerciseLog> {
    const newLog: MindExerciseLog = {
      id: generateId(),
      userId: log.userId,
      mindExerciseId: log.mindExerciseId,
      completed: log.completed ?? false,
      date: log.date,
      completedAt: log.completedAt ?? null,
      createdAt: new Date(),
    };
    this.mindExerciseLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateMindExerciseLog(id: string, updates: Partial<InsertMindExerciseLog>): Promise<MindExerciseLog | undefined> {
    const log = this.mindExerciseLogs.get(id);
    if (!log) return undefined;

    const updatedLog = { ...log, ...updates };
    this.mindExerciseLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Routine operations
  async getRoutines(userId: string): Promise<Routine[]> {
    return Array.from(this.routines.values())
      .filter(routine => routine.userId === userId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const newRoutine: Routine = {
      id: generateId(),
      userId: routine.userId,
      name: routine.name,
      description: routine.description ?? null,
      type: routine.type,
      dayOfWeek: routine.dayOfWeek ?? null,
      orderIndex: routine.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.routines.set(newRoutine.id, newRoutine);
    return newRoutine;
  }

  async getRoutineLogs(userId: string, date: string): Promise<RoutineLog[]> {
    return Array.from(this.routineLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createRoutineLog(log: InsertRoutineLog): Promise<RoutineLog> {
    const newLog: RoutineLog = {
      id: generateId(),
      userId: log.userId,
      routineId: log.routineId,
      completed: log.completed ?? false,
      date: log.date,
      completedAt: log.completedAt ?? null,
      createdAt: new Date(),
    };
    this.routineLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateRoutineLog(id: string, updates: Partial<InsertRoutineLog>): Promise<RoutineLog | undefined> {
    const log = this.routineLogs.get(id);
    if (!log) return undefined;

    const updatedLog = { ...log, ...updates };
    this.routineLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Dev goal operations
  async getDevGoals(userId: string): Promise<DevGoal[]> {
    return Array.from(this.devGoals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async createDevGoal(goal: InsertDevGoal): Promise<DevGoal> {
    const newGoal: DevGoal = {
      id: generateId(),
      userId: goal.userId,
      title: goal.title,
      description: goal.description ?? null,
      type: goal.type,
      targetHours: goal.targetHours ?? null,
      currentHours: goal.currentHours ?? 0,
      completed: goal.completed ?? false,
      orderIndex: goal.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.devGoals.set(newGoal.id, newGoal);
    return newGoal;
  }

  async getDevGoalLogs(userId: string, date: string): Promise<DevGoalLog[]> {
    return Array.from(this.devGoalLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDevGoalLog(log: InsertDevGoalLog): Promise<DevGoalLog> {
    const newLog: DevGoalLog = {
      id: generateId(),
      userId: log.userId,
      devGoalId: log.devGoalId,
      hoursSpent: log.hoursSpent ?? 0,
      completed: log.completed ?? false,
      date: log.date,
      createdAt: new Date(),
    };
    this.devGoalLogs.set(newLog.id, newLog);
    return newLog;
  }

  async updateDevGoalLog(id: string, updates: Partial<InsertDevGoalLog>): Promise<DevGoalLog | undefined> {
    const log = this.devGoalLogs.get(id);
    if (!log) return undefined;

    const updatedLog = { ...log, ...updates };
    this.devGoalLogs.set(id, updatedLog);
    return updatedLog;
  }

  // Water intake operations
  async getWaterIntake(userId: string, date: string): Promise<WaterIntake | undefined> {
    const key = `${userId}-${date}`;
    return Array.from(this.waterIntake.values())
      .find(intake => intake.userId === userId && intake.date === date);
  }

  async upsertWaterIntake(intake: InsertWaterIntake): Promise<WaterIntake> {
    const existing = await this.getWaterIntake(intake.userId, intake.date);
    
    if (existing) {
      const updated = { ...existing, ...intake };
      this.waterIntake.set(existing.id, updated);
      return updated;
    } else {
      const newIntake: WaterIntake = {
        id: generateId(),
        userId: intake.userId,
        amount: intake.amount ?? 0,
        target: intake.target ?? 3000,
        date: intake.date,
        createdAt: new Date(),
      };
      this.waterIntake.set(newIntake.id, newIntake);
      return newIntake;
    }
  }

  // Daily performance operations
  async getDailyPerformance(userId: string, date: string): Promise<DailyPerformance | undefined> {
    return Array.from(this.dailyPerformance.values())
      .find(perf => perf.userId === userId && perf.date === date);
  }

  async upsertDailyPerformance(performance: InsertDailyPerformance): Promise<DailyPerformance> {
    const existing = await this.getDailyPerformance(performance.userId, performance.date);
    
    if (existing) {
      const updated = { ...existing, ...performance };
      this.dailyPerformance.set(existing.id, updated);
      return updated;
    } else {
      const newPerformance: DailyPerformance = {
        id: generateId(),
        userId: performance.userId,
        date: performance.date,
        tasksScore: performance.tasksScore ?? 0,
        workoutScore: performance.workoutScore ?? 0,
        mindScore: performance.mindScore ?? 0,
        routineScore: performance.routineScore ?? 0,
        devScore: performance.devScore ?? 0,
        overallScore: performance.overallScore ?? 0,
        createdAt: new Date(),
      };
      this.dailyPerformance.set(newPerformance.id, newPerformance);
      return newPerformance;
    }
  }

  async getDailyPerformanceRange(userId: string, startDate: string, endDate: string): Promise<DailyPerformance[]> {
    return Array.from(this.dailyPerformance.values())
      .filter(perf => 
        perf.userId === userId && 
        perf.date >= startDate && 
        perf.date <= endDate
      )
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}