"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Trophy, MapPin, ArrowRight, LogOut } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');
  const [ville, setVille] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      // 1. Vérification de la session (Indispensable sans middleware)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log("Accès refusé : pas de session active");
        router.replace('/login');
        return;
      }

      // 2. Vérification si l'utilisateur a déjà un club lié
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        // Redirection vers le dashboard si le club existe déjà
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée, veuillez vous reconnecter.");

      // 1. Création du nouveau club dans la table 'clubs'
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({ name: clubName, ville: ville })
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Mise à jour du profil de l'admin pour le lier à ce club
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ club_id: club.id })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Succès -> Direction le Dashboard
      router.push('/dashboard');
    } catch (err: any) {
      alert("Erreur lors de la création : " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <Loader2 className="animate-spin text-[#ff9d00] mx-auto mb-4" size={48} />
          <p className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Vérification de sécurité...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
            Nouveau <span className="text-[#ff9d00]">Club</span>
          </h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2 text-center">
            Dernière étape avant le terrain
          </p>
        </div>

        <form onSubmit={handleCreateClub} className="space-y-6 not-italic">
          <div className="relative">
            <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Nom du Club" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
              onChange={e => setClubName(e.target.value)} 
              required 
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Ville" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
              onChange={e => setVille(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/5"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Créer le club <ArrowRight size={18}/></>}
          </button>
        </form>
        
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="w-full mt-6 text-gray-300 hover:text-red-500 font-bold uppercase text-[10px] transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={12} /> Annuler et déconnexion
        </button>
      </div>
    </div>
  );
}