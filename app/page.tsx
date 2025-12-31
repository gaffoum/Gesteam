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
        // 1. Récupération de la session actuelle
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.log("Aucune session active");
          router.replace('/login');
          return;
        }

        // --- SÉCURITÉ PRIORITAIRE POUR VOTRE ACCÈS ---
        // On vérifie l'email directement dans la session Auth
        if (session.user.email === 'gaffoum@gmail.com') {
          console.log("Accès SuperAdmin forcé par email");
          router.replace('/backoffice');
          return;
        }

        // 2. Tentative de récupération du profil
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('club_id, role')
          .eq('id', session.user.id);

        const profile = profiles && profiles.length > 0 ? profiles[0] : null;

        if (profileError) {
          console.error("Erreur de lecture profil:", profileError.message);
        }

        // 3. Logique de redirection selon le rôle ou le club
        if (profile?.role === 'superAdmin') {
          router.replace('/backoffice');
        } 
        else if (profile?.club_id) {
          router.replace('/dashboard');
        } 
        else {
          // Si l'utilisateur est connecté mais n'a pas de profil/club, il va à l'onboarding
          console.log("Utilisateur sans club_id, direction onboarding");
          router.replace('/onboarding');
        }

      } catch (error) {
        console.error("Erreur critique d'authentification:", error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest italic">
          Vérification des accès...
        </p>
      </div>
    </div>
  );
}