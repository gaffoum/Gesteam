"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Pas connecté -> Direction Login
        router.replace('/login');
      } else {
        // Déjà connecté -> On vérifie si le club est créé
        const { data: profile } = await supabase
          .from('profiles')
          .select('club_id, role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'superAdmin') {
          router.replace('/backoffice');
        } else if (profile?.club_id) {
          router.replace('/dashboard');
        } else {
          router.replace('/onboarding');
        }
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#ff9d00] mx-auto mb-4" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">
          Chargement de Gesteam...
        </p>
      </div>
    </div>
  );
}