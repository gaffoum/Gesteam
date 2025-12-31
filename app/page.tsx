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
        // 1. Récupération de la session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          console.log("Pas de session, redirection Login");
          router.replace('/login');
          return;
        }

        // 2. Récupération du profil
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('club_id, role')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          // C'est souvent ici que ça bloque en prod (Erreur RLS ou Pas de résultat)
          console.error("Erreur récupération profil:", profileError.message);
          // Par sécurité, si on n'arrive pas à lire le profil, on ne redirige pas aveuglément vers onboarding
          // On peut rediriger vers login pour forcer un refresh ou rester bloqué pour debug
          // Pour l'instant, laissons la logique suivre son cours, mais check tes logs !
        }

        console.log("Profil trouvé:", profile); // Regarde ceci dans la console F12 en prod

        // LOGIQUE DE REDIRECTION
        
        // 1. Priorité absolue au SuperAdmin
        if (profile?.role === 'superAdmin' || session.user.email === 'gaffoum@gmail.com') {
          // J'ai ajouté le check email en dur par sécurité au cas où le rôle n'est pas chargé
          router.replace('/backoffice');
        } 
        // 2. Si c'est un admin avec un club
        else if (profile?.club_id) {
          router.replace('/dashboard');
        } 
        // 3. Sinon onboarding
        else {
          console.log("Pas de club_id trouvé, redirection Onboarding");
          router.replace('/onboarding');
        }

      } catch (error) {
        console.error("Erreur critique dans checkAuth:", error);
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
        <p className="text-gray-400 text-xs uppercase tracking-widest font-bold">Chargement...</p>
      </div>
    </div>
  );
}