"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Building2, Globe, Loader2, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const [clubName, setClubName] = useState('');
  const [ville, setVille] = useState('');
  const [pays, setPays] = useState('France');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expirée");

      // 1. Créer le club avec le pays
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({ 
          name: clubName, 
          ville: ville, 
          pays: pays 
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Lier l'admin au club
      await supabase.from('profiles').update({ club_id: club.id }).eq('id', user.id);

      // Redirection vers la configuration des équipes (qui dépendra du pays)
      router.push('/dashboard/setup-teams');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-6 italic text-white">
      <div className="max-w-xl w-full bg-white rounded-[3.5rem] p-12 shadow-2xl text-[#1a1a1a]">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-center mb-10">
          Votre <span className="text-[#ff9d00]">Club</span>
        </h2>

        <form onSubmit={handleCreateClub} className="space-y-6 not-italic">
          <div>
            <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Nom du Club</label>
            <input type="text" className="w-full p-5 rounded-2xl bg-gray-100 font-black uppercase text-sm outline-none focus:border-[#ff9d00] border-2 border-transparent" onChange={e => setClubName(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Ville</label>
              <input type="text" className="w-full p-5 rounded-2xl bg-gray-100 font-black uppercase text-sm outline-none" onChange={e => setVille(e.target.value)} required />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Pays</label>
              <select 
                className="w-full p-5 rounded-2xl bg-gray-100 font-black uppercase text-sm outline-none border-2 border-transparent focus:border-[#ff9d00]"
                value={pays}
                onChange={e => setPays(e.target.value)}
              >
                <option value="France">France (U6-U19)</option>
                <option value="International">International (U6-U21)</option>
              </select>
            </div>
          </div>

          <button disabled={isLoading} className="w-full bg-[#1a1a1a] text-white py-6 rounded-2xl font-black uppercase hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3">
            {isLoading ? <Loader2 className="animate-spin" /> : "Finaliser l'inscription"}
          </button>
        </form>
      </div>
    </div>
  );
}