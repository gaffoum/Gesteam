"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Plus, Trash2, AlignLeft, Loader2, Sparkles, Check, X 
} from 'lucide-react';
import Link from 'next/link';

// Liste des thèmes standards
const DEFAULT_THEMES = [
  "Physique", "Technique", "Tactique", "Mise en place",
  "Jeu réduit", "Match / Opposition", "Spécifique Gardien", "Récupération"
];

export default function GestionThemesPage() {
  const [loading, setLoading] = useState(true);
  const [themes, setThemes] = useState<any[]>([]);
  const [newTheme, setNewTheme] = useState("");
  const [adding, setAdding] = useState(false);
  
  // État pour la modale
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session.user.id).single();
      
      if (profile?.club_id) {
          const { data } = await supabase
            .from('entrainement_themes')
            .select('*')
            .eq('club_id', profile.club_id)
            .order('titre', { ascending: true });
          setThemes(data || []);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  // 1. Déclenché par le formulaire : Ouvre la modale
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTheme.trim()) return;
    setIsModalOpen(true); // Ouvre la modale au lieu d'envoyer
  };

  // 2. Déclenché par la modale : Envoie vraiment les données
  const confirmAddTheme = async () => {
    setAdding(true);

    try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session!.user.id).single();

        const { data, error } = await supabase
            .from('entrainement_themes')
            .insert([{ club_id: profile?.club_id, titre: newTheme.trim() }])
            .select()
            .single();

        if (error) throw error;
        
        setThemes([...themes, data]);
        setNewTheme(""); // Reset champ
        setIsModalOpen(false); // Ferme modale
    } catch (err) {
        console.error(err);
        alert("Erreur lors de l'ajout.");
    } finally {
        setAdding(false);
    }
  };

  const handleAddDefaults = async () => {
      if(!confirm("Ajouter les thèmes standards (Physique, Tactique...) ?")) return;
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session!.user.id).single();

        const existingTitles = themes.map(t => t.titre.toLowerCase());
        const toAdd = DEFAULT_THEMES.filter(t => !existingTitles.includes(t.toLowerCase())).map(t => ({
            club_id: profile?.club_id,
            titre: t
        }));

        if (toAdd.length > 0) {
            const { data, error } = await supabase.from('entrainement_themes').insert(toAdd).select();
            if (error) throw error;
            setThemes([...themes, ...(data || [])]);
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce thème ?")) return;
    await supabase.from('entrainement_themes').delete().eq('id', id);
    setThemes(themes.filter(t => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-2xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/entrainements" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors border border-gray-100">
                    <ArrowLeft size={20}/>
                </Link>
                <div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter">Thèmes</h1>
                    <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Configuration des séances</p>
                </div>
            </div>
            
            <button 
                onClick={handleAddDefaults}
                className="bg-white text-black border border-gray-200 px-4 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2 shadow-sm"
            >
                <Sparkles size={14} /> Auto-Remplir
            </button>
        </div>

        {/* FORMULAIRE (Déclenche handlePreSubmit) */}
        <form onSubmit={handlePreSubmit} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex gap-4 items-center">
            <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-gray-400 mb-1 block pl-2">Nouveau Thème</label>
                <input 
                    type="text" 
                    placeholder="Ex: Jeu de possession..." 
                    value={newTheme}
                    onChange={(e) => setNewTheme(e.target.value)}
                    className="w-full bg-gray-50 border-none px-4 py-3 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]/20"
                />
            </div>
            <button 
                type="submit" 
                disabled={!newTheme}
                className="bg-black text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-[#ff9d00] transition-all disabled:opacity-50 mt-4 shadow-lg"
            >
                <Plus size={24}/>
            </button>
        </form>

        {/* LISTE */}
        <div className="space-y-3">
            {loading ? <div className="text-center p-8 text-gray-400 text-xs italic">Chargement...</div> : 
             themes.length === 0 ? (
                 <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-gray-200 rounded-[2rem] gap-4">
                     <p className="text-gray-400 text-xs font-bold italic">Aucun thème configuré.</p>
                     <button onClick={handleAddDefaults} className="text-[#ff9d00] font-black uppercase text-xs underline">Cliquez ici pour ajouter les thèmes de base</button>
                 </div>
             ) :
             themes.map(t => (
                <div key={t.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm group">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#ff9d00]/10 text-[#ff9d00] rounded-xl flex items-center justify-center">
                            <AlignLeft size={20} />
                        </div>
                        <span className="font-black uppercase text-sm">{t.titre}</span>
                    </div>
                    <button onClick={() => handleDelete(t.id)} className="text-gray-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                </div>
            ))}
        </div>

      </div>

      {/* --- MODALE DE CONFIRMATION (GESTEAM PRO LIGHT) --- */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200 p-4">
              <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
                  
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-[#ff9d00]/10 text-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-4">
                          <Plus size={32} />
                      </div>
                      <h3 className="text-2xl font-black italic uppercase text-black mb-2">Confirmer l'ajout</h3>
                      <p className="text-gray-500 font-medium text-sm">
                          Voulez-vous ajouter le thème <br/> 
                          <span className="text-black font-black uppercase">"{newTheme}"</span> ?
                      </p>
                  </div>

                  <div className="flex gap-3">
                      <button 
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 bg-gray-50 text-black py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                          <X size={16} /> Annuler
                      </button>
                      
                      <button 
                          onClick={confirmAddTheme}
                          disabled={adding}
                          className="flex-1 bg-black text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-colors shadow-xl flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                          {adding ? <Loader2 className="animate-spin" size={16}/> : <Check size={16} />}
                          Confirmer
                      </button>
                  </div>

              </div>
          </div>
      )}

    </div>
  );
}