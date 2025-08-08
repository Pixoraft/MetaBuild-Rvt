import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTaskSchema,
  insertWorkoutTypeSchema,
  insertExerciseSchema,
  insertWorkoutLogSchema,
  insertMindExerciseSchema,
  insertMindExerciseLogSchema,
  insertRoutineSchema,
  insertRoutineLogSchema,
  insertDevGoalSchema,
  insertDevGoalLogSchema,
  insertWaterIntakeSchema,
  insertDailyPerformanceSchema
} from "@shared/schema";
import { preloadUserData } from "../client/src/lib/preload-data";
import { format } from "date-fns";

// Helper function to calculate daily performance and update streaks
async function calculateAndUpdateDailyPerformance(userId: string, date: string) {
  try {
    // Get all data for the day
    const [tasks, workoutLogs, mindLogs, routineLogs, devGoalLogs, waterIntake] = await Promise.all([
      storage.getTasks(userId, date),
      storage.getWorkoutLogs(userId, date),
      storage.getMindExerciseLogs(userId, date),
      storage.getRoutineLogs(userId, date),
      storage.getDevGoalLogs(userId, date),
      storage.getWaterIntake(userId, date)
    ]);

    // Calculate scores (0-100)
    const completedTasks = tasks.filter(t => t.completed).length;
    const tasksScore = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const completedWorkouts = workoutLogs.filter(w => w.completed).length;
    const workoutScore = workoutLogs.length > 0 ? Math.round((completedWorkouts / workoutLogs.length) * 100) : 0;

    const completedMind = mindLogs.filter(m => m.completed).length;
    const mindExercises = await storage.getMindExercises(userId);
    const mindScore = mindExercises.length > 0 ? Math.round((completedMind / mindExercises.length) * 100) : 0;

    const completedRoutines = routineLogs.filter(r => r.completed).length;
    const allRoutines = await storage.getRoutines(userId);
    // Only count today's relevant routines (morning, night, and weekly for today's day)
    const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const todaysRoutines = allRoutines.filter(r => 
      r.type === 'morning' || 
      r.type === 'night' || 
      (r.type === 'weekly' && r.dayOfWeek === dayOfWeek)
    );
    const routineScore = todaysRoutines.length > 0 ? Math.round((completedRoutines / todaysRoutines.length) * 100) : 0;

    const allDevGoals = await storage.getDevGoals(userId);
    // Only count daily development goals for today's performance
    const dailyDevGoals = allDevGoals.filter(g => g.type === 'daily');
    const dailyDevGoalIds = new Set(dailyDevGoals.map(g => g.id));
    // Only count completed logs for daily dev goals
    const completedDailyDev = devGoalLogs.filter(d => d.completed && dailyDevGoalIds.has(d.devGoalId)).length;
    const devScore = dailyDevGoals.length > 0 ? Math.round((completedDailyDev / dailyDevGoals.length) * 100) : 0;

    // Calculate overall score - only count categories with actual activity
    const scores = [tasksScore, workoutScore, mindScore, routineScore, devScore];
    const hasAnyActivity = tasks.length > 0 || workoutLogs.length > 0 || mindLogs.length > 0 || routineLogs.length > 0 || devGoalLogs.length > 0;
    const overallScore = hasAnyActivity ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;

    // Update daily performance
    await storage.upsertDailyPerformance({
      userId,
      date,
      tasksScore,
      workoutScore,
      mindScore,
      routineScore,
      devScore,
      overallScore
    });

    // Update streak based on performance
    const user = await storage.getUser(userId);
    if (user) {
      const currentStreak = user.currentStreak || 0;
      const bestStreak = user.bestStreak || 0;
      
      // Check if this is a new day's performance (avoid double counting same day)
      const today = format(new Date(), 'yyyy-MM-dd');
      const isToday = date === today;
      
      if (overallScore >= 70 && isToday) {
        // Good performance - increase streak for today only
        const newStreak = currentStreak + 1;
        const newBestStreak = Math.max(newStreak, bestStreak);
        await storage.upsertUser({
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          currentStreak: newStreak,
          bestStreak: newBestStreak
        });
      } else if (overallScore < 70 && isToday && currentStreak > 0) {
        // Poor performance today - reset streak
        await storage.upsertUser({
          id: userId,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          currentStreak: 0,
          bestStreak: bestStreak
        });
      }
    }

    return { tasksScore, workoutScore, mindScore, routineScore, devScore, overallScore };
  } catch (error) {
    console.error("Error calculating daily performance:", error);
    return null;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  const FIXED_USER_ID = "user-1"; // Single user ID since no auth needed

  // Create user if not exists and initialize data
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      let user = await storage.getUser(FIXED_USER_ID);
      if (!user) {
        user = await storage.upsertUser({
          id: FIXED_USER_ID,
          email: "user@example.com",
          firstName: "User",
          lastName: "One",
          profileImageUrl: null,
          currentStreak: 0,
          bestStreak: 0,
        });
        await preloadUserData(FIXED_USER_ID);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize user data with preloaded content
  app.post('/api/initialize', async (req: any, res) => {
    try {
      await preloadUserData(FIXED_USER_ID);
      res.json({ message: "User data initialized successfully" });
    } catch (error) {
      console.error("Error initializing user data:", error);
      res.status(500).json({ message: "Failed to initialize user data" });
    }
  });

  // Task routes
  app.get('/api/tasks', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const tasks = await storage.getTasks(userId, date as string);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, taskData.date);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Convert ISO string to Date if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      const task = await storage.updateTask(id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      // Update daily performance
      await calculateAndUpdateDailyPerformance(FIXED_USER_ID, task.date);
      res.json(task);
    } catch (error) {
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Workout routes
  app.get('/api/workout-types', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const workoutTypes = await storage.getWorkoutTypes(userId);
      res.json(workoutTypes);
    } catch (error) {
      console.error("Error fetching workout types:", error);
      res.status(500).json({ message: "Failed to fetch workout types" });
    }
  });

  app.get('/api/exercises/:workoutTypeId', async (req: any, res) => {
    try {
      const { workoutTypeId } = req.params;
      const exercises = await storage.getExercises(workoutTypeId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  // Get all exercises for export
  app.get('/api/exercises/all', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const workoutTypes = await storage.getWorkoutTypes(userId);
      const allExercises: any[] = [];
      
      for (const workoutType of workoutTypes) {
        const exercises = await storage.getExercises(workoutType.id);
        exercises.forEach(exercise => {
          allExercises.push({
            ...exercise,
            workoutTypeName: workoutType.name
          });
        });
      }
      
      res.json(allExercises);
    } catch (error) {
      console.error("Error fetching all exercises:", error);
      res.status(500).json({ message: "Failed to fetch all exercises" });
    }
  });

  app.get('/api/workout-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const logs = await storage.getWorkoutLogs(userId, date as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching workout logs:", error);
      res.status(500).json({ message: "Failed to fetch workout logs" });
    }
  });

  app.post('/api/workout-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const bodyData = { ...req.body, userId };
      // Convert ISO string to Date if needed
      if (bodyData.completedAt && typeof bodyData.completedAt === 'string') {
        bodyData.completedAt = new Date(bodyData.completedAt);
      }
      const logData = insertWorkoutLogSchema.parse(bodyData);
      const log = await storage.createWorkoutLog(logData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, logData.date);
      res.json(log);
    } catch (error) {
      console.error("Error creating workout log:", error);
      res.status(500).json({ message: "Failed to create workout log" });
    }
  });

  app.patch('/api/workout-logs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Convert ISO string to Date if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      const log = await storage.updateWorkoutLog(id, updates);
      if (!log) {
        return res.status(404).json({ message: "Workout log not found" });
      }
      // Update daily performance
      await calculateAndUpdateDailyPerformance(FIXED_USER_ID, log.date);
      res.json(log);
    } catch (error) {
      console.error("Error updating workout log:", error);
      res.status(500).json({ message: "Failed to update workout log" });
    }
  });

  // Mind exercise routes
  app.get('/api/mind-exercises', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const exercises = await storage.getMindExercises(userId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching mind exercises:", error);
      res.status(500).json({ message: "Failed to fetch mind exercises" });
    }
  });

  app.get('/api/mind-exercise-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const logs = await storage.getMindExerciseLogs(userId, date as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching mind exercise logs:", error);
      res.status(500).json({ message: "Failed to fetch mind exercise logs" });
    }
  });

  app.post('/api/mind-exercise-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const bodyData = { ...req.body, userId };
      // Convert ISO string to Date if needed
      if (bodyData.completedAt && typeof bodyData.completedAt === 'string') {
        bodyData.completedAt = new Date(bodyData.completedAt);
      }
      const logData = insertMindExerciseLogSchema.parse(bodyData);
      const log = await storage.createMindExerciseLog(logData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, logData.date);
      res.json(log);
    } catch (error) {
      console.error("Error creating mind exercise log:", error);
      res.status(500).json({ message: "Failed to create mind exercise log" });
    }
  });

  app.patch('/api/mind-exercise-logs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Convert ISO string to Date if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      const log = await storage.updateMindExerciseLog(id, updates);
      if (!log) {
        return res.status(404).json({ message: "Mind exercise log not found" });
      }
      // Update daily performance
      await calculateAndUpdateDailyPerformance(FIXED_USER_ID, log.date);
      res.json(log);
    } catch (error) {
      console.error("Error updating mind exercise log:", error);
      res.status(500).json({ message: "Failed to update mind exercise log" });
    }
  });

  // Routine routes
  app.get('/api/routines', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const routines = await storage.getRoutines(userId);
      res.json(routines);
    } catch (error) {
      console.error("Error fetching routines:", error);
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.get('/api/routine-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const logs = await storage.getRoutineLogs(userId, date as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching routine logs:", error);
      res.status(500).json({ message: "Failed to fetch routine logs" });
    }
  });

  app.post('/api/routine-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const bodyData = { ...req.body, userId };
      // Convert ISO string to Date if needed
      if (bodyData.completedAt && typeof bodyData.completedAt === 'string') {
        bodyData.completedAt = new Date(bodyData.completedAt);
      }
      const logData = insertRoutineLogSchema.parse(bodyData);
      const log = await storage.createRoutineLog(logData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, logData.date);
      res.json(log);
    } catch (error) {
      console.error("Error creating routine log:", error);
      res.status(500).json({ message: "Failed to create routine log" });
    }
  });

  app.patch('/api/routine-logs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Convert ISO string to Date if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      const log = await storage.updateRoutineLog(id, updates);
      if (!log) {
        return res.status(404).json({ message: "Routine log not found" });
      }
      // Update daily performance
      await calculateAndUpdateDailyPerformance(FIXED_USER_ID, log.date);
      res.json(log);
    } catch (error) {
      console.error("Error updating routine log:", error);
      res.status(500).json({ message: "Failed to update routine log" });
    }
  });

  // Dev goal routes
  app.get('/api/dev-goals', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const goals = await storage.getDevGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching dev goals:", error);
      res.status(500).json({ message: "Failed to fetch dev goals" });
    }
  });

  app.get('/api/dev-goal-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const logs = await storage.getDevGoalLogs(userId, date as string);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching dev goal logs:", error);
      res.status(500).json({ message: "Failed to fetch dev goal logs" });
    }
  });

  app.post('/api/dev-goal-logs', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const bodyData = { ...req.body, userId };
      // Convert ISO string to Date if needed
      if (bodyData.completedAt && typeof bodyData.completedAt === 'string') {
        bodyData.completedAt = new Date(bodyData.completedAt);
      }
      const logData = insertDevGoalLogSchema.parse(bodyData);
      const log = await storage.createDevGoalLog(logData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, logData.date);
      res.json(log);
    } catch (error) {
      console.error("Error creating dev goal log:", error);
      res.status(500).json({ message: "Failed to create dev goal log" });
    }
  });

  app.patch('/api/dev-goal-logs/:id', async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Convert ISO string to Date if needed
      if (updates.completedAt && typeof updates.completedAt === 'string') {
        updates.completedAt = new Date(updates.completedAt);
      }
      const log = await storage.updateDevGoalLog(id, updates);
      if (!log) {
        return res.status(404).json({ message: "Dev goal log not found" });
      }
      // Update daily performance
      await calculateAndUpdateDailyPerformance(FIXED_USER_ID, log.date);
      res.json(log);
    } catch (error) {
      console.error("Error updating dev goal log:", error);
      res.status(500).json({ message: "Failed to update dev goal log" });
    }
  });

  // Water intake routes
  app.get('/api/water-intake', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      const intake = await storage.getWaterIntake(userId, date as string);
      res.json(intake || { amount: 0, target: 3000 });
    } catch (error) {
      console.error("Error fetching water intake:", error);
      res.status(500).json({ message: "Failed to fetch water intake" });
    }
  });

  app.post('/api/water-intake', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const intakeData = insertWaterIntakeSchema.parse({ ...req.body, userId });
      const intake = await storage.upsertWaterIntake(intakeData);
      // Update daily performance
      await calculateAndUpdateDailyPerformance(userId, intakeData.date);
      res.json(intake);
    } catch (error) {
      console.error("Error updating water intake:", error);
      res.status(500).json({ message: "Failed to update water intake" });
    }
  });

  // Daily performance routes
  app.get('/api/daily-performance', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const date = req.query.date || format(new Date(), 'yyyy-MM-dd');
      let performance = await storage.getDailyPerformance(userId, date as string);
      
      // Always recalculate performance to ensure latest logic
      await calculateAndUpdateDailyPerformance(userId, date as string);
      performance = await storage.getDailyPerformance(userId, date as string);
      
      res.json(performance || { tasksScore: 0, workoutScore: 0, mindScore: 0, routineScore: 0, devScore: 0, overallScore: 0 });
    } catch (error) {
      console.error("Error fetching daily performance:", error);
      res.status(500).json({ message: "Failed to fetch daily performance" });
    }
  });

  app.get('/api/daily-performance/range/:startDate/:endDate', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const { startDate, endDate } = req.params;
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Ensure we have performance data by calculating for any missing days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dates = [];
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        dates.push(dateStr);
        
        // Always recalculate today's performance to get latest data
        if (dateStr === today) {
          await calculateAndUpdateDailyPerformance(userId, dateStr);
        } else {
          // Check if performance data exists for other days, if not calculate it
          const existing = await storage.getDailyPerformance(userId, dateStr);
          if (!existing) {
            await calculateAndUpdateDailyPerformance(userId, dateStr);
          }
        }
      }
      
      const performances = await storage.getDailyPerformanceRange(userId, startDate, endDate);
      res.json(performances);
    } catch (error) {
      console.error("Error fetching daily performance range:", error);
      res.status(500).json({ message: "Failed to fetch daily performance range" });
    }
  });

  app.post('/api/daily-performance', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const performanceData = insertDailyPerformanceSchema.parse({ ...req.body, userId });
      const performance = await storage.upsertDailyPerformance(performanceData);
      res.json(performance);
    } catch (error) {
      console.error("Error updating daily performance:", error);
      res.status(500).json({ message: "Failed to update daily performance" });
    }
  });

  // Backup routes
  app.post('/api/backup/manual', async (req: any, res) => {
    try {
      // Cast storage to JsonStorage to access manual backup method
      const jsonStorage = storage as any;
      if (jsonStorage.manualBackup) {
        jsonStorage.manualBackup();
        res.json({ 
          success: true, 
          message: 'Manual backup created successfully',
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(400).json({ message: 'Manual backup not supported with current storage' });
      }
    } catch (error) {
      console.error("Error creating manual backup:", error);
      res.status(500).json({ message: "Failed to create manual backup" });
    }
  });

  app.get('/api/backup/status', async (req: any, res) => {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 1, 0, 0); // 12:01 AM
      
      res.json({
        currentTime: now.toISOString(),
        nextAutoBackup: tomorrow.toISOString(),
        autoBackupEnabled: true,
        storageType: 'JSON File Storage'
      });
    } catch (error) {
      console.error("Error getting backup status:", error);
      res.status(500).json({ message: "Failed to get backup status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
