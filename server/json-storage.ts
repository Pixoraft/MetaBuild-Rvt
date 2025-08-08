import fs from 'fs';
import path from 'path';
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

interface StorageData {
  users: Record<string, User>;
  tasks: Record<string, Task>;
  workoutTypes: Record<string, WorkoutType>;
  exercises: Record<string, Exercise>;
  workoutLogs: Record<string, WorkoutLog>;
  mindExercises: Record<string, MindExercise>;
  mindExerciseLogs: Record<string, MindExerciseLog>;
  routines: Record<string, Routine>;
  routineLogs: Record<string, RoutineLog>;
  devGoals: Record<string, DevGoal>;
  devGoalLogs: Record<string, DevGoalLog>;
  waterIntake: Record<string, WaterIntake>;
  dailyPerformance: Record<string, DailyPerformance>;
  lastBackup: string;
}

export class JsonStorage implements IStorage {
  private dataPath = path.join(process.cwd(), 'data');
  private backupPath = path.join(this.dataPath, 'backups');
  private currentDataFile = path.join(this.dataPath, 'current.json');
  
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

  private dailyBackupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDirectories();
    this.loadData();
    this.scheduleDailyBackup();
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    if (!fs.existsSync(this.backupPath)) {
      fs.mkdirSync(this.backupPath, { recursive: true });
    }
  }

  private loadData() {
    try {
      if (fs.existsSync(this.currentDataFile)) {
        const rawData = fs.readFileSync(this.currentDataFile, 'utf-8');
        const data: StorageData = JSON.parse(rawData);
        
        // Load data into Maps
        this.users = new Map(Object.entries(data.users || {}));
        this.tasks = new Map(Object.entries(data.tasks || {}));
        this.workoutTypes = new Map(Object.entries(data.workoutTypes || {}));
        this.exercises = new Map(Object.entries(data.exercises || {}));
        this.workoutLogs = new Map(Object.entries(data.workoutLogs || {}));
        this.mindExercises = new Map(Object.entries(data.mindExercises || {}));
        this.mindExerciseLogs = new Map(Object.entries(data.mindExerciseLogs || {}));
        this.routines = new Map(Object.entries(data.routines || {}));
        this.routineLogs = new Map(Object.entries(data.routineLogs || {}));
        this.devGoals = new Map(Object.entries(data.devGoals || {}));
        this.devGoalLogs = new Map(Object.entries(data.devGoalLogs || {}));
        this.waterIntake = new Map(Object.entries(data.waterIntake || {}));
        this.dailyPerformance = new Map(Object.entries(data.dailyPerformance || {}));

        console.log(`✅ Data loaded from ${this.currentDataFile}`);
        console.log(`📊 Loaded: ${this.users.size} users, ${this.tasks.size} tasks, ${this.workoutLogs.size} workout logs`);
      } else {
        console.log('📝 No existing data file found, starting with empty storage');
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
      console.log('🔄 Starting with empty storage');
    }
  }

  private saveData() {
    try {
      const data: StorageData = {
        users: Object.fromEntries(this.users.entries()),
        tasks: Object.fromEntries(this.tasks.entries()),
        workoutTypes: Object.fromEntries(this.workoutTypes.entries()),
        exercises: Object.fromEntries(this.exercises.entries()),
        workoutLogs: Object.fromEntries(this.workoutLogs.entries()),
        mindExercises: Object.fromEntries(this.mindExercises.entries()),
        mindExerciseLogs: Object.fromEntries(this.mindExerciseLogs.entries()),
        routines: Object.fromEntries(this.routines.entries()),
        routineLogs: Object.fromEntries(this.routineLogs.entries()),
        devGoals: Object.fromEntries(this.devGoals.entries()),
        devGoalLogs: Object.fromEntries(this.devGoalLogs.entries()),
        waterIntake: Object.fromEntries(this.waterIntake.entries()),
        dailyPerformance: Object.fromEntries(this.dailyPerformance.entries()),
        lastBackup: new Date().toISOString(),
      };

      fs.writeFileSync(this.currentDataFile, JSON.stringify(data, null, 2));
      console.log(`💾 Data saved to ${this.currentDataFile}`);
    } catch (error) {
      console.error('❌ Error saving data:', error);
    }
  }

  private createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFile = path.join(this.backupPath, `backup-${timestamp}.json`);
      
      if (fs.existsSync(this.currentDataFile)) {
        fs.copyFileSync(this.currentDataFile, backupFile);
        console.log(`📦 Backup created: ${backupFile}`);
        
        // Keep only last 30 backups
        this.cleanOldBackups();
      }
    } catch (error) {
      console.error('❌ Error creating backup:', error);
    }
  }

  private cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupPath)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(this.backupPath, file),
          time: fs.statSync(path.join(this.backupPath, file)).mtime
        }))
        .sort((a, b) => b.time.getTime() - a.time.getTime());

      // Keep only the most recent 30 backups
      if (files.length > 30) {
        for (let i = 30; i < files.length; i++) {
          fs.unlinkSync(files[i].path);
          console.log(`🗑️ Removed old backup: ${files[i].name}`);
        }
      }
    } catch (error) {
      console.error('❌ Error cleaning old backups:', error);
    }
  }

  private scheduleDailyBackup() {
    // Clear existing timer
    if (this.dailyBackupTimer) {
      clearTimeout(this.dailyBackupTimer);
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 12:01 AM

    const msUntilBackup = tomorrow.getTime() - now.getTime();

    this.dailyBackupTimer = setTimeout(() => {
      console.log('🕐 Daily backup started at 12:01 AM');
      this.createBackup();
      this.saveData();
      
      // Schedule next backup
      this.scheduleDailyBackup();
    }, msUntilBackup);

    console.log(`⏰ Next automatic backup scheduled for: ${tomorrow.toLocaleString()}`);
  }

  // Public backup method for manual backups
  public manualBackup() {
    console.log('📦 Manual backup initiated');
    this.createBackup();
    this.saveData();
  }

  // Clear all performance data to force recalculation with new logic
  clearPerformanceData() {
    this.dailyPerformance.clear();
    this.saveData();
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
    this.saveData();
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
    this.saveData();
    return task;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      ...updates,
      id: task.id, // Keep original ID
      userId: task.userId, // Keep original userId
      createdAt: task.createdAt, // Keep original createdAt
    };

    this.tasks.set(id, updatedTask);
    this.saveData();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.saveData();
    }
    return deleted;
  }

  // Workout operations
  async getWorkoutTypes(userId: string): Promise<WorkoutType[]> {
    return Array.from(this.workoutTypes.values())
      .filter(type => type.userId === userId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async createWorkoutType(workoutTypeData: InsertWorkoutType): Promise<WorkoutType> {
    const workoutType: WorkoutType = {
      id: generateId(),
      userId: workoutTypeData.userId,
      name: workoutTypeData.name,
      isWeekly: workoutTypeData.isWeekly ?? true,
      maxTime: workoutTypeData.maxTime ?? null,
      createdAt: new Date(),
    };
    this.workoutTypes.set(workoutType.id, workoutType);
    this.saveData();
    return workoutType;
  }

  async getExercises(workoutTypeId: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.workoutTypeId === workoutTypeId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async createExercise(exerciseData: InsertExercise): Promise<Exercise> {
    const exercise: Exercise = {
      id: generateId(),
      workoutTypeId: exerciseData.workoutTypeId,
      name: exerciseData.name,
      sets: exerciseData.sets ?? null,
      reps: exerciseData.reps ?? null,
      duration: exerciseData.duration ?? null,
      dayOfWeek: exerciseData.dayOfWeek ?? null,
      orderIndex: exerciseData.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.exercises.set(exercise.id, exercise);
    this.saveData();
    return exercise;
  }

  async getWorkoutLogs(userId: string, date: string): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createWorkoutLog(logData: InsertWorkoutLog): Promise<WorkoutLog> {
    const log: WorkoutLog = {
      id: generateId(),
      userId: logData.userId,
      exerciseId: logData.exerciseId,
      completed: logData.completed ?? false,
      date: logData.date,
      completedAt: logData.completedAt ?? null,
      createdAt: new Date(),
    };
    this.workoutLogs.set(log.id, log);
    this.saveData();
    return log;
  }

  async updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const log = this.workoutLogs.get(id);
    if (!log) return undefined;

    const updatedLog: WorkoutLog = {
      ...log,
      ...updates,
      id: log.id,
      userId: log.userId,
      createdAt: log.createdAt,
    };

    this.workoutLogs.set(id, updatedLog);
    this.saveData();
    return updatedLog;
  }

  // Mind exercise operations
  async getMindExercises(userId: string): Promise<MindExercise[]> {
    return Array.from(this.mindExercises.values())
      .filter(exercise => exercise.userId === userId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async createMindExercise(exerciseData: InsertMindExercise): Promise<MindExercise> {
    const exercise: MindExercise = {
      id: generateId(),
      userId: exerciseData.userId,
      name: exerciseData.name,
      time: exerciseData.time,
      duration: exerciseData.duration ?? null,
      orderIndex: exerciseData.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.mindExercises.set(exercise.id, exercise);
    this.saveData();
    return exercise;
  }

  async getMindExerciseLogs(userId: string, date: string): Promise<MindExerciseLog[]> {
    return Array.from(this.mindExerciseLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createMindExerciseLog(logData: InsertMindExerciseLog): Promise<MindExerciseLog> {
    const log: MindExerciseLog = {
      id: generateId(),
      userId: logData.userId,
      mindExerciseId: logData.mindExerciseId,
      completed: logData.completed ?? false,
      date: logData.date,
      completedAt: logData.completedAt ?? null,
      createdAt: new Date(),
    };
    this.mindExerciseLogs.set(log.id, log);
    this.saveData();
    return log;
  }

  async updateMindExerciseLog(id: string, updates: Partial<InsertMindExerciseLog>): Promise<MindExerciseLog | undefined> {
    const log = this.mindExerciseLogs.get(id);
    if (!log) return undefined;

    const updatedLog: MindExerciseLog = {
      ...log,
      ...updates,
      id: log.id,
      userId: log.userId,
      createdAt: log.createdAt,
    };

    this.mindExerciseLogs.set(id, updatedLog);
    this.saveData();
    return updatedLog;
  }

  // Routine operations
  async getRoutines(userId: string): Promise<Routine[]> {
    return Array.from(this.routines.values())
      .filter(routine => routine.userId === userId)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }

  async createRoutine(routineData: InsertRoutine): Promise<Routine> {
    const routine: Routine = {
      id: generateId(),
      userId: routineData.userId,
      name: routineData.name,
      description: routineData.description ?? null,
      type: routineData.type,
      dayOfWeek: routineData.dayOfWeek ?? null,
      orderIndex: routineData.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.routines.set(routine.id, routine);
    this.saveData();
    return routine;
  }

  async getRoutineLogs(userId: string, date: string): Promise<RoutineLog[]> {
    return Array.from(this.routineLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createRoutineLog(logData: InsertRoutineLog): Promise<RoutineLog> {
    const log: RoutineLog = {
      id: generateId(),
      userId: logData.userId,
      routineId: logData.routineId,
      completed: logData.completed ?? false,
      date: logData.date,
      completedAt: logData.completedAt ?? null,
      createdAt: new Date(),
    };
    this.routineLogs.set(log.id, log);
    this.saveData();
    return log;
  }

  async updateRoutineLog(id: string, updates: Partial<InsertRoutineLog>): Promise<RoutineLog | undefined> {
    const log = this.routineLogs.get(id);
    if (!log) return undefined;

    const updatedLog: RoutineLog = {
      ...log,
      ...updates,
      id: log.id,
      userId: log.userId,
      createdAt: log.createdAt,
    };

    this.routineLogs.set(id, updatedLog);
    this.saveData();
    return updatedLog;
  }

  // Dev goal operations
  async getDevGoals(userId: string): Promise<DevGoal[]> {
    return Array.from(this.devGoals.values())
      .filter(goal => goal.userId === userId)
      .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  }

  async createDevGoal(goalData: InsertDevGoal): Promise<DevGoal> {
    const goal: DevGoal = {
      id: generateId(),
      userId: goalData.userId,
      title: goalData.title,
      description: goalData.description ?? null,
      type: goalData.type,
      targetHours: goalData.targetHours ?? null,
      currentHours: goalData.currentHours ?? 0,
      completed: goalData.completed ?? false,
      orderIndex: goalData.orderIndex ?? 0,
      createdAt: new Date(),
    };
    this.devGoals.set(goal.id, goal);
    this.saveData();
    return goal;
  }

  async getDevGoalLogs(userId: string, date: string): Promise<DevGoalLog[]> {
    return Array.from(this.devGoalLogs.values())
      .filter(log => log.userId === userId && log.date === date)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createDevGoalLog(logData: InsertDevGoalLog): Promise<DevGoalLog> {
    const log: DevGoalLog = {
      id: generateId(),
      userId: logData.userId,
      devGoalId: logData.devGoalId,
      hoursSpent: logData.hoursSpent ?? 0,
      completed: logData.completed ?? false,
      date: logData.date,
      createdAt: new Date(),
    };
    this.devGoalLogs.set(log.id, log);
    this.saveData();
    return log;
  }

  async updateDevGoalLog(id: string, updates: Partial<InsertDevGoalLog>): Promise<DevGoalLog | undefined> {
    const log = this.devGoalLogs.get(id);
    if (!log) return undefined;

    const updatedLog: DevGoalLog = {
      ...log,
      ...updates,
      id: log.id,
      userId: log.userId,
      createdAt: log.createdAt,
    };

    this.devGoalLogs.set(id, updatedLog);
    this.saveData();
    return updatedLog;
  }

  // Water intake operations
  async getWaterIntake(userId: string, date: string): Promise<WaterIntake | undefined> {
    const key = `${userId}-${date}`;
    return this.waterIntake.get(key);
  }

  async upsertWaterIntake(intakeData: InsertWaterIntake): Promise<WaterIntake> {
    const key = `${intakeData.userId}-${intakeData.date}`;
    const existing = this.waterIntake.get(key);
    
    const intake: WaterIntake = {
      id: existing?.id || generateId(),
      userId: intakeData.userId,
      date: intakeData.date,
      amount: intakeData.amount ?? 0,
      target: intakeData.target ?? 3000,
      createdAt: existing?.createdAt || new Date(),
    };

    this.waterIntake.set(key, intake);
    this.saveData();
    return intake;
  }

  // Daily performance operations
  async getDailyPerformance(userId: string, date: string): Promise<DailyPerformance | undefined> {
    const key = `${userId}-${date}`;
    return this.dailyPerformance.get(key);
  }

  async upsertDailyPerformance(performanceData: InsertDailyPerformance): Promise<DailyPerformance> {
    const key = `${performanceData.userId}-${performanceData.date}`;
    const existing = this.dailyPerformance.get(key);
    
    const performance: DailyPerformance = {
      id: existing?.id || generateId(),
      userId: performanceData.userId,
      date: performanceData.date,
      tasksScore: performanceData.tasksScore ?? 0,
      workoutScore: performanceData.workoutScore ?? 0,
      mindScore: performanceData.mindScore ?? 0,
      routineScore: performanceData.routineScore ?? 0,
      devScore: performanceData.devScore ?? 0,
      overallScore: performanceData.overallScore ?? 0,
      createdAt: existing?.createdAt || new Date(),
    };

    this.dailyPerformance.set(key, performance);
    this.saveData();
    return performance;
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