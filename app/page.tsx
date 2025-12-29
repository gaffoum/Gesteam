"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // On récupère la session actuelle
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // AUCUNE SESSION : On force le login
        router.replace('/login');
      } else {
        // SESSION EXISTANTE : On vérifie l'état du profil
        const { data: profile } = await supabase
          .from('profiles')
          .select('club_id')
          .eq('id', session.user.id)
          .single();

        if (profile?.club_id) {
          // Club déjà créé : Dashboard
          router.replace('/dashboard');
        } else {
          // Club à créer : Onboarding
          router.replace('/onboarding');
        }
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );
}