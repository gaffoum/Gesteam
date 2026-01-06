import { SupabaseClient } from '@supabase/supabase-js';

export const logActivity = async (
  supabase: SupabaseClient,
  clubId: string,
  userId: string,
  type: 'JOUEUR' | 'EQUIPE' | 'MATCH' | 'STAFF' | 'CONVOCATION',
  description: string
) => {
  try {
    await supabase.from('activity_logs').insert({
      club_id: clubId,
      user_id: userId,
      action_type: type,
      description: description
    });
  } catch (error) {
    console.error("Logger Error:", error);
  }
};