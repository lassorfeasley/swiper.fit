import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const hasOpenAIKey = !!OPENAI_KEY;
const openai = new OpenAI({
  apiKey: OPENAI_KEY || 'demo-key',
});

// Initialize Supabase
const SUPABASE_URL = 'https://tdevpmxmvrgouozsgplu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkZXZwbXhtdnJnb3VvenNncGx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2ODc0MTksImV4cCI6MjA2MzI2MzQxOX0.XjatUG82rA1rQDIvAfvlJ815xJaAjj2GZJG7mfrdxl0';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });

// Database analysis functions
const analyzeUserProgress = async (db, userId) => {
  try {
    console.log('🔍 Database Debug - Starting analysis for user:', userId);

    // Always initialize safe defaults
    let workouts = [];
    let workoutExercises = [];
    let sets = [];

    // Get user's workout history
    const { data: workoutsData, error: workoutError } = await db
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (workoutError) throw workoutError;
    workouts = workoutsData || [];
    console.log('🔍 Database Debug - Found workouts:', workouts.length);
    console.log('🔍 Database Debug - Sample workout:', workouts[0]);

    // Get workout exercises and sets
    if (workouts.length > 0) {
      const workoutIds = workouts.map(w => w.id);
      console.log('🔍 Database Debug - Looking for exercises in workout IDs:', workoutIds);

      const { data: weData, error: exerciseError } = await db
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds);

      if (exerciseError) throw exerciseError;
      workoutExercises = weData || [];
      console.log('🔍 Database Debug - Found workout exercises:', workoutExercises.length);
      console.log('🔍 Database Debug - Sample workout exercise:', workoutExercises[0]);

      if (workoutExercises.length > 0) {
        const workoutExerciseIds = workoutExercises.map(we => we.id);
        console.log('🔍 Database Debug - Looking for sets in workout exercise IDs:', workoutExerciseIds);

        const { data: setsData, error: setsError } = await db
          .from('sets')
          .select('*')
          .in('workout_exercise_id', workoutExerciseIds);

        if (setsError) throw setsError;
        sets = setsData || [];
        console.log('🔍 Database Debug - Found sets:', sets.length);
        console.log('🔍 Database Debug - Sample set:', sets[0]);
      } else {
        console.log('🔍 Database Debug - No workout exercises found');
        // Fallback: derive from routine_exercises and routine_sets via the workout's routine_id
        const routineIds = Array.from(new Set(workouts.map(w => w.routine_id).filter(Boolean)));
        if (routineIds.length) {
          const { data: routineExerciseRows, error: reErr } = await db
            .from('routine_exercises')
            .select('id, routine_id, exercises!fk_routine_exercises__exercises(name), routine_sets!fk_routine_sets__routine_exercises(id)')
            .in('routine_id', routineIds);
          if (reErr) throw reErr;
          // Create synthetic workoutExercises list (one per routine exercise, not tied to workout id)
          workoutExercises = (routineExerciseRows || []).map(re => ({
            id: re.id,
            workout_id: null,
            exercise_id: null,
            exercises: { name: re.exercises?.name || 'Exercise' },
          }));
          // Create synthetic sets list based on routine_sets counts
          sets = [];
          (routineExerciseRows || []).forEach(re => {
            const count = (re.routine_sets || []).length;
            for (let i = 0; i < count; i++) {
              sets.push({ id: `${re.id}-rs-${i}`, workout_exercise_id: re.id });
            }
          });
          console.log('🔍 Fallback - routine_exercises found:', routineExerciseRows?.length || 0, 'synthetic sets:', sets.length);
        }
      }
    } else {
      console.log('🔍 Database Debug - No workouts found');
    }

    return { workouts, workoutExercises, sets };
  } catch (error) {
    console.error('Database analysis error:', error);
    throw error;
  }
};

