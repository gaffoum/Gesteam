"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, ArrowLeft, Loader2, Trash2, 
  LayoutGrid, List, AlertTriangle, ChevronRight, CheckCircle2 
} from 'lucide-react';
import Link from 'next/link';

// Liste des catégories
const CATEGORIES = [
  "U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", 
  "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U21",
  "SENIOR", "VÉTÉRANT", "CDM"
];

const NIVEAUX_CHAMPIONNAT = [
  "Ligue 1", "Ligue 2", "National", "National 2", "National 3",
  "Régional 1", "Régional 2", "Régional 3",
  "Départemental 1", "Départemental 2", "Départemental 3"
];

export default function EquipePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [clubName, setClubName] = useState(""); // On stocke le nom brut ici
  const [clubId, setClubId] = useState("");
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, category: string} | null>(null);
  
  const [notification, setNotification] = useState<{show: boolean, type: 'error' | 'success', message: string}>({
    show: false, type: 'success', message: ''
  });

  const [selectedCategory, setSelectedCategory] = useState('SENIOR');
  const [selectedGenre, setSelectedGenre] = useState('M');
  const [selectedNiveau, setSelectedNiveau] = useState('Régional 1');
  const [actionLoading, setActionLoading] = useState(false);

  // --- FONCTION DE NETTOYAGE RADICALE ---
  const getShortName = (name: string) => {
    if (!name) return "MON CLUB";
    return name
      .toUpperCase()
      .replace("ASSOCIATION SPORTIVE", "A.S.")
      .replace("UNION SPORTIVE", "U.S.")
      .replace("FOOTBALL CLUB", "F.C.")
      .replace("SPORTING CLUB", "S.C.")
      .replace(/\b(ASSOCIATION|LES|ANCIENS|DE|L'|LA|DU|DES|D')\b/g, "")
      .replace(/\s+/g, ' ')
      .trim();
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id, clubs(nom)')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        setClubId(profile.club_id);
        setClubName((profile.clubs as any)?.nom || "");
        
        const { data: teamData } = await supabase
          .from('equipes')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });
        
        if (teamData) setEquipes(teamData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Reste des fonctions (Add, Delete, Notify) identiques...
  const showNotify = (type: 'error' | 'success', message: string) => {
    setNotification({ show: true, type, message });
    if (type === 'success') setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const fullCategoryName = `${selectedCategory} ${selectedGenre}`;
      const { error } = await supabase.from('equipes').insert([{ 
        club_id: clubId, nom: clubName, categorie: fullCategoryName, niveau_championnat: selectedNiveau 
      }]);
      if (error) throw error;
      setShowAddModal(false);
      await fetchInitialData();
      showNotify('success', "ÉQUIPE AJOUTÉE !");
    } catch (err: any) { showNotify('error', err.message); } 
    finally { setActionLoading(false); }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      await supabase.from('equipes').delete().eq('id', itemToDelete.id);
      setEquipes(equipes.filter(e => e.id !== itemToDelete.id));
      setShowDeleteModal(false);
      showNotify('success', "SUPPRIMÉ.");
    } finally { setActionLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]"><Loader2 className="animate-spin text-[#ff9d00]" size={40} /></div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER : ICI ON FORCE LE NETTOYAGE DANS LE RENDU */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-5xl tracking-tighter text-black leading-none">
                {getShortName(clubName)} <span className="text-[#ff9d00]">EFFECTIF</span>
              </h1>
              <p className="text-gray-400 text-[10px] tracking-[0.3em] mt-2 font-bold not-italic">
                GESTION DE : <span className="text-black">{getShortName(clubName)}</span>
              </p>
            </div>
          </div>
          <button onClick={() => setShowAddModal(true)} className="bg-black text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-[#ff9d00] flex items-center gap-3 shadow-2xl">
            <Plus size={20} /> AJOUTER UNE ÉQUIPE
          </button>
        </div>

        {/* TOOLBAR & GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {equipes.filter(e => e.categorie.toLowerCase().includes(searchTerm.toLowerCase())).map((equipe) => (
            <div key={equipe.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-[#ff9d00]/40 transition-all group relative overflow-hidden text-center">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-black text-[#ff9d00] rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg">
                  {equipe.categorie.substring(0,3)}
                </div>
                <button onClick={() => { setItemToDelete({id: equipe.id, category: equipe.categorie}); setShowDeleteModal(true); }} className="text-gray-200 hover:text-red-500 p-2"><Trash2 size={18} /></button>
              </div>
              <h3 className="text-3xl text-black tracking-tighter mb-1 leading-tight">
                <span className="text-[#ff9d00] block text-[10px] tracking-[0.3em] mb-2">
                  {getShortName(clubName)}
                </span>
                {equipe.categorie}
              </h3>
              <p className="text-gray-400 text-[9px] font-black tracking-widest mb-8 border-b border-gray-50 pb-4">
                {equipe.niveau_championnat}
              </p>
              <Link href={`/dashboard/joueurs?cat=${equipe.id}`} className="text-[10px] text-black hover:text-[#ff9d00] font-black tracking-widest flex items-center justify-center gap-2">
                GÉRER L'EFFECTIF <ChevronRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* ... (Modales Add/Delete/Notify identiques au code précédent) ... */}
        {/* MODALE D'AJOUT */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-gray-100 font-black animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-black uppercase leading-none">NOUVELLE <span className="text-[#ff9d00]">ÉQUIPE</span></h2>
              <form onSubmit={handleAddCategory} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">1. CATÉGORIE</label>
                    <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100">
                      {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">2. GENRE</label>
                    <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100">
                      <option value="M">MASCULIN</option>
                      <option value="F">FÉMININ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">3. CHAMPIONNAT</label>
                  <select value={selectedNiveau} onChange={(e) => setSelectedNiveau(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100">
                    {NIVEAUX_CHAMPIONNAT.map((label) => (<option key={label} value={label}>{label}</option>))}
                  </select>
                </div>
                <div className="pt-6 space-y-3">
                  <button type="submit" disabled={actionLoading} className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl hover:bg-[#ff9d00] transition-all flex items-center justify-center">
                    {actionLoading ? <Loader2 className="animate-spin" /> : "CONFIRMER L'AJOUT"}
                  </button>
                  <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest">ANNULER</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {notification.show && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-black text-center">
            <div className={`bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border ${notification.type === 'error' ? 'border-red-100' : 'border-green-100'}`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                {notification.type === 'error' ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h3 className={`text-xl font-black mb-2 ${notification.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {notification.type === 'error' ? 'ALERTE' : 'SUCCÈS'}
              </h3>
              <p className="text-gray-500 text-[11px] mb-8 italic not-italic">{notification.message}</p>
              <button onClick={() => setNotification({ ...notification, show: false })} className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>FERMER</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}