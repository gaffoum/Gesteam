"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Search, 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  ChevronRight, 
  CheckCircle2,
  Download, 
  Upload, 
  ShieldHalf
} from 'lucide-react';
import Link from 'next/link';

// --- CONSTANTES ---
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

  // --- ÉTATS (STATE) ---
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [equipes, setEquipes] = useState<any[]>([]);
  
  // États pour les informations du club
  const [clubName, setClubName] = useState<string>(""); 
  const [clubId, setClubId] = useState<string | null>(null); 
  
  // États pour l'interface utilisateur
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // États pour les modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, category: string} | null>(null);
  
  // Référence pour l'upload de fichier
  const fileInputRef = useRef<HTMLInputElement>(null);

  // État pour les notifications
  const [notification, setNotification] = useState<{show: boolean, type: 'error' | 'success', message: string}>({
    show: false, type: 'success', message: ''
  });

  // États pour le formulaire d'ajout
  const [selectedCategory, setSelectedCategory] = useState('SENIOR');
  const [selectedGenre, setSelectedGenre] = useState('M');
  const [selectedNiveau, setSelectedNiveau] = useState('Régional 1');
  const [actionLoading, setActionLoading] = useState(false);

  // --- CHARGEMENT DES DONNÉES ---
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Vérification de la session utilisateur
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { 
        router.push('/login'); 
        return; 
      }

      // 2. Récupération du profil pour avoir le club_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) throw profileError;

      if (profile?.club_id) {
        setClubId(profile.club_id);

        // 3. Récupération des infos du CLUB (Nom d'usage prioritaire)
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('nom, nom_usage')
            .eq('id', profile.club_id)
            .single();

        if (!clubError && clubData) {
            // On affiche le nom_usage s'il existe, sinon le nom officiel
            const displayName = clubData.nom_usage || clubData.nom || "";
            setClubName(displayName);
        }

        // 4. Récupération de la liste des ÉQUIPES
        const { data: teamData, error: teamError } = await supabase
          .from('equipes')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });
        
        if (!teamError && teamData) {
          setEquipes(teamData);
        }
      } else {
         console.warn("Aucun club associé au profil utilisateur.");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- GESTION DES NOTIFICATIONS ---
  const showNotify = (type: 'error' | 'success', message: string) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
    }
  };

  // --- FONCTIONNALITÉS CSV (IMPORT / EXPORT) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Sécurité : On vérifie que le club est bien identifié
    if (!clubId) {
        showNotify('error', "Impossible d'importer : Club non identifié.");
        return;
    }

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) { 
        setImporting(false); 
        return; 
      }

      const rows = text.split('\n');
      const teamsToInsert = [];

      // On saute la première ligne (en-têtes)
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(',');
        if (rowData.length < 2) continue;

        const categorie = rowData[0]?.trim();
        const niveau = rowData[1]?.trim();

        if (categorie && niveau) {
          teamsToInsert.push({
            club_id: clubId,
            nom: clubName, 
            categorie: categorie,
            niveau_championnat: niveau
          });
        }
      }

      if (teamsToInsert.length > 0) {
        const { error } = await supabase.from('equipes').insert(teamsToInsert);
        if (!error) {
          showNotify('success', `${teamsToInsert.length} ÉQUIPES IMPORTÉES !`);
          fetchInitialData();
        } else {
          console.error(error);
          showNotify('error', "Erreur lors de l'import CSV.");
        }
      }
      setImporting(false);
      // Reset de l'input file
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const headers = "categorie,niveau_championnat";
    const example = "SENIOR M,Régional 1\nU15 F,Départemental 2";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "modele_equipes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- GESTION AJOUT ÉQUIPE ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sécurité critique pour éviter l'erreur UUID
    if (!clubId) {
        showNotify('error', "Erreur : Votre compte n'est lié à aucun club.");
        return;
    }

    setActionLoading(true);
    try {
      const fullCategoryName = `${selectedCategory} ${selectedGenre}`;
      
      const { error } = await supabase.from('equipes').insert([{ 
        club_id: clubId, 
        nom: clubName, 
        categorie: fullCategoryName, 
        niveau_championnat: selectedNiveau 
      }]);

      if (error) throw error;
      
      setShowAddModal(false);
      await fetchInitialData();
      showNotify('success', "ÉQUIPE AJOUTÉE !");
    } catch (err: any) { 
      console.error(err);
      showNotify('error', "Erreur technique lors de l'ajout."); 
    } finally { 
      setActionLoading(false); 
    }
  };

  // --- GESTION SUPPRESSION ---
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      await supabase.from('equipes').delete().eq('id', itemToDelete.id);
      setEquipes(equipes.filter(e => e.id !== itemToDelete.id));
      setShowDeleteModal(false);
      showNotify('success', "SUPPRIMÉ.");
    } catch (err) {
      console.error(err);
      showNotify('error', "Erreur lors de la suppression.");
    } finally { 
      setActionLoading(false); 
    }
  };

  // --- RENDU : LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  // Filtrage des équipes pour la recherche
  const filteredEquipes = equipes.filter(e => 
    e.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
          
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl tracking-tighter text-black italic leading-none">
                {/* Affiche le Nom d'Usage récupéré */}
                {clubName || 'MON CLUB'} <span className="text-[#ff9d00]">ÉQUIPES</span>
              </h1>
              {/* LIGNE DE SOUS-TITRE SUPPRIMÉE ICI COMME DEMANDÉ */}
            </div>
          </div>

          {/* Boutons d'action (CSV + Ajout) */}
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={handleDownloadTemplate} 
              className="bg-black text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Download size={16} /> <span className="hidden lg:inline">MODÈLE CSV</span>
            </button>
            
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            
            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importing} 
              className="bg-black text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} 
              <span className="hidden lg:inline">{importing ? "IMPORT..." : "IMPORTER CSV"}</span>
            </button>
            
            <button 
              onClick={() => setShowAddModal(true)} 
              className="bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Plus size={16} /> AJOUTER UNE ÉQUIPE
            </button>
          </div>
        </div>

        {/* --- BARRE DE RECHERCHE & TOGGLE --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="RECHERCHER UNE CATÉGORIE..." 
              className="w-full bg-white border border-gray-100 rounded-[2rem] py-5 pl-14 pr-6 text-xs font-black italic outline-none focus:ring-2 focus:ring-[#ff9d00]/20 transition-all shadow-sm placeholder:text-gray-300 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-1">
            {/* TOGGLE VUE GRILLE : Orange si actif */}
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={20} />
            </button>
            {/* TOGGLE VUE LISTE : Orange si actif */}
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* --- CONTENU PRINCIPAL --- */}
        {viewMode === 'grid' ? (
          // --- VUE GRILLE ---
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEquipes.map((equipe) => (
              <div key={equipe.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#ff9d00] hover:shadow-xl transition-all group relative overflow-hidden text-center">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 bg-black text-[#ff9d00] rounded-2xl flex items-center justify-center text-xl font-black italic shadow-lg">
                    {equipe.categorie.substring(0,3)}
                  </div>
                  <button 
                    onClick={() => { setItemToDelete({id: equipe.id, category: equipe.categorie}); setShowDeleteModal(true); }} 
                    className="text-gray-200 hover:text-red-500 p-2 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <h3 className="text-3xl text-black tracking-tighter mb-1 leading-tight italic">
                  <span className="text-[#ff9d00] block text-[10px] tracking-[0.3em] mb-2 font-bold not-italic">
                    {clubName}
                  </span>
                  {equipe.categorie}
                </h3>
                <p className="text-gray-400 text-[9px] font-black tracking-widest mb-8 border-b border-gray-50 pb-4">
                  {equipe.niveau_championnat}
                </p>
                <Link 
                  href={`/dashboard/joueurs?cat=${equipe.id}`} 
                  className="bg-[#ff9d00]/10 text-[#ff9d00] px-4 py-3 rounded-xl text-[9px] font-black hover:bg-[#ff9d00] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  GÉRER L'EFFECTIF <ChevronRight size={12} />
                </Link>
                <ShieldHalf className="absolute -right-8 -bottom-8 text-gray-50/80 group-hover:text-[#ff9d00]/5 transition-all duration-500 transform group-hover:scale-110" size={160} />
              </div>
            ))}
          </div>
        ) : (
          // --- VUE LISTE ---
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
              <table className="w-full text-left italic">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] tracking-widest">
                  <tr>
                    <th className="px-10 py-6 font-black">CATÉGORIE</th>
                    <th className="px-10 py-6 font-black">NIVEAU</th>
                    <th className="px-10 py-6 font-black text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEquipes.map((equipe) => (
                    <tr key={equipe.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-black text-[#ff9d00] rounded-xl flex items-center justify-center text-xs font-black italic shadow-md">
                            {equipe.categorie.substring(0,3)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-black font-black text-sm uppercase">{equipe.categorie}</span>
                            <span className="text-gray-400 text-[10px] font-bold">{clubName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-gray-400 text-[10px] font-black">
                        {equipe.niveau_championnat}
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex justify-end gap-2">
                           <Link 
                             href={`/dashboard/joueurs?cat=${equipe.id}`} 
                             className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-black hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm"
                           >
                             <ChevronRight size={16} />
                           </Link>
                           <button 
                             onClick={() => { setItemToDelete({id: equipe.id, category: equipe.categorie}); setShowDeleteModal(true); }} 
                             className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
             </div>
          </div>
        )}

        {/* --- ÉTAT VIDE (EMPTY STATE) --- */}
        {filteredEquipes.length === 0 && !loading && (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] mt-8 bg-white/50">
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic">AUCUNE ÉQUIPE TROUVÉE</p>
            <p className="text-gray-300/50 text-[10px] mt-2 font-bold">Ajoutez des équipes ou importez un fichier CSV.</p>
          </div>
        )}

        {/* --- MODALE D'AJOUT --- */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-gray-100 font-black animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-black uppercase leading-none">NOUVELLE <span className="text-[#ff9d00]">ÉQUIPE</span></h2>
              <form onSubmit={handleAddCategory} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">1. CATÉGORIE</label>
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)} 
                      className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100 text-black"
                    >
                      {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">2. GENRE</label>
                    <select 
                      value={selectedGenre} 
                      onChange={(e) => setSelectedGenre(e.target.value)} 
                      className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100 text-black"
                    >
                      <option value="M">MASCULIN</option>
                      <option value="F">FÉMININ</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-2 uppercase">3. CHAMPIONNAT</label>
                  <select 
                    value={selectedNiveau} 
                    onChange={(e) => setSelectedNiveau(e.target.value)} 
                    className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic border border-gray-100 text-black"
                  >
                    {NIVEAUX_CHAMPIONNAT.map((label) => (<option key={label} value={label}>{label}</option>))}
                  </select>
                </div>
                <div className="pt-6 space-y-3">
                  <button 
                    type="submit" 
                    disabled={actionLoading} 
                    className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl hover:bg-[#ff9d00] transition-all flex items-center justify-center"
                  >
                    {actionLoading ? <Loader2 className="animate-spin" /> : "CONFIRMER L'AJOUT"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-black"
                  >
                    ANNULER
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODALE DE SUPPRESSION --- */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border border-gray-100 font-black animate-in zoom-in duration-300 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h2 className="text-xl font-black italic tracking-tighter mb-2 text-black">SUPPRIMER ?</h2>
              <p className="text-gray-400 text-[11px] mb-8 not-italic">
                Voulez-vous vraiment supprimer l'équipe <span className="text-black font-bold">{itemToDelete?.category}</span> ?
              </p>
              <div className="space-y-3">
                <button 
                  onClick={confirmDelete} 
                  disabled={actionLoading} 
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest shadow-lg hover:bg-red-600 transition-all flex justify-center"
                >
                  {actionLoading ? <Loader2 className="animate-spin" /> : "OUI, SUPPRIMER"}
                </button>
                <button 
                  onClick={() => setShowDeleteModal(false)} 
                  className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-black"
                >
                  ANNULER
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS --- */}
        {notification.show && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4 font-black text-center animate-in fade-in">
            <div className={`bg-white w-full max-w-sm rounded-[2.5rem] p-10 shadow-2xl border ${notification.type === 'error' ? 'border-red-100' : 'border-green-100'}`}>
              <div className={`w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                {notification.type === 'error' ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
              </div>
              <h3 className={`text-xl font-black mb-2 ${notification.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                {notification.type === 'error' ? 'ALERTE' : 'SUCCÈS'}
              </h3>
              <p className="text-gray-500 text-[11px] mb-8 italic not-italic">
                {notification.message}
              </p>
              <button 
                onClick={() => setNotification({ ...notification, show: false })} 
                className={`w-full py-4 rounded-2xl font-black text-[10px] tracking-widest ${notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}
              >
                FERMER
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}