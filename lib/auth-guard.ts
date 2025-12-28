// lib/auth-guard.ts
import { supabase } from './supabase';

export type UserRole = 'superAdmin' | 'admin' | 'superUser' | 'user';

/**
 * Récupère le profil complet avec le rôle
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('role, is_blocked, club_id, email')
    .eq('id', userId)
    .single();
    
  if (error) return null;
  return data;
}

/**
 * Définit où envoyer l'utilisateur après sa connexion selon son rôle
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'superAdmin':
      return '/backoffice'; // Interface globale (System Control)
    case 'admin':
      return '/dashboard';  // Interface responsable club
    case 'superUser':
      return '/dashboard';  // Interface coach (accès limité)
    case 'user':
      return '/me';         // Interface joueur (lecture seule)
    default:
      return '/login';
  }
}