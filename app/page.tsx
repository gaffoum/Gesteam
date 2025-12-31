"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.replace('/login');
          return;
        }

        // Bypass pour ton email Admin
        if (session.user.email === 'gaffoum@gmail.com') {
          router.replace('/backoffice');
          return;
        }

        // Récupération du profil
        const { data: profiles } = await supabase
          .from('profiles')
          .select('club_id, role, is_blocked')
          .eq('id', session.user.id);

        const profile = profiles?.[0];

        // Sécurité : Si pas de profil en BDD, on déconnecte
        if (!profile) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        if (profile.is_blocked) {
          await supabase.auth.signOut();
          router.replace('/login');
          return;
        }

        // Routage final
        if (profile.role === 'superAdmin') {
          router.replace('/backoffice');
        } else if (profile.club_id) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );
}