const analyzeExerciseProgress = async (db, userId, exerciseName) => {
  try {
    // Find exercise by name
    const { data: exercises, error: exerciseError } = await db
      .from('exercises')
      .select('*')
      .ilike('name', `%${exerciseName}%`);

    if (exerciseError || !exercises.length) {
      return { error: 'Exercise not found' };
    }

    const exerciseId = exercises[0].id;

    // Get workout exercises for this specific exercise
    const { data: workoutExercises, error: weError } = await db
      .from('workout_exercises')
      .select('*')
      .eq('exercise_id', exerciseId);

    if (weError) throw weError;

    // Filter by user workouts
    const workoutIds = workoutExercises.map(we => we.workout_id);
    const { data: userWorkouts, error: workoutError } = await db
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .in('id', workoutIds);

    if (workoutError) throw workoutError;

    // Filter workout exercises to only include user's workouts
    const userWorkoutIds = userWorkouts.map(w => w.id);
    const filteredWorkoutExercises = workoutExercises.filter(we => 
      userWorkoutIds.includes(we.workout_id)
    );

    // Get sets data for these workout exercises
    const { data: sets, error: setsError } = await db
      .from('sets')
      .select('*')
      .in('workout_exercise_id', filteredWorkoutExercises.map(we => we.id));

    if (setsError) throw setsError;

    return { 
      exercises, 
      workoutExercises: filteredWorkoutExercises, 
      sets,
      userWorkouts 
    };
  } catch (error) {
    console.error('Exercise analysis error:', error);
    throw error;
  }
};

const generateProgressInsights = (data) => {
  const insights = {
    totalWorkouts: data.workouts?.length || 0,
    totalExercises: data.workoutExercises?.length || 0,
    totalSets: data.sets?.length || 0,
    workoutFrequency: 0,
    strengthTrends: [],
    volumeAnalysis: {},
    recommendations: []
  };

  if (data.workouts && data.workouts.length > 0) {
    // Calculate workout frequency
    const firstWorkout = new Date(data.workouts[data.workouts.length - 1].created_at);
    const lastWorkout = new Date(data.workouts[0].created_at);
    const daysDiff = (lastWorkout - firstWorkout) / (1000 * 60 * 60 * 24);
    insights.workoutFrequency = (data.workouts.length / daysDiff) * 7; // workouts per week

    // Analyze strength trends
    if (data.sets && data.sets.length > 0) {
      const exerciseGroups = {};
      data.sets.forEach(set => {
        const exerciseId = set.workout_exercise_id;
        if (!exerciseGroups[exerciseId]) {
          exerciseGroups[exerciseId] = [];
        }
        exerciseGroups[exerciseId].push({
          weight: set.weight,
          reps: set.reps,
          date: set.created_at
        });
      });

      Object.values(exerciseGroups).forEach(exerciseSets => {
        if (exerciseSets.length > 1) {
          const sortedSets = exerciseSets.sort((a, b) => new Date(a.date) - new Date(b.date));
          const firstSet = sortedSets[0];
          const lastSet = sortedSets[sortedSets.length - 1];
          
          if (lastSet.weight > firstSet.weight) {
            insights.strengthTrends.push({
              exercise: 'Exercise',
              improvement: `${lastSet.weight - firstSet.weight} lbs`,
              period: `${Math.round((new Date(lastSet.date) - new Date(firstSet.date)) / (1000 * 60 * 60 * 24))} days`
            });
          }
        }
      });
    }
  }

  return insights;
};

