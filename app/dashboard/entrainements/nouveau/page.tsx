"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Calendar, Clock, AlignLeft, Shield, Loader2, ChevronDown 
} from 'lucide-react';
import Link from 'next/link';

export default function NouveauEntrainementPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<any[]>([]);
  const [themesList, setThemesList] = useState<any[]>([]); // Liste des thèmes
  
  // Formulaire
  const [formData, setFormData] = useState({
    equipe_id: "",
    date: new Date().toISOString().split('T')[0],
    heure: "19:00",
    duree: 90,
    theme: "",
    description: ""
  });

  useEffect(() => {
    const initData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.club_id) {
        // 1. Récup Equipes
        const { data: teamsData } = await supabase
          .from('equipes')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('categorie');
        setTeams(teamsData || []);
        if (teamsData && teamsData.length > 0) {
            setFormData(prev => ({ ...prev, equipe_id: teamsData[0].id }));
        }

        // 2. Récup Thèmes
        const { data: themesData } = await supabase
            .from('entrainement_themes')
            .select('*')
            .eq('club_id', profile.club_id)
            .order('titre');
        setThemesList(themesData || []);
      }
    };
    initData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user) {
            alert("Vous devez être connecté.");
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('club_id')
            .eq('id', session.user.id)
            .single();

        // Si aucun thème sélectionné et pas de thème par défaut, on met "Entraînement"
        const finalTheme = formData.theme || "Entraînement";

        const dateHeure = `${formData.date}T${formData.heure}:00`;
        
        const { data: newSession, error } = await supabase
            .from('entrainements')
            .insert([{
                club_id: profile?.club_id,
                equipe_id: formData.equipe_id,
                date_heure: dateHeure,
                duree_minutes: formData.duree,
                theme: finalTheme,
                description: formData.description
            }])
            .select()
            .single();

        if (error) throw error;

        // Pré-remplissage des participations
        const { data: joueurs } = await supabase
            .from('joueurs')
            .select('id')
            .eq('equipe_id', formData.equipe_id);

        if (joueurs && joueurs.length > 0) {
            const participations = joueurs.map(j => ({
                entrainement_id: newSession.id,
                joueur_id: j.id,
                statut: 'EN_ATTENTE'
            }));
            await supabase.from('entrainement_participations').insert(participations);
        }

        router.push(`/dashboard/entrainements/${newSession.id}`);

    } catch (err) {
        console.error(err);
        alert("Erreur lors de la création de la séance.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/entrainements" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors border border-gray-100">
                <ArrowLeft size={20}/>
            </Link>
            <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">Nouvelle Séance</h1>
                <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Programmer un entraînement</p>
            </div>
        </div>

        {/* FORMULAIRE */}
        <form onSubmit={handleSubmit} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-100">
            
            {/* 1. ÉQUIPE */}
            <div className="mb-8">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
                    <Shield size={14} /> Équipe concernée
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {teams.map(t => (
                        <div 
                            key={t.id}
                            onClick={() => setFormData({ ...formData, equipe_id: t.id })}
                            className={`cursor-pointer p-4 rounded-2xl border-2 text-center transition-all
                                ${formData.equipe_id === t.id 
                                    ? 'border-[#ff9d00] bg-[#ff9d00]/5' 
                                    : 'border-gray-100 hover:border-gray-300'}
                            `}
                        >
                            <span className={`font-black uppercase text-sm ${formData.equipe_id === t.id ? 'text-[#ff9d00]' : 'text-gray-600'}`}>
                                {t.categorie}
                            </span>
                            {t.nom !== t.categorie && <p className="text-[10px] font-bold text-gray-400">{t.nom}</p>}
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. DATE & HEURE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
                        <Calendar size={14} /> Date
                    </label>
                    <input 
                        type="date"
                        required
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-[#ff9d00]/20"
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
                            <Clock size={14} /> Heure
                        </label>
                        <input 
                            type="time"
                            required
                            value={formData.heure}
                            onChange={e => setFormData({ ...formData, heure: e.target.value })}
                            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-[#ff9d00]/20"
                        />
                    </div>
                    <div className="w-1/3">
                        <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
                            Durée
                        </label>
                        <input 
                            type="number"
                            value={formData.duree}
                            onChange={e => setFormData({ ...formData, duree: parseInt(e.target.value) })}
                            className="w-full bg-gray-50 border-none p-4 rounded-2xl font-bold text-lg outline-none focus:ring-2 focus:ring-[#ff9d00]/20 text-center"
                        />
                    </div>
                </div>
            </div>

            {/* 3. THÈME (Menu Déroulant) */}
            <div className="mb-8">
                <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest mb-3 text-gray-400">
                    <AlignLeft size={14} /> Thème de la séance
                </label>
                
                <div className="relative mb-4">
                    <select 
                        value={formData.theme}
                        onChange={e => setFormData({ ...formData, theme: e.target.value })}
                        className="w-full bg-gray-50 border-none p-4 pr-10 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]/20 appearance-none cursor-pointer"
                    >
                        <option value="">Sélectionner un thème...</option>
                        {themesList.length > 0 ? (
                            themesList.map(t => (
                                <option key={t.id} value={t.titre}>{t.titre}</option>
                            ))
                        ) : (
                            <option value="Entraînement" disabled>Aucun thème configuré</option>
                        )}
                        <option value="Autre">Autre (Saisie libre)</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={20} />
                </div>

                {/* Champ libre si "Autre" ou si aucun thème */}
                {(formData.theme === 'Autre' || (formData.theme === '' && themesList.length === 0)) && (
                    <input 
                        type="text"
                        placeholder="Saisir le thème manuellement..."
                        onChange={e => setFormData({ ...formData, theme: e.target.value })}
                        className="w-full bg-white border-2 border-gray-100 p-4 rounded-2xl font-bold outline-none focus:border-[#ff9d00] mb-4 animate-in fade-in slide-in-from-top-2"
                    />
                )}

                <textarea 
                    rows={3}
                    placeholder="Détails optionnels (exercices prévus...)"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl font-medium text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]/20 resize-none"
                />
            </div>

            {/* BOUTON SUBMIT */}
            <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-[#ff9d00] hover:text-white transition-all shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                Créer la séance
            </button>

        </form>
      </div>
    </div>
  );
}