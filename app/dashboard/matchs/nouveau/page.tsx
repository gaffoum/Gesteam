"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { logActivity } from '@/lib/logger';
import { Loader2, Save, ArrowLeft, Trophy } from 'lucide-react';
import Link from 'next/link';

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);
  const [teams, setTeams] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    equipe_id: '',
    adversaire: '',
    date_heure: '',
    lieu: 'Domicile',
    type: 'Championnat'
  });

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session.user.id).single();
        if (profile?.club_id) {
          setClubId(profile.club_id);
          // Charger les équipes pour le choix
          const { data: teamsData } = await supabase.from('equipes').select('*').eq('club_id', profile.club_id);
          if (teamsData) setTeams(teamsData);
        }
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

      const { error } = await supabase.from('matchs').insert({
        club_id: clubId,
        ...formData
      });

      if (error) throw error;

      // Historique
      if (user) {
        const teamName = teams.find(t => t.id === formData.equipe_id)?.nom || 'Equipe';
        await logActivity(supabase, clubId, user.id, 'MATCH', `Nouveau match : ${teamName} vs ${formData.adversaire}`);
      }

      router.push('/dashboard/matchs');
    } catch (error) {
      console.error(error);
      alert("Erreur création match");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans italic text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00]"><ArrowLeft size={20}/></Link>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Nouveau <span className="text-[#ff9d00]">Match</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-6">
          
          <div>
            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Votre Équipe</label>
            <select required className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none"
              onChange={e => setFormData({...formData, equipe_id: e.target.value})}>
              <option value="">Choisir une équipe...</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.categorie} - {t.nom}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Adversaire</label>
               <input required type="text" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]" 
                 onChange={e => setFormData({...formData, adversaire: e.target.value})} />
             </div>
             <div>
               <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Date & Heure</label>
               <input required type="datetime-local" className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none" 
                 onChange={e => setFormData({...formData, date_heure: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Lieu</label>
              <select className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none"
                onChange={e => setFormData({...formData, lieu: e.target.value})}>
                <option value="Domicile">Domicile</option>
                <option value="Exterieur">Extérieur</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Type</label>
              <select className="w-full bg-gray-50 p-4 rounded-xl font-bold outline-none"
                onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="Championnat">Championnat</option>
                <option value="Coupe">Coupe</option>
                <option value="Amical">Amical</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-black text-white py-5 rounded-xl font-black uppercase tracking-widest hover:bg-[#ff9d00] transition-all flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin"/> : <Trophy size={20}/>} PLANIFIER LE MATCH
          </button>
        </form>
      </div>
    </div>
  );
}