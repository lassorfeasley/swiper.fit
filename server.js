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
const getAccessibleUserIds = async (db, userId) => {
  const ids = new Set([userId]);
  try {
    // account_shares: owner_user_id shared with delegate
    const { data: shares1 } = await db
      .from('account_shares')
      .select('owner_user_id, delegate_user_id, shared_with')
      .or(`delegate_user_id.eq.${userId},shared_with.eq.${userId}`);
    (shares1 || []).forEach(r => ids.add(r.owner_user_id));
    // legacy shares table
    const { data: shares2 } = await db
      .from('shares')
      .select('owner_user_id, delegate_user_id')
      .eq('delegate_user_id', userId);
    (shares2 || []).forEach(r => ids.add(r.owner_user_id));
  } catch (e) {
    // ignore share lookup errors; fallback to self id
  }
  return Array.from(ids);
};

const findExerciseByName = async (db, userId, name) => {
  const accessibleUserIds = await getAccessibleUserIds(db, userId);
  const term = name.trim().toLowerCase();
  // Try exact ilike, then loose contains
  const { data: ex1 } = await db
    .from('exercises')
    .select('id, name')
    .in('user_id', accessibleUserIds)
    .ilike('name', term);
  if (ex1 && ex1.length) return ex1[0];
  const { data: ex2 } = await db
    .from('exercises')
    .select('id, name')
    .in('user_id', accessibleUserIds)
    .ilike('name', `%${term}%`)
    .limit(1);
  return ex2 && ex2.length ? ex2[0] : null;
};
const analyzeUserProgress = async (db, userId) => {
  try {
    console.log('🔍 Database Debug - Starting analysis for user:', userId);

    // Always initialize safe defaults
    let workouts = [];
    let workoutExercises = [];
    let sets = [];

    // Get user's workout history
    const accessibleUserIds = await getAccessibleUserIds(db, userId);
    const { data: workoutsData, error: workoutError } = await db
      .from('workouts')
      .select('*')
      .in('user_id', accessibleUserIds)
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
        // Try fetching sets directly by workout_id (your schema has sets.workout_id)
        const { data: setsViaWorkout, error: setsByWorkoutErr } = await db
          .from('sets')
          .select('*')
          .in('workout_id', workoutIds)
          .eq('user_id', userId);
        if (setsByWorkoutErr) throw setsByWorkoutErr;
        sets = setsViaWorkout || [];
        console.log('🔍 Direct sets by workout_id:', sets.length);
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
          if (!sets.length) sets = [];
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

    // Get sets for this exercise (works even if workout_exercises is empty)
    const accessibleUserIds = await getAccessibleUserIds(db, userId);
    const { data: sets, error: setsError } = await db
      .from('sets')
      .select('id, workout_id, exercise_id, reps, weight, created_at')
      .eq('exercise_id', exerciseId)
      .in('user_id', accessibleUserIds);
    if (setsError) throw setsError;

    // Retrieve involved workouts for context
    const workoutIds = Array.from(new Set((sets || []).map(s => s.workout_id).filter(Boolean)));
    let userWorkouts = [];
    if (workoutIds.length) {
      const { data: uw, error: workoutError } = await db
        .from('workouts')
        .select('*')
        .in('user_id', accessibleUserIds)
        .in('id', workoutIds);
      if (workoutError) throw workoutError;
      userWorkouts = uw || [];
    }

    return { exercises, workoutExercises: [], sets, userWorkouts };
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
      const groups = {};
      data.sets.forEach(s => {
        const key = s.exercise_id || s.workout_exercise_id || 'unknown';
        if (!groups[key]) groups[key] = [];
        groups[key].push({ weight: Number(s.weight) || 0, reps: Number(s.reps) || 0, date: s.created_at });
      });
      Object.values(groups).forEach(arr => {
        if (arr.length < 2) return;
        const sorted = arr.sort((a,b) => new Date(a.date) - new Date(b.date));
        const first = sorted[0];
        const last = sorted[sorted.length-1];
        if ((last.weight || 0) > (first.weight || 0)) {
          insights.strengthTrends.push({
            exercise: 'Exercise',
            improvement: `${(last.weight||0) - (first.weight||0)} lbs`,
            period: `${Math.round((new Date(last.date) - new Date(first.date)) / (1000*60*60*24))} days`
          });
        }
      });
    }
  }

  return insights;
};

