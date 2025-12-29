"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  User, 
  Hash, 
  Calendar, 
  Phone, 
  Mail, 
  Shield, 
  Trophy,
  Users
} from 'lucide-react';
import Link from 'next/link';

export default function NewPlayerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clubId, setClubId] = useState<string | null>(null);

  // État du formulaire aligné sur ton nouveau schéma SQL
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    poste: '',
    maillot: '', // Sera converti en integer (ex-numero)
    telephone: '',
    categorie: '',
    licence: '',
    email: '',
    date_naissance: '',
    equipe_concernee: ''
  });

  useEffect(() => {
    const getClub = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.club_id) setClubId(profile.club_id);
    };
    getClub();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubId) return alert("Erreur : Club non identifié. Veuillez vous reconnecter.");
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('joueurs')
        .insert([{
          ...formData,
          maillot: formData.maillot ? parseInt(formData.maillot) : null, // Conversion integer pour le schéma
          club_id: clubId
        }]);

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm hover:text-[#ff9d00] transition-all group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          <div className="text-right">
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#1a1a1a]">Nouveau <span className="text-[#ff9d00]">Joueur</span></h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em]">Enregistrement effectif club</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 space-y-8 not-italic">
          
          {/* Section Identité */}
          <div className="space-y-4">
            <h3 className="text-[#ff9d00] font-black uppercase text-xs tracking-widest flex items-center gap-2 italic">
              <User size={14} /> Identité & État Civil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" placeholder="Prénom"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                onChange={e => setFormData({...formData, prenom: e.target.value})}
              />
              <input 
                type="text" placeholder="Nom" required
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                onChange={e => setFormData({...formData, nom: e.target.value})}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="date"
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all text-gray-500"
                onChange={e => setFormData({...formData, date_naissance: e.target.value})}
              />
            </div>
          </div>

          {/* Section Sportive */}
          <div className="space-y-4">
            <h3 className="text-[#ff9d00] font-black uppercase text-xs tracking-widest flex items-center gap-2 italic">
              <Trophy size={14} /> Profil Sportif
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <select 
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm appearance-none"
                onChange={e => setFormData({...formData, poste: e.target.value})}
              >
                <option value="">Poste sur le terrain</option>
                <option value="Gardien">Gardien</option>
                <option value="Défenseur">Défenseur</option>
                <option value="Milieu">Milieu</option>
                <option value="Attaquant">Attaquant</option>
              </select>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="number" placeholder="N° de Maillot"
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                  onChange={e => setFormData({...formData, maillot: e.target.value})}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input 
                type="text" placeholder="Catégorie (ex: U17, Séniors...)"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                onChange={e => setFormData({...formData, categorie: e.target.value})}
              />
              <input 
                type="text" placeholder="Équipe concernée"
                className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                onChange={e => setFormData({...formData, equipe_concernee: e.target.value})}
              />
            </div>
          </div>

          {/* Section Contact & Administratif */}
          <div className="space-y-4">
            <h3 className="text-[#ff9d00] font-black uppercase text-xs tracking-widest flex items-center gap-2 italic">
              <Shield size={14} /> Administratif & Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="tel" placeholder="Téléphone"
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                  onChange={e => setFormData({...formData, telephone: e.target.value})}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input 
                  type="email" placeholder="Email contact"
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                 <input 
                  type="text" placeholder="Numéro de Licence"
                  className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
                  onChange={e => setFormData({...formData, licence: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-[#1a1a1a] text-white p-6 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/5"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18}/> Enregistrer le joueur</>}
          </button>
        </form>
      </div>
    </div>
  );
}