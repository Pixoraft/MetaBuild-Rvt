import { storage } from "../../../server/storage";

export async function preloadUserData(userId: string) {
  // Preload workout types and exercises based on the 7-day split
  const workoutTypes = [
    {
      userId,
      name: "Push (Chest/Shoulders/Triceps/Abs)",
      isWeekly: true,
      maxTime: 45,
    },
    {
      userId,
      name: "Pull (Back/Biceps/Forearms/Grip)",
      isWeekly: true,
      maxTime: 45,
    },
    {
      userId,
      name: "Legs (Quads/Glutes/Calves)",
      isWeekly: true,
      maxTime: 45,
    },
    {
      userId,
      name: "Core & Abs (Six-Pack/Obliques/Stability)",
      isWeekly: true,
      maxTime: 30,
    },
    {
      userId,
      name: "Power/Explosive/Grip & Veins",
      isWeekly: true,
      maxTime: 35,
    },
    {
      userId,
      name: "BONUS Stretch & Pump Day (Light/Recovery)",
      isWeekly: true,
      maxTime: 35,
    },
    {
      userId,
      name: "Rest Day (Optional Light Recovery)",
      isWeekly: true,
      maxTime: 15,
    },
  ];

  // Create workout types
  const createdWorkoutTypes = await Promise.all(
    workoutTypes.map(async (workoutType) => {
      return await storage.createWorkoutType(workoutType);
    })
  );

  // Preload exercises for each workout type
  const exercisesByDay = [
    // Day 1 - Push
    [
      { name: "Normal Push-Ups", sets: 4, reps: 25 },
      { name: "Incline Push-Ups", sets: 3, reps: 25 },
      { name: "Pike Push-Ups", sets: 3, reps: 15 },
      { name: "Diamond Push-Ups", sets: 2, reps: 15 },
      { name: "Bench Dips", sets: 3, reps: 25 },
      { name: "Russian Twists", sets: 3, reps: 30 },
      { name: "Plank", duration: "5 min" },
    ],
    // Day 2 - Pull
    [
      { name: "Pull-Ups / Assisted", sets: 4, reps: 12 },
      { name: "Towel Rows", sets: 3, reps: 20 },
      { name: "Towel Bicep Curls", sets: 3, reps: 20 },
      { name: "Reverse Curls", sets: 3, reps: 15 },
      { name: "Gripper Fast", sets: 3, reps: 40 },
      { name: "Farmer Hold", duration: "2×45 sec" },
      { name: "Wrist Rolls", sets: 2, reps: 20 },
    ],
    // Day 3 - Legs
    [
      { name: "Squats", sets: 4, reps: 25 },
      { name: "Jump Squats", sets: 3, reps: 20 },
      { name: "Lunges", sets: 3, reps: 20 },
      { name: "Calf Raises", sets: 4, reps: 30 },
      { name: "Wall Sit", duration: "2×45 sec" },
      { name: "Broad Jumps", sets: 2, reps: 15 },
      { name: "High Knees", sets: 2, reps: 30 },
    ],
    // Day 4 - Core & Abs
    [
      { name: "Crunches", sets: 3, reps: 25 },
      { name: "Leg Raises", sets: 3, reps: 25 },
      { name: "Mountain Climbers", sets: 3, reps: 30 },
      { name: "Plank", sets: 3, duration: "1 min" },
      { name: "Side Plank", sets: 2, duration: "1 min each" },
      { name: "V-Ups", sets: 3, reps: 20 },
      { name: "Russian Twists", sets: 3, reps: 30 },
    ],
    // Day 5 - Power/Explosive
    [
      { name: "Clap Pushups", sets: 3, reps: 15 },
      { name: "Skipping", duration: "5 min" },
      { name: "High Knees", sets: 3, reps: 30 },
      { name: "Towel Bicep Curls", sets: 2, reps: 25 },
      { name: "Wrist Rolls", sets: 2, reps: 20 },
      { name: "Gripper Slow Squeeze", sets: 2, reps: 15 },
      { name: "Hanging", sets: 3, duration: "1 min" },
    ],
    // Day 6 - Stretch & Pump
    [
      { name: "Archer Pushups", sets: 2, reps: 12 },
      { name: "Incline Pushups", sets: 2, reps: 20 },
      { name: "Squats", sets: 2, reps: 25 },
      { name: "Plank", sets: 2, duration: "1 min" },
      { name: "Neck + Spine + Toe Touch Stretch", sets: 3, duration: "30 sec" },
      { name: "Hanging", sets: 2, duration: "1 min" },
    ],
    // Day 7 - Rest
    [
      { name: "Hanging", sets: 1, duration: "1 min" },
      { name: "Cobra Stretch", sets: 2, duration: "30 sec" },
      { name: "Light walk", duration: "10 min" },
    ],
  ];

  // Create exercises for each workout type
  for (let i = 0; i < createdWorkoutTypes.length; i++) {
    const workoutType = createdWorkoutTypes[i];
    const exercises = exercisesByDay[i];

    await Promise.all(
      exercises.map(async (exercise, index) => {
        return await storage.createExercise({
          workoutTypeId: workoutType.id,
          name: exercise.name,
          sets: exercise.sets || null,
          reps: exercise.reps || null,
          duration: exercise.duration || null,
          dayOfWeek: i, // 0 = Sunday (Rest), 1 = Monday (Push), etc.
          orderIndex: index,
        });
      })
    );
  }

  // Preload mind exercises
  const mindExercises = [
    { name: "Box Breathing + Sense Drill", time: "05:40", duration: 15, orderIndex: 0 },
    { name: "Memory Palace Practice", time: "06:00", duration: 20, orderIndex: 1 },
    { name: "Brain Challenge (riddle/puzzle)", time: "08:00", duration: 10, orderIndex: 2 },
    { name: "Pattern Recognition Task", time: "12:00", duration: 10, orderIndex: 3 },
    { name: "Recall & Visualization", time: "16:00", duration: 15, orderIndex: 4 },
    { name: "Mental Map Review", time: "19:00", duration: 15, orderIndex: 5 },
    { name: "Mind Wind-Down", time: "21:30", duration: 10, orderIndex: 6 },
  ];

  await Promise.all(
    mindExercises.map(async (exercise) => {
      return await storage.createMindExercise({
        userId,
        name: exercise.name,
        time: exercise.time,
        duration: exercise.duration,
        orderIndex: exercise.orderIndex,
      });
    })
  );

  // Preload routines
  const routines = [
    // Morning routines
    { name: "Lemon & Honey Detox Drink", description: "Start the day with detox", type: "morning", orderIndex: 0 },
    { name: "Ice Cubes on Face", description: "Wake up and refresh", type: "morning", orderIndex: 1 },
    { name: "Face & Body Wash", description: "Clean and fresh start", type: "morning", orderIndex: 2 },
    { name: "Malai + Honey + Haldi Pack", description: "Natural face mask", type: "morning", orderIndex: 3 },
    { name: "Moisturizer + SPF 50+ sunscreen", description: "Protect your skin", type: "morning", orderIndex: 4 },
    
    // Night routines
    { name: "Face & Body Cleansing", description: "Clean off the day", type: "night", orderIndex: 0 },
    { name: "Face Serum", description: "Nourish your skin", type: "night", orderIndex: 1 },
    { name: "Moisturizer", description: "Hydrate overnight", type: "night", orderIndex: 2 },
    { name: "Milk & Potato Remedy", description: "For dark areas", type: "night", orderIndex: 3 },
    
    // Weekly routines
    { name: "Lip Scrub", description: "Tue/Thu/Sat", type: "weekly", orderIndex: 0 },
    { name: "Exfoliation", description: "Sun/Wed/Fri", type: "weekly", orderIndex: 1 },
    { name: "Ubtan Body Mask", description: "Tue/Thu/Sat", type: "weekly", orderIndex: 2 },
    { name: "Lemon & Baking Soda", description: "Mon/Fri", type: "weekly", orderIndex: 3 },
    { name: "Hair Oil Massage + Wash", description: "Wed/Sat/Thu/Sun", type: "weekly", orderIndex: 4 },
  ];

  await Promise.all(
    routines.map(async (routine) => {
      return await storage.createRoutine({
        userId,
        name: routine.name,
        description: routine.description,
        type: routine.type,
        orderIndex: routine.orderIndex,
      });
    })
  );

  // Preload dev goals
  const devGoals = [
    // Yearly goals
    { title: "2025 Full Stack Goal", description: "Master HTML, CSS, JS, React, Node, Mongo", type: "yearly", targetHours: 1000, orderIndex: 0 },
    
    // Monthly goals
    { title: "January React Mastery", description: "Complete React fundamentals and advanced concepts", type: "monthly", targetHours: 60, orderIndex: 0 },
    
    // Weekly goals
    { title: "Complete React Router tutorial", description: "Learn routing in React applications", type: "weekly", targetHours: 3, orderIndex: 0 },
    { title: "Solve 5 LeetCode problems", description: "Practice algorithmic thinking", type: "weekly", targetHours: 5, orderIndex: 1 },
    { title: "Build project component library", description: "Create reusable components", type: "weekly", targetHours: 8, orderIndex: 2 },
    { title: "Update GitHub portfolio", description: "Showcase recent projects", type: "weekly", targetHours: 2, orderIndex: 3 },
    
    // Daily goals
    { title: "DSA Practice (1-1.5h)", description: "Data structures and algorithms", type: "daily", targetHours: 1, orderIndex: 0 },
    { title: "LeetCode (30-45min)", description: "Coding practice", type: "daily", targetHours: 1, orderIndex: 1 },
    { title: "React/WebDev (1-1.5h)", description: "Frontend development", type: "daily", targetHours: 1, orderIndex: 2 },
    { title: "JS Practice (30-45min)", description: "JavaScript fundamentals", type: "daily", targetHours: 1, orderIndex: 3 },
    { title: "Project Building (1h)", description: "Work on personal projects", type: "daily", targetHours: 1, orderIndex: 4 },
    { title: "GitHub update/notes (15min)", description: "Document progress", type: "daily", targetHours: 0, orderIndex: 5 },
  ];

  await Promise.all(
    devGoals.map(async (goal) => {
      return await storage.createDevGoal({
        userId,
        title: goal.title,
        description: goal.description,
        type: goal.type,
        targetHours: goal.targetHours,
        currentHours: 0,
        completed: false,
        orderIndex: goal.orderIndex,
      });
    })
  );

  console.log("User data preloaded successfully");
}