// Fetch a concise summary of the user's most recent workouts (read-only)
const getRecentWorkoutsSummary = async (db, userId, limit = 3) => {
  // Always return a structured object for safety
  const result = {
    workouts: [],
  };

  // 1) Recent workouts
  const { data: recent, error: recentErr } = await db
    .from('workouts')
    .select('id, workout_name, created_at, duration_seconds, last_workout_exercise_id, routine_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (recentErr) throw recentErr;
  result.workouts = recent || [];

  if (!result.workouts.length) return result;

  // 2) Exercises for these workouts
  const workoutIds = result.workouts.map(w => w.id);
  const { data: we, error: weErr } = await db
    .from('workout_exercises')
    .select('id, workout_id, exercise_id, exercises(name)')
    .in('workout_id', workoutIds);
  if (weErr) throw weErr;
  const workoutIdToExercises = {};
  (we || []).forEach(row => {
    if (!workoutIdToExercises[row.workout_id]) workoutIdToExercises[row.workout_id] = [];
    workoutIdToExercises[row.workout_id].push({
      workoutExerciseId: row.id,
      name: row.exercises?.name || 'Exercise',
    });
  });

  // 3) Sets for those workout_exercises
  const weIds = (we || []).map(r => r.id);
  let sets = [];
  if (weIds.length) {
    const { data: setsData, error: setsErr } = await db
      .from('sets')
      .select('id, workout_exercise_id, reps, weight')
      .in('workout_exercise_id', weIds);
    if (setsErr) throw setsErr;
    sets = setsData || [];
  }
  const weIdToSetCount = {};
  sets.forEach(s => {
    weIdToSetCount[s.workout_exercise_id] = (weIdToSetCount[s.workout_exercise_id] || 0) + 1;
  });

  // 3b) Fallback: template-based set counts from routine_sets when no logged sets are found
  const routineIds = Array.from(new Set((result.workouts || []).map(w => w.routine_id).filter(Boolean)));
  let routineIdToSummary = {};
  if (routineIds.length) {
    const { data: reRows, error: reErr } = await db
      .from('routine_exercises')
      .select('routine_id, exercises!fk_routine_exercises__exercises(name), routine_sets!fk_routine_sets__routine_exercises(id)')
      .in('routine_id', routineIds);
    if (!reErr && reRows) {
      routineIds.forEach(rid => {
        const rows = reRows.filter(r => r.routine_id === rid);
        const names = rows.map(r => r.exercises?.name).filter(Boolean);
        const setCount = rows.reduce((sum, r) => sum + ((r.routine_sets || []).length), 0);
        routineIdToSummary[rid] = { names, setCount };
      });
    }
  }

  // 4) Attach simple summaries to each workout
  result.workouts = result.workouts.map(w => {
    const exs = workoutIdToExercises[w.id] || [];
    let totalSets = exs.reduce((sum, e) => sum + (weIdToSetCount[e.workoutExerciseId] || 0), 0);
    let topExercises = exs.slice(0, 3).map(e => e.name);
    if (totalSets === 0 && w.routine_id && routineIdToSummary[w.routine_id]) {
      totalSets = routineIdToSummary[w.routine_id].setCount || 0;
      if (topExercises.length === 0) {
        topExercises = (routineIdToSummary[w.routine_id].names || []).slice(0, 3);
      }
    }
    return {
      ...w,
      exerciseCount: exs.length,
      totalSets,
      topExercises,
    };
  });

  return result;
};

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array is required' });
    }

    // Focused system prompt for fitness analysis
    const systemPrompt = `You are Swiper, a specialized AI fitness analyst focused on analyzing workout data, performance trends, and fitness progress.

Your expertise is in:

1. **Performance Analysis**: Analyzing workout data, strength progress, and fitness metrics
2. **Progress Tracking**: Identifying trends, plateaus, and improvement areas
3. **Data Insights**: Interpreting workout patterns, volume analysis, and consistency metrics
4. **Goal Assessment**: Evaluating progress toward fitness goals and milestones
5. **Recommendations**: Suggesting data-driven improvements based on analysis

Your responses should:
- Focus on analyzing and interpreting fitness data
- Provide insights about performance trends and patterns
- Suggest specific metrics to track for better analysis
- Recommend data visualization approaches (charts, graphs)
- Be analytical yet encouraging
- Ask clarifying questions about what data is available

When analyzing fitness data, provide:
- Performance insights and trends
- Specific metrics to focus on
- Chart and visualization suggestions
- Data collection recommendations
- Progress assessment and goal tracking advice

Keep responses focused on analysis and data interpretation rather than creating new routines or exercises.`;

    try {
      // Check if user is asking for data analysis
      const lastMessage = messages[messages.length - 1]?.content || '';
      const text = lastMessage.toLowerCase();
      const isRecentQuery = /latest|recent|last workout|last workouts|most recent/.test(text);
      const isGeneralAnalysis = /progress|analysis|overview|workout history|see my|my data|my workouts/.test(text);
      const userId = req.body.userId;
      const accessToken = req.body.accessToken;
      
      // Debug logging
      console.log('API Debug - Received userId:', userId);
      console.log('API Debug - Request body:', req.body);
      console.log('API Debug - User authentication status:', !!userId);
      
      let analysisData = null;
      let responseContent = '';
      
      // If no valid user ID, provide demo analysis
      if (!userId || userId === 'demo-user' || !userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        responseContent = `I'd love to analyze your fitness data! However, I need access to your workout database to provide personalized insights.

**Current Status:**
${!userId ? '❌ No user ID provided' : 
  userId === 'demo-user' ? '❌ Demo mode - not logged in' : 
  '❌ Invalid user ID format - authentication issue'}

**To get started:**
1. Make sure you're logged into your SwiperFit account
2. Complete a few workouts to generate data
3. Ask me to analyze your progress again

**What I can analyze once you have data:**
- Workout frequency and consistency
- Strength progress over time
- Exercise performance trends
- Volume and intensity patterns
- Goal achievement metrics

**Example questions you can ask:**
- "How have my chest presses been going?"
- "Show me my overall progress"
- "Analyze my workout consistency"

**Debug Info:**
- User ID received: ${userId || 'none'}
- UUID format valid: ${userId && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i) ? '✅ Yes' : '❌ No'}

Would you like me to help you set up tracking for specific metrics, or do you have workout data ready to analyze?`;
        
        res.json({ 
          content: responseContent,
          hasData: false
        });
        return;
      }

      // If we have an access token, set it on the Supabase client for row-level security context
      let authScopedSupabase = supabase;
      if (accessToken) {
        try {
          authScopedSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
            auth: { persistSession: false },
          });
        } catch (e) {
          // Fallback silently if we cannot scope
        }
      }

      // Analyze specific exercise progress
      if (text.includes('chest press') || 
          text.includes('bench press') ||
          text.includes('how have') ||
          text.includes('progress')) {
        
        const exerciseName = lastMessage.toLowerCase().includes('chest') ? 'chest press' : 'bench press';
        analysisData = await analyzeExerciseProgress(authScopedSupabase, userId, exerciseName);
        
        if (analysisData.error) {
          responseContent = `I couldn't find data for ${exerciseName} in your workout history. This could mean:
          
1. You haven't logged any ${exerciseName} workouts yet
2. The exercise might be named differently in your database
3. You need to complete some workouts first

To get started, try completing a few workouts with ${exerciseName} and then ask me to analyze your progress again!`;
        } else {
          const insights = generateProgressInsights(analysisData);
          responseContent = `Here's your ${exerciseName} progress analysis:

**Workout Summary:**
- Total ${exerciseName} sessions: ${insights.totalWorkouts}
- Total sets completed: ${insights.totalSets}

**Progress Insights:**
${insights.strengthTrends.length > 0 ? 
  insights.strengthTrends.map(trend => 
    `- Strength improvement: ${trend.improvement} over ${trend.period}`
  ).join('\n') : 
  '- Not enough data yet to identify strength trends'
}

**Recommendations:**
- Continue tracking your ${exerciseName} performance consistently
- Focus on progressive overload (gradually increasing weight)
- Monitor your rep ranges and rest periods
- Consider tracking additional metrics like RPE (Rate of Perceived Exertion)

Would you like me to analyze any other exercises or provide more detailed insights?`;
        }
      }
      // Recent workout(s) summary (prioritize over general analysis)
      else if (isRecentQuery) {
        const recent = await getRecentWorkoutsSummary(authScopedSupabase, userId, 3);
        if (!recent.workouts.length) {
          responseContent = `I couldn't find any completed workouts yet. Once you log a workout, I'll summarize it here.`;
        } else {
          const lines = recent.workouts.map((w, idx) => {
            const date = new Date(w.created_at).toLocaleDateString();
            const durationMin = w.duration_seconds ? Math.round(w.duration_seconds / 60) : null;
            const durationText = durationMin ? `${durationMin} min` : 'n/a';
            const exText = w.exerciseCount ? `${w.exerciseCount} exercises` : '0 exercises';
            const setText = `${w.totalSets} sets`;
            const top = w.topExercises && w.topExercises.length ? ` (e.g., ${w.topExercises.join(', ')})` : '';
            return `#${idx + 1} ${w.workout_name || 'Workout'} on ${date} — ${exText}, ${setText}, duration ${durationText}${top}`;
          }).join('\n');
          responseContent = `Here are your recent workouts:\n\n${lines}\n\nWant me to analyze trends across these sessions or dive into a specific exercise?`;
        }
        analysisData = { recent: true };
      }
      // General progress analysis
      else if (isGeneralAnalysis) {
        
        analysisData = await analyzeUserProgress(authScopedSupabase, userId);
        const insights = generateProgressInsights(analysisData);
        
        responseContent = `Here's your overall fitness progress analysis:

**Workout Summary:**
- Total workouts completed: ${insights.totalWorkouts}
- Total exercises performed: ${insights.totalExercises}
- Total sets completed: ${insights.totalSets}
- Average workouts per week: ${insights.workoutFrequency.toFixed(1)}

**Strength Trends:**
${insights.strengthTrends.length > 0 ? 
  insights.strengthTrends.map(trend => 
    `- ${trend.exercise}: ${trend.improvement} over ${trend.period}`
  ).join('\n') : 
  '- Continue tracking to see strength improvements'
}

**Recommendations:**
- Maintain consistency: aim for ${Math.max(3, Math.ceil(insights.workoutFrequency))} workouts per week
- Focus on progressive overload in your main lifts
- Track your performance metrics consistently
- Consider setting specific strength or endurance goals

Would you like me to dive deeper into any specific exercise or aspect of your training?`;
      }
      // Default AI response
      else {
        // If no OpenAI key, provide a graceful mock response instead of 500
        if (!hasOpenAIKey) {
          responseContent = `I can analyze your workout data and trends. To enable live AI responses, add an OpenAI API key.\n\nIn the meantime, ask me analysis-focused questions like:\n- \"Analyze my progress\"\n- \"How are my chest presses trending?\"\n- \"What should I track to improve strength?\"`;
        } else {
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: systemPrompt
              },
              ...messages.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            ],
            max_tokens: 800,
            temperature: 0.7,
          });
          responseContent = completion.choices[0].message.content;
        }
      }

      res.json({ 
        content: responseContent,
        hasData: !!analysisData
      });
    } catch (openaiError) {
      if (
        openaiError.message.includes('quota') ||
        openaiError.message.includes('429') ||
        openaiError.code === 'invalid_api_key' ||
        openaiError.status === 401
      ) {
        // Provide a helpful mock response when quota is exceeded
        const lastMessage = messages[messages.length - 1]?.content || '';
        
        let mockResponse = "I'm Swiper, your AI fitness assistant! I'm here to help with workouts, exercises, and fitness advice.";
        
        if (lastMessage.toLowerCase().includes('workout') || lastMessage.toLowerCase().includes('routine')) {
          mockResponse = `I'd love to help you analyze your workout data! To provide meaningful insights, I'd need to know:

**What data do you have available?**
- Workout frequency and duration
- Exercise performance (weights, reps, sets)
- Progress over time
- Goal metrics (strength, endurance, etc.)

**Analysis I can help with:**
- Performance trends and patterns
- Progress tracking and plateaus
- Volume and intensity analysis
- Goal achievement assessment

**Data visualization suggestions:**
- Progress charts for key lifts
- Volume tracking over time
- Consistency metrics
- Performance heatmaps

Note: I'm currently in demo mode due to API limits. To get personalized AI responses, please check your OpenAI billing at platform.openai.com/account/billing`;
        } else if (lastMessage.toLowerCase().includes('exercise') || lastMessage.toLowerCase().includes('form')) {
          mockResponse = `I can help analyze your exercise performance data! To provide insights, I'd need to know:

**Performance metrics to track:**
- Weight progression over time
- Rep ranges and set completion
- Form consistency scores
- Rest periods and recovery

**Analysis I can offer:**
- Strength progression trends
- Performance plateaus identification
- Volume vs. intensity analysis
- Recovery pattern assessment

**Data visualization recommendations:**
- Strength progression charts
- Volume tracking graphs
- Performance consistency metrics
- Recovery pattern analysis

Note: I'm currently in demo mode due to API limits. To get personalized AI responses, please check your OpenAI billing at platform.openai.com/account/billing`;
        } else {
          mockResponse = `I'm Swiper, your AI fitness analyst! I specialize in analyzing workout data and performance trends.

**What I can analyze:**
- Workout performance and progress
- Strength and endurance trends
- Volume and intensity patterns
- Goal achievement metrics
- Consistency and adherence data

**To get started, tell me:**
- What fitness data you're tracking
- Your specific goals and metrics
- What insights you're looking for
- Any performance patterns you've noticed

**I can help you:**
- Interpret your workout data
- Identify trends and plateaus
- Suggest metrics to track
- Recommend data visualization approaches
- Assess progress toward goals

Note: I'm currently in demo mode due to API limits. To get personalized AI responses, please check your OpenAI billing at platform.openai.com/account/billing`;
        }
        
        res.json({ content: mockResponse });
      } else {
        throw openaiError;
      }
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ 
      message: 'Error generating response',
      error: error.message 
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Swiper API is running' });
});

