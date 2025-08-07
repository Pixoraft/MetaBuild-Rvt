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
import { MemoryStorage } from "./memory-storage";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Task operations
  getTasks(userId: string, date: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<boolean>;
  
  // Workout operations
  getWorkoutTypes(userId: string): Promise<WorkoutType[]>;
  createWorkoutType(workoutType: InsertWorkoutType): Promise<WorkoutType>;
  getExercises(workoutTypeId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  getWorkoutLogs(userId: string, date: string): Promise<WorkoutLog[]>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined>;
  
  // Mind exercise operations
  getMindExercises(userId: string): Promise<MindExercise[]>;
  createMindExercise(exercise: InsertMindExercise): Promise<MindExercise>;
  getMindExerciseLogs(userId: string, date: string): Promise<MindExerciseLog[]>;
  createMindExerciseLog(log: InsertMindExerciseLog): Promise<MindExerciseLog>;
  updateMindExerciseLog(id: string, updates: Partial<InsertMindExerciseLog>): Promise<MindExerciseLog | undefined>;
  
  // Routine operations
  getRoutines(userId: string): Promise<Routine[]>;
  createRoutine(routine: InsertRoutine): Promise<Routine>;
  getRoutineLogs(userId: string, date: string): Promise<RoutineLog[]>;
  createRoutineLog(log: InsertRoutineLog): Promise<RoutineLog>;
  updateRoutineLog(id: string, updates: Partial<InsertRoutineLog>): Promise<RoutineLog | undefined>;
  
  // Dev goal operations
  getDevGoals(userId: string): Promise<DevGoal[]>;
  createDevGoal(goal: InsertDevGoal): Promise<DevGoal>;
  getDevGoalLogs(userId: string, date: string): Promise<DevGoalLog[]>;
  createDevGoalLog(log: InsertDevGoalLog): Promise<DevGoalLog>;
  updateDevGoalLog(id: string, updates: Partial<InsertDevGoalLog>): Promise<DevGoalLog | undefined>;
  
  // Water intake operations
  getWaterIntake(userId: string, date: string): Promise<WaterIntake | undefined>;
  upsertWaterIntake(intake: InsertWaterIntake): Promise<WaterIntake>;
  
  // Daily performance operations
  getDailyPerformance(userId: string, date: string): Promise<DailyPerformance | undefined>;
  upsertDailyPerformance(performance: InsertDailyPerformance): Promise<DailyPerformance>;
  getDailyPerformanceRange(userId: string, startDate: string, endDate: string): Promise<DailyPerformance[]>;
}

export const storage = new MemoryStorage();