// Generate HTML for Open Graph images
const generateOGImageHTML = ({ workoutName, ownerName, exerciseCount, setCount, date, duration }) => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Workout Preview</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 1200px;
      height: 630px;
      font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    
    .container {
      width: 1000px;
      height: 500px;
      background: white;
      border-radius: 20px;
      padding: 60px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
      position: relative;
    }
    
    .header {
      text-align: center;
    }
    
    .logo {
      width: 60px;
      height: 60px;
      background: #059669;
      border-radius: 12px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
    }
    
    .title {
      font-size: 48px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 12px;
      line-height: 1.1;
    }
    
    .subtitle {
      font-size: 24px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .stats {
      display: flex;
      justify-content: space-around;
      margin: 40px 0;
    }
    
    .stat {
      text-align: center;
      flex: 1;
    }
    
    .stat-number {
      font-size: 36px;
      font-weight: 700;
      color: #059669;
      display: block;
      margin-bottom: 8px;
    }
    
    .stat-label {
      font-size: 18px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 20px;
      border-top: 2px solid #f3f4f6;
    }
    
    .date {
      font-size: 20px;
      color: #6b7280;
      font-weight: 500;
    }
    
    .brand {
      font-size: 20px;
      color: #059669;
      font-weight: 600;
    }
    
    .duration {
      font-size: 20px;
      color: #6b7280;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">S</div>
      <h1 class="title">${workoutName}</h1>
      <p class="subtitle">by ${ownerName}</p>
    </div>
    
    <div class="stats">
      <div class="stat">
        <span class="stat-number">${exerciseCount}</span>
        <span class="stat-label">Exercises</span>
      </div>
      <div class="stat">
        <span class="stat-number">${setCount}</span>
        <span class="stat-label">Sets</span>
      </div>
      ${duration ? `
      <div class="stat">
        <span class="stat-number">${duration}</span>
        <span class="stat-label">Minutes</span>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <span class="date">${date}</span>
      <span class="brand">SwiperFit</span>
      ${duration ? `<span class="duration">${duration} min</span>` : ''}
    </div>
  </div>
</body>
</html>`;
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

    // Focused system prompt for fitness analysis (never ask user for data; fetch from DB; troubleshoot gaps)
    const systemPrompt = `You are Swiper, a specialized AI fitness analyst. You must proactively query the user's workout database (via the backend) to answer questions. Do not ask the user to provide data that is available in the database. If data needed for an answer is missing or access is blocked, clearly explain what is missing and provide precise troubleshooting steps (e.g., which tables/columns, likely RLS/policy issues, or that no rows exist yet). Never request the user to paste data.

Your expertise is in:
1) Performance analysis (weights, reps, volume, intensity, durations)
2) Progress tracking and plateaus
3) Workout frequency/consistency and adherence
4) Data-backed recommendations

Response guidelines:
- Base conclusions on actual database reads returned by the API.
- Quantify with concrete numbers, dates, and simple aggregates when possible.
- If a metric cannot be calculated, state exactly which data is missing (table/field) and suggest a specific fix (e.g., check RLS on sets, ensure sets.workout_id is populated).
- Prefer concise, actionable summaries over generic advice. No requests for the user to provide more data.

When analyzing, include where relevant:
- Performance insights and trends (delta over time)
- Key metrics to focus on next
- Simple charts to suggest (by name) but do not ask for data
- Clear next steps if data or permissions are absent.

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

      // Analyze specific exercise progress (detect exercise names dynamically)
      if (text.includes('progress') || text.includes('trend') || text.includes('how have')) {
        // Heuristic: find an exercise name in the prompt
        const knownKeywords = ['press','bench','squat','deadlift','row','curl','sled','trap bar squat','trap bar','trap'];
        let candidate = knownKeywords.find(k => text.includes(k)) || '';
        if (candidate === 'press' && text.includes('bench')) candidate = 'bench press';
        if (candidate === 'trap') candidate = 'trap bar squat';
        if (candidate) {
          const exercise = await findExerciseByName(authScopedSupabase, userId, candidate);
          const nameForQuery = exercise?.name || candidate;
          analysisData = await analyzeExerciseProgress(authScopedSupabase, userId, nameForQuery);
        }
        
        if (analysisData.error) {
          responseContent = `I couldn't find data for ${exerciseName} in your workout history. This could mean:
          
1. You haven't logged any ${exerciseName} workouts yet
2. The exercise might be named differently in your database
3. You need to complete some workouts first

To get started, try completing a few workouts with ${exerciseName} and then ask me to analyze your progress again!`;
        } else if (analysisData) {
          const insights = generateProgressInsights(analysisData);
          responseContent = `Here's your ${candidate || 'exercise'} progress analysis:

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
        } else {
          responseContent = `I couldn't match an exercise name from your request. Try asking about a specific exercise (e.g., "bench press trend" or "trap bar squat progress").`;
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

// Test endpoint for Open Graph image generation
app.get('/api/og-image/test', (req, res) => {
  const html = generateOGImageHTML({
    workoutName: 'Test Workout',
    ownerName: 'Test User',
    exerciseCount: 5,
    setCount: 15,
    date: 'Jan 10, 2025',
    duration: 45
  });

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  return res.status(200).send(html);
});

// Dynamic Open Graph image generation endpoint
app.get('/api/og-image/workout/:id', async (req, res) => {
  try {
    const workoutId = req.params.id;
    
    if (!workoutId) {
      return res.status(400).json({ error: 'Workout ID is required' });
    }

    // Fetch workout data
    const { data: workout, error: workoutError } = await supabase
      .from('workouts')
      .select(`
        id,
        workout_name,
        created_at,
        duration_seconds,
        user_id,
        users!inner(name)
      `)
      .eq('id', workoutId)
      .single();

    if (workoutError || !workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Fetch workout exercises and sets
    const { data: workoutExercises, error: exercisesError } = await supabase
      .from('workout_exercises')
      .select(`
        id,
        exercises!inner(name)
      `)
      .eq('workout_id', workoutId);

    if (exercisesError) {
      console.error('Error fetching workout exercises:', exercisesError);
    }

    // Fetch sets for this workout
    const { data: sets, error: setsError } = await supabase
      .from('sets')
      .select('id, reps, weight')
      .eq('workout_id', workoutId);

    if (setsError) {
      console.error('Error fetching sets:', setsError);
    }

    // Calculate stats
    const exerciseCount = workoutExercises?.length || 0;
    const setCount = sets?.length || 0;
    const duration = workout.duration_seconds ? Math.round(workout.duration_seconds / 60) : null;
    const date = new Date(workout.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    // Generate HTML for the image
    const html = generateOGImageHTML({
      workoutName: workout.workout_name || 'Workout',
      ownerName: workout.users?.name || 'User',
      exerciseCount,
      setCount,
      date,
      duration
    });

    // Set headers for HTML response (browsers will render this as an image)
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    return res.status(200).send(html);

  } catch (error) {
    console.error('Error generating OG image:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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
