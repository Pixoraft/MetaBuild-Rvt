import { storage } from "../../../server/storage";

export async function preloadUserData(userId: string) {
  // Preload workout types - Two weekly plans
  const workoutTypes = [
    {
      userId,
      name: "30-Day Gripper & Forearm Vein Plan (Arm Workout Weekly)",
      isWeekly: true,
      maxTime: 30,
    },
    {
      userId,
      name: "Smart & Balanced 7-Day Full Body Workout Weekly",
      isWeekly: true,
      maxTime: 45,
    },
  ];

  // Create workout types
  const createdWorkoutTypes = await Promise.all(
    workoutTypes.map(async (workoutType) => {
      return await storage.createWorkoutType(workoutType);
    })
  );

  // Preload exercises for each workout type
  const exercisesByPlan = [
    // Plan 1: 30-Day Gripper & Forearm Vein Plan
    [
      // Day 0 - Sunday (Rest Day)
      [
        { name: "Hot/cold water contrast", duration: "5 min" },
        { name: "Stretch forearms, fingers, wrists", duration: "3 min" },
        { name: "Gentle hand circles", sets: 2, reps: 20 },
        { name: "Light towel twist (optional)", duration: "1 min" },
      ],
      // Day 1 - Monday (High-Volume Gripper)
      [
        { name: "Gripper Fast Reps", sets: 4, reps: 50 },
        { name: "Slow Squeeze Gripper", sets: 3, reps: 15 },
        { name: "Towel Twist (dry towel full power)", sets: 2, duration: "1 min" },
        { name: "Wrist Rotations (with bottle)", sets: 2, reps: 15 },
        { name: "Shake & Stretch", duration: "2 min" },
      ],
      // Day 2 - Tuesday (Strength + Isometrics)
      [
        { name: "Heavy Gripper (tight squeeze)", sets: 3, reps: 10 },
        { name: "Gripper Close-Hold", sets: 3, duration: "30 sec" },
        { name: "Pinch Grip Hold (book/brick)", sets: 3, duration: "30 sec" },
        { name: "Wrist Curl (bottle/brick)", sets: 3, reps: 15 },
        { name: "Reverse Curl", sets: 3, reps: 15 },
        { name: "Finger Wall Pushups", sets: 2, duration: "20 sec" },
        { name: "Stretch & Shake", duration: "2 min" },
      ],
      // Day 3 - Wednesday (Recovery + Light Pump)
      [
        { name: "Easy Gripper", sets: 2, reps: 30 },
        { name: "Towel Squeeze (light)", sets: 1, duration: "1 min" },
        { name: "Wrist Mobility Circles", duration: "2 min" },
        { name: "Finger Flex-Extend", sets: 1, reps: 50 },
        { name: "Salt water soak (hot)", duration: "5 min" },
        { name: "Forearm massage (optional)", duration: "3 min" },
      ],
      // Day 4 - Thursday (Mixed Monster Circuit)
      [
        { name: "Gripper Explosives", sets: 3, reps: 20 },
        { name: "Gripper Slow Hold", sets: 3, reps: 15 },
        { name: "Wrist Curl", sets: 3, reps: 15 },
        { name: "Reverse Curl", sets: 3, reps: 15 },
        { name: "Pinch Grip", sets: 3, duration: "30 sec" },
        { name: "Farmer Carry (bucket or bag)", sets: 3, duration: "1 min" },
        { name: "Towel Twists", sets: 2, duration: "1 min" },
        { name: "Shake + Stretch", duration: "2 min" },
      ],
      // Day 5 - Friday (Reverse Focus)
      [
        { name: "Rubber Band Finger Opens", sets: 3, reps: 20 },
        { name: "Wall Finger Push", sets: 3, reps: 15 },
        { name: "Reverse Wrist Curl", sets: 3, reps: 20 },
        { name: "Forearm Extensor Stretch", duration: "1 min each arm" },
        { name: "Light Gripper", sets: 2, reps: 20 },
        { name: "Shake out + hot water dip", duration: "3 min" },
      ],
      // Day 6 - Saturday (Max Test & Burnout)
      [
        { name: "Gripper Max Reps (record reps)", sets: 1, reps: 999 },
        { name: "Close & Hold", sets: 1, duration: "45 sec" },
        { name: "Farmer's Hold", sets: 1, duration: "1 min" },
        { name: "Pinch Hold", sets: 1, duration: "45 sec" },
        { name: "Bucket Walk", sets: 2, reps: 10 },
        { name: "Gripper to failure", sets: 1, reps: 999 },
        { name: "Finger pulse to failure", sets: 1, reps: 999 },
      ],
    ],
    // Plan 2: Smart & Balanced 7-Day Full Body Workout
    [
      // Day 0 - Sunday (Rest Day)
      [
        { name: "Hanging", sets: 1, duration: "1 min" },
        { name: "Cobra Stretch", sets: 2, duration: "30 sec" },
        { name: "Light walk", duration: "10 min" },
        { name: "Water, ORS, and protein shake", duration: "optional" },
      ],
      // Day 1 - Monday (Push)
      [
        { name: "Normal Push-Ups", sets: 4, reps: 25 },
        { name: "Incline Push-Ups", sets: 3, reps: 25 },
        { name: "Pike Push-Ups", sets: 3, reps: 15 },
        { name: "Diamond Push-Ups", sets: 2, reps: 15 },
        { name: "Bench Dips", sets: 3, reps: 25 },
        { name: "Russian Twists", sets: 3, reps: 30 },
        { name: "Plank", duration: "5 min" },
      ],
      // Day 2 - Tuesday (Pull)
      [
        { name: "Pull-Ups / Assisted", sets: 4, reps: 12 },
        { name: "Towel Rows", sets: 3, reps: 20 },
        { name: "Towel Bicep Curls", sets: 3, reps: 20 },
        { name: "Reverse Curls", sets: 3, reps: 15 },
        { name: "Gripper Fast", sets: 3, reps: 40 },
        { name: "Farmer Hold", sets: 2, duration: "45 sec" },
        { name: "Wrist Rolls", sets: 2, reps: 20 },
      ],
      // Day 3 - Wednesday (Legs)
      [
        { name: "Squats", sets: 4, reps: 25 },
        { name: "Jump Squats", sets: 3, reps: 20 },
        { name: "Lunges", sets: 3, reps: 20 },
        { name: "Calf Raises", sets: 4, reps: 30 },
        { name: "Wall Sit", sets: 2, duration: "45 sec" },
        { name: "Broad Jumps", sets: 2, reps: 15 },
        { name: "High Knees", sets: 2, reps: 30 },
      ],
      // Day 4 - Thursday (Core + Abs)
      [
        { name: "Crunches", sets: 3, reps: 25 },
        { name: "Leg Raises", sets: 3, reps: 25 },
        { name: "Mountain Climbers", sets: 3, reps: 30 },
        { name: "Plank", sets: 3, duration: "1 min" },
        { name: "Side Plank", sets: 2, duration: "1 min each" },
        { name: "V-Ups", sets: 3, reps: 20 },
        { name: "Russian Twists", sets: 3, reps: 30 },
      ],
      // Day 5 - Friday (Power + Explosive + Grip Veins)
      [
        { name: "Clap Pushups", sets: 3, reps: 15 },
        { name: "Skipping", duration: "5 min" },
        { name: "High Knees", sets: 3, reps: 30 },
        { name: "Towel Bicep Curls", sets: 2, reps: 25 },
        { name: "Wrist Rolls", sets: 2, reps: 20 },
        { name: "Gripper Slow Squeeze", sets: 2, reps: 15 },
        { name: "Hanging", sets: 3, duration: "1 min" },
      ],
      // Day 6 - Saturday (BONUS Stretch + Pump Day)
      [
        { name: "Archer Pushups", sets: 2, reps: 12 },
        { name: "Incline Pushups", sets: 2, reps: 20 },
        { name: "Squats", sets: 2, reps: 25 },
        { name: "Plank", sets: 2, duration: "1 min" },
        { name: "Neck + Spine + Toe Touch Stretch", sets: 3, duration: "30 sec" },
        { name: "Hanging", sets: 2, duration: "1 min" },
      ],
    ],
  ];

  // Create exercises for each workout type
  for (let planIndex = 0; planIndex < createdWorkoutTypes.length; planIndex++) {
    const workoutType = createdWorkoutTypes[planIndex];
    const exercisesByDay = exercisesByPlan[planIndex];

    // Create exercises for each day of the week (0-6)
    for (let dayIndex = 0; dayIndex < exercisesByDay.length; dayIndex++) {
      const exercises = exercisesByDay[dayIndex];
      
      await Promise.all(
        exercises.map(async (exercise, exerciseIndex) => {
          return await storage.createExercise({
            workoutTypeId: workoutType.id,
            name: exercise.name,
            sets: exercise.sets || null,
            reps: exercise.reps || null,
            duration: exercise.duration || null,
            dayOfWeek: dayIndex, // 0 = Sunday, 1 = Monday, etc.
            orderIndex: exerciseIndex,
          });
        })
      );
    }
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
