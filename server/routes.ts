import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Initialize user data with preloaded content
  app.post('/api/initialize', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await preloadUserData(userId);
      res.json({ message: "User data initialized successfully" });
    } catch (error) {
      console.error("Error initializing user data:", error);
      res.status(500).json({ message: "Failed to initialize user data" });
    }
  });

  // Task routes
  app.get('/api/tasks/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const tasks = await storage.getTasks(userId, date);
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const taskData = insertTaskSchema.parse({ ...req.body, userId });
      const task = await storage.createTask(taskData);
      res.json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
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

  app.delete('/api/tasks/:id', isAuthenticated, async (req: any, res) => {
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
  app.get('/api/workout-types', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const workoutTypes = await storage.getWorkoutTypes(userId);
      res.json(workoutTypes);
    } catch (error) {
      console.error("Error fetching workout types:", error);
      res.status(500).json({ message: "Failed to fetch workout types" });
    }
  });

  app.get('/api/exercises/:workoutTypeId', isAuthenticated, async (req: any, res) => {
    try {
      const { workoutTypeId } = req.params;
      const exercises = await storage.getExercises(workoutTypeId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  app.get('/api/workout-logs/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getWorkoutLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching workout logs:", error);
      res.status(500).json({ message: "Failed to fetch workout logs" });
    }
  });

  app.post('/api/workout-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logData = insertWorkoutLogSchema.parse({ ...req.body, userId });
      const log = await storage.createWorkoutLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating workout log:", error);
      res.status(500).json({ message: "Failed to create workout log" });
    }
  });

  app.patch('/api/workout-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
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
  app.get('/api/mind-exercises', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const exercises = await storage.getMindExercises(userId);
      res.json(exercises);
    } catch (error) {
      console.error("Error fetching mind exercises:", error);
      res.status(500).json({ message: "Failed to fetch mind exercises" });
    }
  });

  app.get('/api/mind-exercise-logs/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getMindExerciseLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching mind exercise logs:", error);
      res.status(500).json({ message: "Failed to fetch mind exercise logs" });
    }
  });

  app.post('/api/mind-exercise-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logData = insertMindExerciseLogSchema.parse({ ...req.body, userId });
      const log = await storage.createMindExerciseLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating mind exercise log:", error);
      res.status(500).json({ message: "Failed to create mind exercise log" });
    }
  });

  app.patch('/api/mind-exercise-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
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
  app.get('/api/routines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const routines = await storage.getRoutines(userId);
      res.json(routines);
    } catch (error) {
      console.error("Error fetching routines:", error);
      res.status(500).json({ message: "Failed to fetch routines" });
    }
  });

  app.get('/api/routine-logs/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getRoutineLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching routine logs:", error);
      res.status(500).json({ message: "Failed to fetch routine logs" });
    }
  });

  app.post('/api/routine-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logData = insertRoutineLogSchema.parse({ ...req.body, userId });
      const log = await storage.createRoutineLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating routine log:", error);
      res.status(500).json({ message: "Failed to create routine log" });
    }
  });

  app.patch('/api/routine-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
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
  app.get('/api/dev-goals', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const goals = await storage.getDevGoals(userId);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching dev goals:", error);
      res.status(500).json({ message: "Failed to fetch dev goals" });
    }
  });

  app.get('/api/dev-goal-logs/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const logs = await storage.getDevGoalLogs(userId, date);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching dev goal logs:", error);
      res.status(500).json({ message: "Failed to fetch dev goal logs" });
    }
  });

  app.post('/api/dev-goal-logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const logData = insertDevGoalLogSchema.parse({ ...req.body, userId });
      const log = await storage.createDevGoalLog(logData);
      res.json(log);
    } catch (error) {
      console.error("Error creating dev goal log:", error);
      res.status(500).json({ message: "Failed to create dev goal log" });
    }
  });

  app.patch('/api/dev-goal-logs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
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
  app.get('/api/water-intake/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const intake = await storage.getWaterIntake(userId, date);
      res.json(intake || { amount: 0, target: 3000 });
    } catch (error) {
      console.error("Error fetching water intake:", error);
      res.status(500).json({ message: "Failed to fetch water intake" });
    }
  });

  app.post('/api/water-intake', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const intakeData = insertWaterIntakeSchema.parse({ ...req.body, userId });
      const intake = await storage.upsertWaterIntake(intakeData);
      res.json(intake);
    } catch (error) {
      console.error("Error updating water intake:", error);
      res.status(500).json({ message: "Failed to update water intake" });
    }
  });

  // Daily performance routes
  app.get('/api/daily-performance/:date', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { date } = req.params;
      const performance = await storage.getDailyPerformance(userId, date);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching daily performance:", error);
      res.status(500).json({ message: "Failed to fetch daily performance" });
    }
  });

  app.post('/api/daily-performance', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
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
