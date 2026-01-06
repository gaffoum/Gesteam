"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/logger';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewTeamPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nom: '', categorie: '', genre: 'M', division: ''
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('club_id').eq('id', session.user.id).single();
        if (data) setClubId(data.club_id);
      }
    };
    init();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('equipes').insert({
        club_id: clubId,
        ...formData
      });

      if (error) throw error;

      // Historique
      if (user) {
        await logActivity(supabase, clubId, user.id, 'EQUIPE', `Nouvelle équipe : ${formData.categorie} ${formData.nom}`);
      }

      router.push('/dashboard/equipes');
    } catch (error) {
      console.error(error);
      alert("Erreur création équipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans italic text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/equipes" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00]"><ArrowLeft size={20}/></Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Nouvelle <span className="text-[#ff9d00]">Équipe</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nom de l'équipe</label>
            <input required placeholder="Ex: Équipe A, Lions..." type="text" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]" 
              onChange={e => setFormData({...formData, nom: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Catégorie</label>
              <input required placeholder="Ex: U11, Senior" type="text" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" 
                onChange={e => setFormData({...formData, categorie: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Genre</label>
              <select className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none"
                onChange={e => setFormData({...formData, genre: e.target.value})}>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Mixte">Mixte</option>
              </select>
            </div>
          </div>

          <div>
             <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Division / Niveau</label>
             <input type="text" placeholder="Ex: Régional 1" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" 
               onChange={e => setFormData({...formData, division: e.target.value})} />
          </div>

          <button disabled={loading} type="submit" className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-[#ff9d00] transition-all flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Save size={20}/>} CRÉER L'ÉQUIPE
          </button>
        </form>
      </div>
    </div>
  );
}