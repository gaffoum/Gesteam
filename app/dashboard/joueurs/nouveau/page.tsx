"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  UserPlus, ArrowLeft, Loader2, Save, 
  User, Hash, Shield, Phone, Mail, Trophy 
} from 'lucide-react';
import Link from 'next/link';

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [equipes, setEquipes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    poste: 'Attaquant',
    maillot: '',
    equipe_id: '' // ID de l'équipe sélectionnée
  });

  useEffect(() => {
    fetchEquipes();
  }, []);

  const fetchEquipes = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const { data: profile } = await supabase
      .from('profiles').select('club_id').eq('id', session?.user.id).single();
    
    if (profile?.club_id) {
      const { data } = await supabase
        .from('equipes')
        .select('id, nom')
        .eq('club_id', profile.club_id);
      setEquipes(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase
        .from('profiles').select('club_id').eq('id', session?.user.id).single();

      const { error } = await supabase.from('joueurs').insert([{
        ...formData,
        maillot: formData.maillot ? parseInt(formData.maillot) : null,
        equipe_id: formData.equipe_id || null,
        club_id: profile?.club_id
      }]);

      if (error) throw error;
      router.push('/dashboard/joueurs');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/joueurs" className="flex items-center gap-2 text-gray-400 hover:text-[#ff9d00] mb-8 transition-all group">
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Retour</span>
        </Link>

        <div className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-100">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-10">
            Nouveau <span className="text-[#ff9d00]">Joueur</span>
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6 not-italic">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Prénom</label>
                <input required className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/20"
                  onChange={e => setFormData({...formData, prenom: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Nom</label>
                <input required className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/20"
                  onChange={e => setFormData({...formData, nom: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Assigner à une équipe</label>
              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  className="w-full p-5 pl-12 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none cursor-pointer"
                  onChange={e => setFormData({...formData, equipe_id: e.target.value})}
                >
                  <option value="">Aucune équipe (Indépendant)</option>
                  {equipes.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.nom}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">Poste</label>
                <select className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none"
                  onChange={e => setFormData({...formData, poste: e.target.value})}>
                  <option value="Gardien">Gardien</option>
                  <option value="Défenseur">Défenseur</option>
                  <option value="Milieu">Milieu</option>
                  <option value="Attaquant">Attaquant</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2 italic tracking-widest">N° Maillot</label>
                <input type="number" className="w-full p-5 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm"
                  onChange={e => setFormData({...formData, maillot: e.target.value})} />
              </div>
            </div>

            <button disabled={loading} className="w-full bg-[#1a1a1a] text-white p-6 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-4 hover:bg-[#ff9d00] transition-all shadow-xl mt-10">
              {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Créer le joueur</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}