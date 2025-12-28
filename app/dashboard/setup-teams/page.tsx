"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Trophy } from 'lucide-react';

// Définition d'un type pour la réponse de Supabase
interface ClubProfile {
  clubs: {
    pays: string;
  } | null;
}

const BASE_CATS = ["U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "U18"];

export default function SetupTeamsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadClubFormat();
  }, []);

  const loadClubFormat = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/login');

      // On force le type avec 'as unknown as ClubProfile' pour que TS reconnaisse .pays
      const { data, error } = await supabase
        .from('profiles')
        .select('clubs(pays)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const profile = data as unknown as ClubProfile;
      const clubPays = profile?.clubs?.pays || 'France';

      // Logique de génération des catégories selon le pays
      if (clubPays === 'France') {
        setCategories([...BASE_CATS, "U19", "Séniors", "Vétérans"]);
      } else {
        setCategories([...BASE_CATS, "U19", "U20", "U21", "Séniors", "Vétérans"]);
      }
    } catch (err) {
      console.error("Erreur chargement format club:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTeam = (cat: string) => {
    setSelectedTeams(prev => 
      prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat]
    );
  };

  const handleSaveTeams = async () => {
    if (selectedTeams.length === 0) return alert("Sélectionnez au moins une équipe.");
    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', user?.id)
        .single();

      if (!profile?.club_id) throw new Error("Club non trouvé");

      // Préparation des données pour la table 'teams' (ou 'equipes' selon ton schéma)
      const teamsToInsert = selectedTeams.map(cat => ({
        name: cat,
        club_id: profile.club_id,
        category: cat
      }));

      const { error } = await supabase.from('teams').insert(teamsToInsert);
      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Chargement de la structure...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 italic">
        <div className="mb-12">
          <h1 className="text-5xl font-black uppercase tracking-tighter">
            Structure <span className="text-[#ff9d00]">Sportive</span>
          </h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em] mt-2">
            Adaptez les catégories selon votre fédération
          </p>
        </div>

        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 not-italic">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-12">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => toggleTeam(cat)}
                className={`group relative p-6 rounded-2xl font-black uppercase text-xs transition-all border-2 flex flex-col items-center gap-3 ${
                  selectedTeams.includes(cat) 
                  ? 'border-[#ff9d00] bg-[#ff9d00]/5 text-[#ff9d00]' 
                  : 'border-gray-50 bg-gray-50 text-gray-300 hover:border-gray-200 hover:text-gray-500'
                }`}
              >
                <Trophy size={16} className={selectedTeams.includes(cat) ? 'opacity-100' : 'opacity-20'} />
                {cat}
                {selectedTeams.includes(cat) && (
                  <CheckCircle2 className="absolute top-2 right-2 text-[#ff9d00]" size={14} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase italic">
              {selectedTeams.length} équipe(s) sélectionnée(s)
            </p>
            <button 
              onClick={handleSaveTeams}
              disabled={isSaving || selectedTeams.length === 0}
              className="px-12 py-5 bg-[#1a1a1a] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 disabled:opacity-20"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Valider la structure"}
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}