// Debug endpoint to examine database structure
app.get('/api/debug/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('🔍 Debug endpoint called for user:', userId);
    
    // Check workouts
    const { data: workouts, error: workoutError } = await supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userId)
      .limit(5);
    
    if (workoutError) throw workoutError;
    
    // Check workout_exercises - try different approaches
    let workoutExercises = [];
    let workoutExercisesError = null;
    
    if (workouts && workouts.length > 0) {
      const workoutIds = workouts.map(w => w.id);
      console.log('🔍 Debug - Looking for exercises in workout IDs:', workoutIds);
      
      // Try the original query
      const { data: exercises, error: exerciseError } = await supabase
        .from('workout_exercises')
        .select('*')
        .in('workout_id', workoutIds);
      
      if (exerciseError) {
        workoutExercisesError = exerciseError;
        console.log('🔍 Debug - Error with workout_exercises query:', exerciseError);
      } else {
        workoutExercises = exercises || [];
        console.log('🔍 Debug - Found workout exercises:', workoutExercises.length);
      }
      
      // Also try a broader search to see if there are any workout_exercises at all
      const { data: allExercises, error: allExercisesError } = await supabase
        .from('workout_exercises')
        .select('*')
        .limit(10);
      
      console.log('🔍 Debug - Total workout_exercises in table:', allExercises?.length || 0);
      if (allExercisesError) {
        console.log('🔍 Debug - Error querying all workout_exercises:', allExercisesError);
      }
      
      // Check if there are other exercise-related tables
      console.log('🔍 Debug - Checking for other exercise tables...');
      
      // Try routine_exercises table
      const { data: routineExercises, error: routineExercisesError } = await supabase
        .from('routine_exercises')
        .select('*')
        .limit(5);
      
      if (routineExercisesError) {
        console.log('🔍 Debug - Error querying routine_exercises:', routineExercisesError);
      } else {
        console.log('🔍 Debug - Found routine_exercises:', routineExercises?.length || 0);
        if (routineExercises && routineExercises.length > 0) {
          console.log('🔍 Debug - Sample routine exercise:', routineExercises[0]);
        }
      }
      
      // Check if exercises are stored directly in workouts table
      console.log('🔍 Debug - Checking workout table structure...');
      if (workouts && workouts.length > 0) {
        const sampleWorkout = workouts[0];
        console.log('🔍 Debug - Sample workout keys:', Object.keys(sampleWorkout));
        console.log('🔍 Debug - Sample workout values:', sampleWorkout);
      }
      
      // Try to find workout_exercises by the last_workout_exercise_id from the workout
      if (workouts && workouts.length > 0) {
        const lastExerciseId = workouts[0].last_workout_exercise_id;
        if (lastExerciseId) {
          console.log('🔍 Debug - Looking for workout exercise with ID:', lastExerciseId);
          const { data: lastExercise, error: lastExerciseError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('id', lastExerciseId);
          
          if (lastExerciseError) {
            console.log('🔍 Debug - Error finding last exercise:', lastExerciseError);
          } else {
            console.log('🔍 Debug - Last exercise found:', lastExercise);
          }
        }
        
        // Try a different approach - query workout_exercises directly for each workout
        for (let i = 0; i < Math.min(workouts.length, 3); i++) {
          const workout = workouts[i];
          console.log(`🔍 Debug - Checking workout ${i + 1}:`, workout.id);
          
          const { data: workoutEx, error: workoutExError } = await supabase
            .from('workout_exercises')
            .select('*')
            .eq('workout_id', workout.id);
          
          if (workoutExError) {
            console.log(`🔍 Debug - Error querying workout ${i + 1}:`, workoutExError);
          } else {
            console.log(`🔍 Debug - Workout ${i + 1} exercises:`, workoutEx?.length || 0);
            if (workoutEx && workoutEx.length > 0) {
              console.log(`🔍 Debug - Sample exercise:`, workoutEx[0]);
            }
          }
        }
      }
    }
    
    // Check sets
    let sets = [];
    let setsError = null;
    
    if (workoutExercises.length > 0) {
      const workoutExerciseIds = workoutExercises.map(we => we.id);
      const { data: setsData, error: setsError } = await supabase
        .from('sets')
        .select('*')
        .in('workout_exercise_id', workoutExerciseIds);
      
      if (setsError) {
        setsError = setsError;
        console.log('🔍 Debug - Error with sets query:', setsError);
      } else {
        sets = setsData || [];
        console.log('🔍 Debug - Found sets:', sets.length);
      }
    }
    
    res.json({
      userId,
      workouts: {
        count: workouts?.length || 0,
        sample: workouts?.[0] || null,
        error: workoutError
      },
      workoutExercises: {
        count: workoutExercises.length,
        sample: workoutExercises[0] || null,
        error: workoutExercisesError
      },
      sets: {
        count: sets.length,
        sample: sets[0] || null,
        error: setsError
      },
      debug: {
        totalWorkoutExercises: 'See console logs',
        workoutIds: workouts?.map(w => w.id) || []
      }
    });
    
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Swiper API server running on port ${PORT}`);
  console.log(`📱 Chat endpoint: http://localhost:${PORT}/api/chat`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});
