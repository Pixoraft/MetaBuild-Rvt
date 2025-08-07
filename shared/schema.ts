import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  date,
  unique,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  currentStreak: integer("current_streak").default(0),
  bestStreak: integer("best_streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  dueTime: varchar("due_time"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutTypes = pgTable("workout_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  isWeekly: boolean("is_weekly").default(true),
  maxTime: integer("max_time"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workoutTypeId: varchar("workout_type_id").notNull().references(() => workoutTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: integer("reps"),
  duration: varchar("duration"),
  dayOfWeek: integer("day_of_week"), // 0-6 (Sun-Sat)
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mindExercises = pgTable("mind_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  time: varchar("time").notNull(), // "5:40"
  duration: integer("duration"), // in minutes
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const mindExerciseLogs = pgTable("mind_exercise_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mindExerciseId: varchar("mind_exercise_id").notNull().references(() => mindExercises.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const routines = pgTable("routines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // "morning", "night", "weekly"
  dayOfWeek: integer("day_of_week"), // 0-6 (Sun-Sat) for weekly routines
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const routineLogs = pgTable("routine_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  routineId: varchar("routine_id").notNull().references(() => routines.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  date: date("date").notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devGoals = pgTable("dev_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: varchar("type").notNull(), // "daily", "weekly", "monthly", "yearly"
  targetHours: integer("target_hours"),
  currentHours: integer("current_hours").default(0),
  completed: boolean("completed").default(false),
  orderIndex: integer("order_index").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const devGoalLogs = pgTable("dev_goal_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  devGoalId: varchar("dev_goal_id").notNull().references(() => devGoals.id, { onDelete: "cascade" }),
  hoursSpent: integer("hours_spent").default(0),
  completed: boolean("completed").default(false),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const waterIntake = pgTable("water_intake", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: integer("amount").default(0), // in ml
  target: integer("target").default(3000), // in ml
  date: date("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserDate: unique("unique_user_date").on(table.userId, table.date),
}));

export const dailyPerformance = pgTable("daily_performance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  tasksScore: integer("tasks_score").default(0), // 0-100
  workoutScore: integer("workout_score").default(0), // 0-100
  mindScore: integer("mind_score").default(0), // 0-100
  routineScore: integer("routine_score").default(0), // 0-100
  devScore: integer("dev_score").default(0), // 0-100
  overallScore: integer("overall_score").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  uniqueUserDate: unique("unique_performance_user_date").on(table.userId, table.date),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertWorkoutTypeSchema = createInsertSchema(workoutTypes).omit({ id: true, createdAt: true });
export const insertExerciseSchema = createInsertSchema(exercises).omit({ id: true, createdAt: true });
export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({ id: true, createdAt: true });
export const insertMindExerciseSchema = createInsertSchema(mindExercises).omit({ id: true, createdAt: true });
export const insertMindExerciseLogSchema = createInsertSchema(mindExerciseLogs).omit({ id: true, createdAt: true });
export const insertRoutineSchema = createInsertSchema(routines).omit({ id: true, createdAt: true });
export const insertRoutineLogSchema = createInsertSchema(routineLogs).omit({ id: true, createdAt: true });
export const insertDevGoalSchema = createInsertSchema(devGoals).omit({ id: true, createdAt: true });
export const insertDevGoalLogSchema = createInsertSchema(devGoalLogs).omit({ id: true, createdAt: true });
export const insertWaterIntakeSchema = createInsertSchema(waterIntake).omit({ id: true, createdAt: true });
export const insertDailyPerformanceSchema = createInsertSchema(dailyPerformance).omit({ id: true, createdAt: true });

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertWorkoutType = z.infer<typeof insertWorkoutTypeSchema>;
export type WorkoutType = typeof workoutTypes.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;
export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
export type InsertMindExercise = z.infer<typeof insertMindExerciseSchema>;
export type MindExercise = typeof mindExercises.$inferSelect;
export type InsertMindExerciseLog = z.infer<typeof insertMindExerciseLogSchema>;
export type MindExerciseLog = typeof mindExerciseLogs.$inferSelect;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type Routine = typeof routines.$inferSelect;
export type InsertRoutineLog = z.infer<typeof insertRoutineLogSchema>;
export type RoutineLog = typeof routineLogs.$inferSelect;
export type InsertDevGoal = z.infer<typeof insertDevGoalSchema>;
export type DevGoal = typeof devGoals.$inferSelect;
export type InsertDevGoalLog = z.infer<typeof insertDevGoalLogSchema>;
export type DevGoalLog = typeof devGoalLogs.$inferSelect;
export type InsertWaterIntake = z.infer<typeof insertWaterIntakeSchema>;
export type WaterIntake = typeof waterIntake.$inferSelect;
export type InsertDailyPerformance = z.infer<typeof insertDailyPerformanceSchema>;
export type DailyPerformance = typeof dailyPerformance.$inferSelect;
