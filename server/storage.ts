import {
  users,
  tasks,
  workoutTypes,
  exercises,
  workoutLogs,
  mindExercises,
  mindExerciseLogs,
  routines,
  routineLogs,
  devGoals,
  devGoalLogs,
  waterIntake,
  dailyPerformance,
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
import { db } from "./db";
import { eq, and, desc, gte, lte } from "drizzle-orm";

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

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Task operations
  async getTasks(userId: string, date: string): Promise<Task[]> {
    return await db.select().from(tasks)
      .where(and(eq(tasks.userId, userId), eq(tasks.date, date)))
      .orderBy(desc(tasks.createdAt));
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: string, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const [updatedTask] = await db.update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Workout operations
  async getWorkoutTypes(userId: string): Promise<WorkoutType[]> {
    return await db.select().from(workoutTypes)
      .where(eq(workoutTypes.userId, userId))
      .orderBy(workoutTypes.name);
  }

  async createWorkoutType(workoutType: InsertWorkoutType): Promise<WorkoutType> {
    const [newWorkoutType] = await db.insert(workoutTypes).values(workoutType).returning();
    return newWorkoutType;
  }

  async getExercises(workoutTypeId: string): Promise<Exercise[]> {
    return await db.select().from(exercises)
      .where(eq(exercises.workoutTypeId, workoutTypeId))
      .orderBy(exercises.orderIndex);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const [newExercise] = await db.insert(exercises).values(exercise).returning();
    return newExercise;
  }

  async getWorkoutLogs(userId: string, date: string): Promise<WorkoutLog[]> {
    return await db.select().from(workoutLogs)
      .where(and(eq(workoutLogs.userId, userId), eq(workoutLogs.date, date)))
      .orderBy(desc(workoutLogs.createdAt));
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const [newLog] = await db.insert(workoutLogs).values(log).returning();
    return newLog;
  }

  async updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const [updatedLog] = await db.update(workoutLogs)
      .set(updates)
      .where(eq(workoutLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Mind exercise operations
  async getMindExercises(userId: string): Promise<MindExercise[]> {
    return await db.select().from(mindExercises)
      .where(eq(mindExercises.userId, userId))
      .orderBy(mindExercises.orderIndex);
  }

  async createMindExercise(exercise: InsertMindExercise): Promise<MindExercise> {
    const [newExercise] = await db.insert(mindExercises).values(exercise).returning();
    return newExercise;
  }

  async getMindExerciseLogs(userId: string, date: string): Promise<MindExerciseLog[]> {
    return await db.select().from(mindExerciseLogs)
      .where(and(eq(mindExerciseLogs.userId, userId), eq(mindExerciseLogs.date, date)))
      .orderBy(desc(mindExerciseLogs.createdAt));
  }

  async createMindExerciseLog(log: InsertMindExerciseLog): Promise<MindExerciseLog> {
    const [newLog] = await db.insert(mindExerciseLogs).values(log).returning();
    return newLog;
  }

  async updateMindExerciseLog(id: string, updates: Partial<InsertMindExerciseLog>): Promise<MindExerciseLog | undefined> {
    const [updatedLog] = await db.update(mindExerciseLogs)
      .set(updates)
      .where(eq(mindExerciseLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Routine operations
  async getRoutines(userId: string): Promise<Routine[]> {
    return await db.select().from(routines)
      .where(eq(routines.userId, userId))
      .orderBy(routines.orderIndex);
  }

  async createRoutine(routine: InsertRoutine): Promise<Routine> {
    const [newRoutine] = await db.insert(routines).values(routine).returning();
    return newRoutine;
  }

  async getRoutineLogs(userId: string, date: string): Promise<RoutineLog[]> {
    return await db.select().from(routineLogs)
      .where(and(eq(routineLogs.userId, userId), eq(routineLogs.date, date)))
      .orderBy(desc(routineLogs.createdAt));
  }

  async createRoutineLog(log: InsertRoutineLog): Promise<RoutineLog> {
    const [newLog] = await db.insert(routineLogs).values(log).returning();
    return newLog;
  }

  async updateRoutineLog(id: string, updates: Partial<InsertRoutineLog>): Promise<RoutineLog | undefined> {
    const [updatedLog] = await db.update(routineLogs)
      .set(updates)
      .where(eq(routineLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Dev goal operations
  async getDevGoals(userId: string): Promise<DevGoal[]> {
    return await db.select().from(devGoals)
      .where(eq(devGoals.userId, userId))
      .orderBy(devGoals.orderIndex);
  }

  async createDevGoal(goal: InsertDevGoal): Promise<DevGoal> {
    const [newGoal] = await db.insert(devGoals).values(goal).returning();
    return newGoal;
  }

  async getDevGoalLogs(userId: string, date: string): Promise<DevGoalLog[]> {
    return await db.select().from(devGoalLogs)
      .where(and(eq(devGoalLogs.userId, userId), eq(devGoalLogs.date, date)))
      .orderBy(desc(devGoalLogs.createdAt));
  }

  async createDevGoalLog(log: InsertDevGoalLog): Promise<DevGoalLog> {
    const [newLog] = await db.insert(devGoalLogs).values(log).returning();
    return newLog;
  }

  async updateDevGoalLog(id: string, updates: Partial<InsertDevGoalLog>): Promise<DevGoalLog | undefined> {
    const [updatedLog] = await db.update(devGoalLogs)
      .set(updates)
      .where(eq(devGoalLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Water intake operations
  async getWaterIntake(userId: string, date: string): Promise<WaterIntake | undefined> {
    const [intake] = await db.select().from(waterIntake)
      .where(and(eq(waterIntake.userId, userId), eq(waterIntake.date, date)));
    return intake;
  }

  async upsertWaterIntake(intake: InsertWaterIntake): Promise<WaterIntake> {
    const [upsertedIntake] = await db
      .insert(waterIntake)
      .values(intake)
      .onConflictDoUpdate({
        target: [waterIntake.userId, waterIntake.date],
        set: intake,
      })
      .returning();
    return upsertedIntake;
  }

  // Daily performance operations
  async getDailyPerformance(userId: string, date: string): Promise<DailyPerformance | undefined> {
    const [performance] = await db.select().from(dailyPerformance)
      .where(and(eq(dailyPerformance.userId, userId), eq(dailyPerformance.date, date)));
    return performance;
  }

  async upsertDailyPerformance(performance: InsertDailyPerformance): Promise<DailyPerformance> {
    const [upsertedPerformance] = await db
      .insert(dailyPerformance)
      .values(performance)
      .onConflictDoUpdate({
        target: [dailyPerformance.userId, dailyPerformance.date],
        set: performance,
      })
      .returning();
    return upsertedPerformance;
  }

  async getDailyPerformanceRange(userId: string, startDate: string, endDate: string): Promise<DailyPerformance[]> {
    return await db.select().from(dailyPerformance)
      .where(and(
        eq(dailyPerformance.userId, userId),
        gte(dailyPerformance.date, startDate),
        lte(dailyPerformance.date, endDate)
      ))
      .orderBy(dailyPerformance.date);
  }
}

export const storage = new DatabaseStorage();
