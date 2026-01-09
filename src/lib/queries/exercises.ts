import { supabase } from '@/supabaseClient';

export interface Exercise {
  id: string;
  name: string;
  section: string;
  user_id?: string;
}

/**
 * Search for exercises owned by the user.
 * Now that exercises have user_id, we can directly filter by user ownership.
 */
export async function searchUserExercises(userId: string, query: string): Promise<Exercise[]> {
  if (!userId) {
    return [];
  }

  // Query exercises directly by user_id and name filter (limit to 3 for combobox)
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, section, user_id')
    .eq('user_id', userId)
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
    .limit(3);

  if (error) {
    console.error('[searchUserExercises] Error searching exercises:', error);
    return [];
  }

  return (data || []) as Exercise[];
}
