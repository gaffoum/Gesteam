// lib/auth-guard.ts
import { supabase } from './supabase';

export type UserRole = 'superAdmin' | 'admin' | 'superUser' | 'user';

/**
 * Définit où envoyer l'utilisateur selon son rôle
 */
export function getRedirectPath(role: UserRole): string {
  switch (role) {
    case 'superAdmin':
      return '/backoffice'; // Ta route de contrôle global
    case 'admin':
      return '/dashboard';  // Dashboard Club
    case 'superUser':
      return '/dashboard';  // Dashboard Coach
    case 'user':
      return '/me';         // Espace Joueur
    default:
      return '/login';
  }
}