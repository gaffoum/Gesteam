"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, Trophy } from 'lucide-react';

interface ClubProfile {
  clubs: { pays: string; } | null;
  club_id: string | null;
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

      const { data, error } = await supabase
        .from('profiles')
        .select('club_id, clubs(pays)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const profile = data as unknown as ClubProfile;
      const clubPays = profile?.clubs?.pays || 'France';

      if (clubPays === 'France') {
        setCategories([...BASE_CATS, "U19", "Séniors", "Vétérans"]);
      } else {
        setCategories([...BASE_CATS, "U19", "U20", "U21", "Séniors", "Vétérans"]);
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setIsLoading(false);
    }
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

      if (!profile?.club_id) throw new Error("ID du club introuvable.");

      // Insertion dans la table 'teams' avec le club_id maintenant existant
      const teamsToInsert = selectedTeams.map(cat => ({
        name: cat,
        club_id: profile.club_id,
        category: cat
      }));

      const { error } = await supabase.from('teams').insert(teamsToInsert);
      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      alert("Erreur d'enregistrement : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;

  return (
    <DashboardLayout>
      <div className="p-8 italic">
        <h1 className="text-5xl font-black uppercase mb-10 text-[#1a1a1a]">Structure <span className="text-[#ff9d00]">Club</span></h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 not-italic mb-12">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedTeams(prev => prev.includes(cat) ? prev.filter(t => t !== cat) : [...prev, cat])}
              className={`p-6 rounded-2xl font-black uppercase text-xs border-2 transition-all ${
                selectedTeams.includes(cat) ? 'border-[#ff9d00] bg-[#ff9d00]/5 text-[#ff9d00]' : 'border-gray-100 text-gray-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <button 
          onClick={handleSaveTeams} 
          disabled={isSaving}
          className="bg-[#1a1a1a] text-white px-12 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3"
        >
          {isSaving ? <Loader2 className="animate-spin" /> : "Valider et continuer"}
        </button>
      </div>
    </DashboardLayout>
  );
}