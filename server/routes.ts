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
      const performance = await storage.getDailyPerformance(userId, date as string);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching daily performance:", error);
      res.status(500).json({ message: "Failed to fetch daily performance" });
    }
  });

  app.get('/api/daily-performance/range/:startDate/:endDate', async (req: any, res) => {
    try {
      const userId = FIXED_USER_ID;
      const { startDate, endDate } = req.params;
      // For now, return empty array - would need to implement range query in storage
      res.json([]);
    } catch (error) {
      console.error("Error fetching performance range:", error);
      res.status(500).json({ message: "Failed to fetch performance range" });
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

  const httpServer = createServer(app);
  return httpServer;
}
