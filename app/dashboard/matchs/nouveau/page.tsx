"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save, Calendar, Trophy, MapPin, Users } from 'lucide-react';
import Link from 'next/link';

export default function NewMatchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipes, setEquipes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    adversaire: '',
    lieu: 'Domicile',
    competition: 'Championnat',
    equipe_id: ''
  });

  useEffect(() => {
    // Charger les équipes pour le menu déroulant
    const loadEquipes = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session?.user.id).single();
      if (profile?.club_id) {
        const { data } = await supabase.from('equipes').select('id, nom').eq('club_id', profile.club_id);
        setEquipes(data || []);
      }
    };
    loadEquipes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipe_id) return alert("Veuillez sélectionner une équipe.");
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session?.user.id).single();

      // Combiner date et heure pour le format TIMESTAMP
      const dateHeure = `${formData.date}T${formData.time}:00`;

      const { error } = await supabase.from('matchs').insert([{
        date_heure: dateHeure,
        adversaire: formData.adversaire,
        lieu: formData.lieu,
        competition: formData.competition,
        equipe_id: formData.equipe_id,
        club_id: profile?.club_id,
        statut: 'prevu'
      }]);

      if (error) throw error;
      router.push('/dashboard/matchs');
    } catch (err: any) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/matchs" className="flex items-center gap-2 text-gray-400 hover:text-[#ff9d00] mb-8 transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Retour</span>
        </Link>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-10">
            Nouveau <span className="text-[#ff9d00]">Match</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 not-italic">
            
            {/* Sélection de l'équipe */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Équipe concernée</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  required
                  className="w-full p-5 pl-12 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none cursor-pointer focus:ring-2 ring-[#ff9d00]/20"
                  onChange={e => setFormData({...formData, equipe_id: e.target.value})}
                >
                  <option value="">Choisir une équipe...</option>
                  {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                </select>
              </div>
            </div>

            {/* Adversaire */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Adversaire</label>
              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input required type="text" placeholder="Ex: FC Barcelone" className="w-full p-5 pl-12 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm"
                  onChange={e => setFormData({...formData, adversaire: e.target.value})} />
              </div>
            </div>

            {/* Date & Heure */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Date</label>
                <input required type="date" className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm text-gray-600"
                  onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Heure</label>
                <input required type="time" className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm text-gray-600"
                  onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>

            {/* Lieu & Type */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Lieu</label>
                <select className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none"
                  onChange={e => setFormData({...formData, lieu: e.target.value})}>
                  <option value="Domicile">Domicile</option>
                  <option value="Extérieur">Extérieur</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Compétition</label>
                <select className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none"
                  onChange={e => setFormData({...formData, competition: e.target.value})}>
                  <option value="Championnat">Championnat</option>
                  <option value="Coupe">Coupe</option>
                  <option value="Amical">Amical</option>
                  <option value="Tournoi">Tournoi</option>
                </select>
              </div>
            </div>

            <button disabled={loading} className="w-full bg-[#1a1a1a] text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:bg-[#ff9d00] transition-all shadow-xl mt-10">
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Enregistrer le match</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}