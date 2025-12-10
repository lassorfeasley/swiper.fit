import { getSupabaseServerClient, getSupabaseUserClient } from '../../server/supabase.js';

const supabaseAdmin = getSupabaseServerClient();
const MAX_SET_NAME_LEN = 25;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = extractBearerToken(req.headers.authorization || '');
    if (!token) {
      return res.status(401).json({ error: 'Missing Authorization token' });
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData?.user) {
      return res.status(401).json({ error: 'Invalid access token' });
    }

    const actorId = authData.user.id;
    const supabaseUser = getSupabaseUserClient(token);
    const { action, payload = {} } = req.body || {};

    if (!action) {
      return res.status(400).json({ error: 'Missing action' });
    }

    switch (action) {
      case 'start_workout': {
        const result = await handleStartWorkout(payload, actorId, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      case 'complete_set': {
        const result = await handleCompleteSet(payload, actorId, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      case 'undo_set': {
        const result = await handleUndoSet(payload, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      case 'add_exercise_today': {
        const result = await handleAddExerciseToday(payload, actorId, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      case 'add_exercise_future': {
        const result = await handleAddExerciseFuture(payload, actorId, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      case 'update_focus': {
        const result = await handleUpdateFocus(payload, actorId, supabaseUser);
        return res.status(200).json({ ok: true, ...result });
      }
      default:
        return res.status(400).json({ error: `Unsupported action: ${action}` });
    }
  } catch (err) {
    console.error('[Workout Mutation API] Unexpected error', err);
    return res.status(500).json({
      error: 'Unexpected server error',
      details: err?.message || 'Unknown error',
    });
  }
}

function extractBearerToken(headerValue) {
  if (!headerValue) return '';
  const parts = headerValue.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return headerValue;
}

async function handleStartWorkout(payload, actorId, supabase) {
  const program = payload?.program;
  if (!program) {
    throw new Error('Program payload is required to start a workout');
  }

  const routineName = program?.routine_name || program?.name || 'Workout';
  const workoutName = generateWorkoutName();

  await supabase
    .from('workouts')
    .update({ is_active: false })
    .eq('user_id', actorId)
    .eq('is_active', true);

  const { data: workout, error: workoutError } = await supabase
    .from('workouts')
    .insert({
      user_id: actorId,
      routine_id: program.id,
      workout_name: routineName || workoutName,
      is_active: true,
      running_since: new Date().toISOString(),
      active_seconds_accumulated: 0,
    })
    .select()
    .single();

  if (workoutError) {
    throw workoutError;
  }

  const ownerId = workout.user_id;
  const normalizedExercises = normalizeProgramExercises(program);

  let insertedExercises = [];
  if (normalizedExercises.length > 0) {
    const { data: exerciseRows, error: exerciseError } = await supabase
      .from('workout_exercises')
      .insert(
        normalizedExercises.map((exercise) => ({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          exercise_order: exercise.index,
          snapshot_name: exercise.name,
          section_override: exercise.section || null,
          user_id: ownerId,
        })),
      )
      .select();

    if (exerciseError) {
      throw exerciseError;
    }

    insertedExercises = exerciseRows || [];

    const setsToInsert = [];
    normalizedExercises.forEach((exercise) => {
      const matchingWorkoutExercise = insertedExercises.find(
        (row) => row.exercise_id === exercise.exercise_id && row.exercise_order === exercise.index,
      );

      (exercise.sets || []).forEach((set, idx) => {
        setsToInsert.push({
          workout_id: workout.id,
          exercise_id: exercise.exercise_id,
          workout_exercise_id: matchingWorkoutExercise?.id,
          status: 'default',
          set_type: set.set_type || 'reps',
          reps: typeof set.reps === 'number' ? set.reps : null,
          timed_set_duration: typeof set.timed_set_duration === 'number' ? set.timed_set_duration : null,
          weight: typeof set.weight === 'number' ? set.weight : 0,
          weight_unit: set.weight_unit || set.unit,
          set_variant: set.set_variant || `Set ${idx + 1}`,
          set_order: typeof set.set_order === 'number' ? set.set_order : idx + 1,
          user_id: ownerId,
        });
      });
    });

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase.from('sets').insert(setsToInsert);
      if (setsError) {
        throw setsError;
      }
    }
  }

  const snapshot = await fetchWorkoutSnapshot(supabase, workout.id);
  return {
    workout: snapshot,
    sessionVersion: Date.now(),
    message: 'Workout created',
  };
}

async function handleCompleteSet(payload, actorId, supabase) {
  const workoutId = payload?.workoutId;
  const exerciseId = payload?.exerciseId;
  const setConfig = payload?.setConfig || {};

  if (!workoutId || !exerciseId) {
    throw new Error('workoutId and exerciseId are required');
  }

  const ownerId = await getWorkoutOwnerId(supabase, workoutId);
  const workoutExerciseId = await resolveWorkoutExerciseId(supabase, workoutId, exerciseId);
  const setPayload = {
    workout_id: workoutId,
    exercise_id: exerciseId,
    workout_exercise_id: workoutExerciseId,
    set_variant: (setConfig.set_variant || '').slice(0, MAX_SET_NAME_LEN),
    status: 'complete',
    account_id: actorId,
    reps: deriveNumber(setConfig.reps, 0),
    weight: deriveNumber(setConfig.weight, 0),
    weight_unit: setConfig.unit || setConfig.weight_unit || 'lbs',
    routine_set_id: setConfig.routine_set_id || null,
    set_type: setConfig.set_type || 'reps',
    timed_set_duration: deriveNumber(setConfig.timed_set_duration, 0),
    set_order: typeof setConfig.set_order === 'number' ? setConfig.set_order : 0,
    user_id: ownerId,
  };

  if (setConfig.set_type === 'timed' && !setPayload.reps) {
    setPayload.reps = 1;
  }

  let setId = setConfig.id;
  if (setId && !String(setId).startsWith('temp-')) {
    const { error } = await supabase
      .from('sets')
      .update(setPayload)
      .eq('id', setId);
    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await supabase
      .from('sets')
      .insert(setPayload)
      .select('id')
      .single();
    if (error) {
      throw error;
    }
    setId = data?.id;
  }

  return {
    setId,
    workoutId,
    exerciseId,
    sessionVersion: Date.now(),
  };
}

async function handleUndoSet(payload, supabase) {
  const workoutId = payload?.workoutId;
  const exerciseId = payload?.exerciseId;
  const setConfig = payload?.setConfig || {};

  if (!workoutId || !exerciseId) {
    throw new Error('workoutId and exerciseId are required');
  }

  if (setConfig.id && !String(setConfig.id).startsWith('temp-')) {
    const { error } = await supabase
      .from('sets')
      .update({ status: 'default', account_id: null })
      .eq('id', setConfig.id);
    if (error) {
      throw error;
    }
  } else if (setConfig.routine_set_id) {
    const { data: rows, error: findError } = await supabase
      .from('sets')
      .select('id')
      .eq('workout_id', workoutId)
      .eq('exercise_id', exerciseId)
      .eq('routine_set_id', setConfig.routine_set_id)
      .eq('status', 'complete')
      .limit(1);

    if (findError) {
      throw findError;
    }

    if (rows && rows.length > 0) {
      const { error: deleteError } = await supabase
        .from('sets')
        .delete()
        .eq('id', rows[0].id);
      if (deleteError) {
        throw deleteError;
      }
    }
  }

  return {
    workoutId,
    exerciseId,
    sessionVersion: Date.now(),
  };
}

async function handleAddExerciseToday(payload, actorId, supabase) {
  const workoutId = payload?.workoutId;
  const name = payload?.exercise?.name;
  const section = payload?.exercise?.section || 'training';
  const setConfigs = payload?.exercise?.setConfigs || [];

  if (!workoutId || !name) {
    throw new Error('workoutId and exercise name are required');
  }

  const ownerId = await getWorkoutOwnerId(supabase, workoutId);
  const exerciseId = await findOrCreateExercise(supabase, name, section);
  const workoutExerciseId = await ensureWorkoutExercise({
    supabase,
    workoutId,
    exerciseId,
    section,
    snapshotName: name,
    ownerId,
  });

  if (setConfigs.length > 0 && workoutExerciseId?.created) {
    const rows = setConfigs.map((cfg, idx) => ({
      workout_id: workoutId,
      exercise_id: exerciseId,
      workout_exercise_id: workoutExerciseId.id,
      set_order: idx + 1,
      reps: deriveNumber(cfg.reps, 10),
      weight: deriveNumber(cfg.weight, 25),
      weight_unit: cfg.unit || cfg.weight_unit || 'lbs',
      set_variant: cfg.set_variant || `Set ${idx + 1}`,
      set_type: cfg.set_type || 'reps',
      timed_set_duration: deriveNumber(cfg.timed_set_duration, 30),
      status: 'default',
      user_id: ownerId,
    }));

    const { error: setError } = await supabase.from('sets').insert(rows);
    if (setError) {
      console.error('[Workout Mutation] Failed to insert sets for new exercise', setError);
    }
  }

  return {
    workoutId,
    exerciseId,
    workoutExerciseId: workoutExerciseId?.id,
    sessionVersion: Date.now(),
  };
}

async function handleAddExerciseFuture(payload, actorId, supabase) {
  const workoutId = payload?.workoutId;
  const routineId = payload?.routineId;
  const name = payload?.exercise?.name;
  const section = payload?.exercise?.section || 'training';
  const setConfigs = payload?.exercise?.setConfigs || [];

  if (!workoutId || !routineId || !name) {
    throw new Error('workoutId, routineId and exercise name are required');
  }

  const ownerId = await getWorkoutOwnerId(supabase, workoutId);
  const exerciseId = await findOrCreateExercise(supabase, name, section);
  const routineExerciseId = await insertRoutineExercise({
    supabase,
    routineId,
    exerciseId,
    ownerId,
  });

  if (setConfigs.length > 0) {
    const rows = setConfigs.map((cfg, idx) => ({
      routine_exercise_id: routineExerciseId,
      set_order: idx + 1,
      reps: deriveNumber(cfg.reps, 10),
      weight: deriveNumber(cfg.weight, 25),
      weight_unit: cfg.unit || cfg.weight_unit || 'lbs',
      set_variant: cfg.set_variant || `Set ${idx + 1}`,
      set_type: cfg.set_type || 'reps',
      timed_set_duration: deriveNumber(cfg.timed_set_duration, 30),
      user_id: ownerId,
    }));
    const { error } = await supabase.from('routine_sets').insert(rows);
    if (error) {
      throw error;
    }
  }

  const workoutExercise = await ensureWorkoutExercise({
    supabase,
    workoutId,
    exerciseId,
    section,
    snapshotName: name,
    ownerId,
  });

  if (workoutExercise?.created && setConfigs.length === 0) {
    const rows = Array.from({ length: 3 }).map((_, idx) => ({
      workout_id: workoutId,
      exercise_id: exerciseId,
      workout_exercise_id: workoutExercise.id,
      set_order: idx + 1,
      reps: 10,
      weight: 25,
      weight_unit: 'lbs',
      set_variant: `Set ${idx + 1}`,
      set_type: 'reps',
      timed_set_duration: 30,
      status: 'default',
      user_id: ownerId,
    }));
    const { error } = await supabase.from('sets').insert(rows);
    if (error) {
      console.error('[Workout Mutation] Failed default set insert', error);
    }
  }

  return {
    workoutId,
    exerciseId,
    workoutExerciseId: workoutExercise?.id,
    sessionVersion: Date.now(),
  };
}

async function handleUpdateFocus(payload, actorId, supabase) {
  const workoutId = payload?.workoutId;
  const workoutExerciseId = payload?.workoutExerciseId;

  if (!workoutId || !workoutExerciseId) {
    throw new Error('workoutId and workoutExerciseId are required');
  }

  const { error } = await supabase
    .from('workouts')
    .update({
      last_workout_exercise_id: workoutExerciseId,
    })
    .eq('id', workoutId);

  if (error) {
    throw error;
  }

  return {
    workoutId,
    workoutExerciseId,
    sessionVersion: Date.now(),
  };
}

function normalizeProgramExercises(program) {
  const rawExercises = program?.exercises || program?.routine_exercises || [];
  if (!Array.isArray(rawExercises)) {
    return [];
  }

  return rawExercises.map((exercise, index) => ({
    index,
    exercise_id: exercise.exercise_id ?? exercise.id,
    name: exercise.name ?? exercise.snapshot_name ?? exercise.exercises?.name ?? 'Exercise',
    section: exercise.section_override || exercise.section || null,
    sets: exercise.sets ?? exercise.routine_sets ?? [],
  }));
}

async function fetchWorkoutSnapshot(supabase, workoutId) {
  const { data, error } = await supabase
    .from('workouts')
    .select(`
      *,
      routines!fk_workouts__routines(routine_name),
      workout_exercises!workout_exercises_workout_id_fkey(
        *,
        sets!fk_sets_workout_exercise_id(*)
      )
    `)
    .eq('id', workoutId)
    .single();

  if (error) {
    throw error;
  }

  const exercises = (data?.workout_exercises || [])
    .map((exercise) => ({
      ...exercise,
      sets: (exercise.sets || []).sort((a, b) => (a.set_order || 0) - (b.set_order || 0)),
    }))
    .sort((a, b) => (a.exercise_order || 0) - (b.exercise_order || 0));

  return {
    ...data,
    workout_exercises: exercises,
    exercises,
  };
}

async function resolveWorkoutExerciseId(supabase, workoutId, exerciseId) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('exercise_id', exerciseId)
    .order('exercise_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id || null;
}

async function findOrCreateExercise(supabase, name, section) {
  const { data: existing, error } = await supabase
    .from('exercises')
    .select('id, section')
    .ilike('name', name);

  if (error) {
    throw error;
  }

  if (existing && existing.length > 0) {
    const exercise = existing[0];
    if (exercise.section !== section) {
      await supabase
        .from('exercises')
        .update({ section })
        .eq('id', exercise.id);
    }
    return exercise.id;
  }

  const { data: created, error: insertError } = await supabase
    .from('exercises')
    .insert({ name, section })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return created.id;
}

async function getNextExerciseOrder(supabase, table, column, value) {
  const { data, error } = await supabase
    .from(table)
    .select('exercise_order')
    .eq(column, value)
    .order('exercise_order', { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return 1;
  }

  return (data[0].exercise_order || 0) + 1;
}

async function ensureWorkoutExercise({ supabase, workoutId, exerciseId, section, snapshotName, ownerId }) {
  const { data: existing, error } = await supabase
    .from('workout_exercises')
    .select('id')
    .eq('workout_id', workoutId)
    .eq('exercise_id', exerciseId)
    .limit(1);

  if (error) {
    throw error;
  }

  if (existing && existing.length > 0) {
    return { id: existing[0].id, created: false };
  }

  const order = await getNextExerciseOrder(supabase, 'workout_exercises', 'workout_id', workoutId);
  const { data, error: insertError } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      exercise_id: exerciseId,
      exercise_order: order,
      snapshot_name: snapshotName.trim(),
      section_override: section,
      user_id: ownerId,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return { id: data.id, created: true };
}

async function insertRoutineExercise({ supabase, routineId, exerciseId, ownerId }) {
  const order = await getNextExerciseOrder(supabase, 'routine_exercises', 'routine_id', routineId);
  const { data, error } = await supabase
    .from('routine_exercises')
    .insert({
      routine_id: routineId,
      exercise_id: exerciseId,
      exercise_order: order,
      user_id: ownerId,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data.id;
}

async function getWorkoutOwnerId(supabase, workoutId) {
  const { data, error } = await supabase
    .from('workouts')
    .select('user_id')
    .eq('id', workoutId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.user_id) {
    throw new Error(`Workout ${workoutId} missing user_id`);
  }

  return data.user_id;
}

function deriveNumber(value, fallback) {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }
  return fallback;
}

function generateWorkoutName() {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const hour = now.getHours();
  const timeOfDay =
    hour >= 5 && hour < 12
      ? 'Morning'
      : hour >= 12 && hour < 17
      ? 'Afternoon'
      : hour >= 17 && hour < 21
      ? 'Evening'
      : 'Night';
  return `${day} ${timeOfDay} Workout`;
}


