import { useCallback, useEffect, useState } from 'react';
import { fetchWorkoutExercises } from '../api/workoutExercises';
import { fetchRoutineTemplateSets, fetchSavedSets } from '../api/sets';

function buildTemplateMap(templateRows) {
  const byExerciseId = {};
  (templateRows || []).forEach((row) => {
    byExerciseId[row.exercise_id] = (row.routine_sets || []).map((rs) => ({
      id: null,
      routine_set_id: rs.id,
      reps: rs.reps,
      weight: rs.weight,
      unit: rs.weight_unit,
      weight_unit: rs.weight_unit,
      set_variant: rs.set_variant,
      set_type: rs.set_type,
      timed_set_duration: rs.timed_set_duration,
      set_order: rs.set_order,
      status: 'default',
    }));
  });
  return byExerciseId;
}

function buildSavedMap(savedRows) {
  const byExerciseId = {};
  (savedRows || []).forEach((s) => {
    if (!byExerciseId[s.exercise_id]) byExerciseId[s.exercise_id] = [];
    byExerciseId[s.exercise_id].push(s);
  });
  return byExerciseId;
}

export function useSectionExercises({ workoutId, routineId, section }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!workoutId || !routineId) return [];
    setLoading(true);
    try {
      const [workoutExercises, templateRows, savedRows] = await Promise.all([
        fetchWorkoutExercises(workoutId),
        fetchRoutineTemplateSets(routineId),
        fetchSavedSets(workoutId),
      ]);

      const templateMap = buildTemplateMap(templateRows);
      const savedMap = buildSavedMap(savedRows);

      const filtered = (workoutExercises || []).filter((we) => {
        const sec = we.section_override || we.exercises?.section;
        if (section === 'training') return sec === 'training' || sec === 'workout';
        return sec === section;
      });

      const merged = filtered.map((we) => {
        const templateConfigs = templateMap[we.exercise_id] || [];
        const savedForExercise = savedMap[we.exercise_id] || [];

        const mergedSetConfigs = [];

        templateConfigs.forEach((tpl) => {
          const savedSet = savedForExercise.find((s) => s.routine_set_id === tpl.routine_set_id);
          if (savedSet && savedSet.status === 'hidden') return; // skip hidden
          if (savedSet) {
            mergedSetConfigs.push({
              id: savedSet.id,
              routine_set_id: savedSet.routine_set_id,
              reps: savedSet.reps,
              weight: savedSet.weight,
              unit: savedSet.weight_unit,
              weight_unit: savedSet.weight_unit,
              set_variant: savedSet.set_variant,
              set_type: savedSet.set_type,
              timed_set_duration: savedSet.timed_set_duration,
              status: savedSet.status || 'default',
              set_order: tpl.set_order,
              account_id: savedSet.account_id,
            });
          } else {
            mergedSetConfigs.push({ ...tpl, unit: tpl.unit || 'lbs', weight_unit: tpl.unit || 'lbs' });
          }
        });

        let orphanIndex = templateConfigs.length;
        savedForExercise.forEach((saved) => {
          if (saved.status === 'hidden') return;
          const hasTpl = templateConfigs.some((tpl) => tpl.routine_set_id === saved.routine_set_id);
          if (!hasTpl) {
            mergedSetConfigs.push({
              id: saved.id,
              routine_set_id: saved.routine_set_id,
              reps: saved.reps,
              weight: saved.weight,
              unit: saved.weight_unit,
              weight_unit: saved.weight_unit,
              set_variant: saved.set_variant,
              set_type: saved.set_type,
              timed_set_duration: saved.timed_set_duration,
              status: saved.status || 'default',
              set_order: saved.set_order || orphanIndex++,
              account_id: saved.account_id,
            });
          }
        });

        mergedSetConfigs.sort((a, b) => (a.set_order ?? 0) - (b.set_order ?? 0));

        // default names if missing
        mergedSetConfigs.forEach((s) => {
          if (!s.set_variant) {
            const idx = (s.set_order ?? 0) || 1;
            s.set_variant = `Set ${idx}`;
          }
        });

        return {
          id: we.id,
          exercise_id: we.exercise_id,
          section,
          name: we.name_override || we.snapshot_name,
          setConfigs: mergedSetConfigs,
        };
      });

      const nonEmpty = merged.filter((ex) => (ex.setConfigs?.length || 0) > 0);
      setExercises(nonEmpty);
      return nonEmpty;
    } finally {
      setLoading(false);
    }
  }, [workoutId, routineId, section]);

  useEffect(() => { void reload(); }, [reload]);

  return { exercises, loading, reload };
}


