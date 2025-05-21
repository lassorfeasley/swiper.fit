import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const History = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkouts() {
      setLoading(true);
      // Fetch workouts and join with program name
      const { data, error } = await supabase
        .from('workouts')
        .select('id, duration, completed_at, program_id, programs(name)')
        .order('completed_at', { ascending: false });
      setWorkouts(data || []);
      setLoading(false);
    }
    fetchWorkouts();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      {loading ? (
        <div>Loading...</div>
      ) : workouts.length === 0 ? (
        <div>No workouts completed yet.</div>
      ) : (
        <div className="space-y-4">
          {workouts.map(w => (
            <div key={w.id} className="bg-white rounded-xl shadow p-4 flex flex-col gap-2">
              <div className="font-bold text-lg">{w.programs?.name || 'Unknown Program'}</div>
              <div className="text-gray-600 text-sm">{new Date(w.completed_at).toLocaleString()}</div>
              <div className="text-gray-800">Duration: {Math.floor(w.duration/60)}:{String(w.duration%60).padStart(2,'0')}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History; 