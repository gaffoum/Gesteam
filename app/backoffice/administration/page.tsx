"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Trash2, Loader2, CheckCircle2, 
  ChevronLeft, Users, ShieldHalf, AlertTriangle, X,
  Ban, CheckSquare, Square
} from 'lucide-react';
import Link from 'next/link';

// Hook personnalisé pour le Debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Interfaces TypeScript
interface Profile {
  id: string;
  nom: string;
  email: string;
  club_nom?: string;
}

interface Club {
  id: string;
  nom: string;       
  nom_usage: string; // C'est ce champ qui sera affiché
  ville: string;
  status?: string;    
  created_at?: string;
}

export default function AdministrationBDD() {
  const [view, setView] = useState<'users' | 'clubs'>('clubs'); 
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Recherche Serveur
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Suppression & Sélection
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMultiDelete, setIsMultiDelete] = useState(false);
  const [singleItemToDelete, setSingleItemToDelete] = useState<{id: string, name: string} | null>(null);

  // --- CHARGEMENT DES DONNÉES (CÔTÉ SERVEUR) ---
  useEffect(() => {
    fetchData();
    setSelectedIds(new Set()); // Reset sélection au changement de vue
  }, [view, debouncedSearchTerm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query: any;

      if (view === 'users') {
        query = supabase.from('profiles').select('*');
        if (debouncedSearchTerm) {
          query = query.or(`nom.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%`);
        }
        query = query.order('created_at', { ascending: false }).limit(50);
      } else {
        // --- LOGIQUE CLUBS ---
        // On sélectionne tout pour récupérer 'nom_usage'
        query = supabase.from('clubs').select('*');
        
        // Filtre d'exclusion (exemple conservé)
        query = query.not('nom', 'ilike', '%américain%');
        
        // Recherche Serveur sur nom_usage ou nom
        if (debouncedSearchTerm) {
          query = query.or(`nom.ilike.%${debouncedSearchTerm}%,nom_usage.ilike.%${debouncedSearchTerm}%`);
        }
        
        // Tri
        query = query.order('created_at', { ascending: false }).limit(50);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDataList(data || []);
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTION SÉLECTION MULTIPLE ---
  const toggleSelectAll = () => {
    if (selectedIds.size === dataList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(dataList.map(item => item.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  // --- GESTION SUPPRESSION ---
  const triggerSingleDelete = (id: string, name: string) => {
    setSingleItemToDelete({ id, name });
    setIsMultiDelete(false);
    setShowModal(true);
  };

  const triggerBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setIsMultiDelete(true);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    setActionLoading(true);
    const table = view === 'users' ? 'profiles' : 'clubs';
    const idsToDelete = isMultiDelete ? Array.from(selectedIds) : [singleItemToDelete?.id];

    try {
      const { error } = await supabase.from(table).delete().in('id', idsToDelete);
      
      if (!error) {
        setDataList(prev => prev.filter(item => !idsToDelete.includes(item.id)));
        setSelectedIds(new Set());
        setShowModal(false);
      }
    } catch (err) {
      console.error("Erreur suppression", err);
    } finally {
      setActionLoading(false);
      setSingleItemToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 italic uppercase font-black">
      
      {/* --- MODALE DE CONFIRMATION --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f172a]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-white/5 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6">
              <button onClick={() => setShowModal(false)} className="text-white/20 hover:text-white transition-colors"><X size={20} /></button>
            </div>
            <div className="bg-[#ef4444]/20 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
              <AlertTriangle className="text-[#ef4444]" size={32} />
            </div>
            <h3 className="text-2xl font-black italic mb-2 tracking-tighter text-white">Confirmation</h3>
            <p className="text-white/40 text-[11px] leading-relaxed mb-8 tracking-widest font-bold lowercase not-italic">
              {isMultiDelete 
                ? `Voulez-vous vraiment supprimer ces ${selectedIds.size} éléments ?` 
                : `Souhaitez-vous supprimer "${singleItemToDelete?.name}" ?`
              }
              <br/>Cette action est <span className="text-[#ef4444] font-black uppercase">irréversible</span>.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={actionLoading}
                className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#ef4444]/20 active:scale-95"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMER LA SUPPRESSION"}
              </button>
              <button onClick={() => setShowModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-white/40 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all">
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- BARRE D'ACTION FLOTTANTE (BULK) --- */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#ef4444] text-white px-6 py-3 rounded-full shadow-2xl shadow-[#ef4444]/40 flex items-center gap-6 animate-in slide-in-from-bottom-10 border border-white/10">
          <span className="text-[10px] font-bold tracking-widest">{selectedIds.size} SÉLECTIONNÉ(S)</span>
          <div className="h-4 w-[1px] bg-white/20"></div>
          <button 
            onClick={triggerBulkDelete}
            className="flex items-center gap-2 text-[10px] font-black hover:text-black transition-colors"
          >
            <Trash2 size={14} /> SUPPRIMER
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X size={12}/></button>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Link href="/dashboard" className="text-[#ef4444] flex items-center gap-2 text-[10px] hover:underline mb-6 tracking-widest">
          <ChevronLeft size={14} /> DASHBOARD
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h1 className="text-5xl md:text-6xl tracking-tighter italic uppercase">
            ADMIN <span className="text-[#ef4444] font-black italic">BDD</span>
          </h1>

          <div className="flex bg-[#1e293b] p-1 rounded-2xl border border-white/5 shadow-xl">
            <button 
              onClick={() => setView('users')}
              className={`px-8 py-3 rounded-xl text-[10px] flex items-center gap-2 transition-all duration-300 ${view === 'users' ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20' : 'text-white/40 hover:text-white'}`}
            >
              <Users size={14} /> UTILISATEURS
            </button>
            <button 
              onClick={() => setView('clubs')}
              className={`px-8 py-3 rounded-xl text-[10px] flex items-center gap-2 transition-all duration-300 ${view === 'clubs' ? 'bg-[#ef4444] text-white shadow-lg shadow-[#ef4444]/20' : 'text-white/40 hover:text-white'}`}
            >
              <ShieldHalf size={14} /> CLUBS
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-[2rem] p-4 mb-8 backdrop-blur-sm">
          <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder={`RECHERCHER ${view === 'users' ? 'UN UTILISATEUR...' : 'UN CLUB...'}`}
              className="w-full bg-[#1e293b] border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-xs outline-none focus:border-[#ef4444]/50 focus:bg-[#1e293b]/80 transition-all italic uppercase font-black placeholder:text-white/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {loading && <div className="absolute right-4 top-1/2 -translate-y-1/2"><Loader2 className="animate-spin text-[#ef4444]" size={18}/></div>}
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl min-h-[400px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px] tracking-widest">
              <thead>
                <tr className="text-white/20 border-b border-white/5 bg-white/[0.02]">
                  {/* Colonne Checkbox */}
                  <th className="px-6 py-8 w-16 text-center">
                    <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                      {dataList.length > 0 && selectedIds.size === dataList.length ? <CheckSquare size={16} className="text-[#ef4444]" /> : <Square size={16} />}
                    </button>
                  </th>

                  {/* En-têtes conditionnels selon la vue */}
                  {view === 'users' ? (
                    <>
                      <th className="px-6 py-8 font-black uppercase italic">NOM / EMAIL</th>
                      <th className="px-6 py-8 font-black uppercase italic">INFO / VILLE</th>
                      <th className="px-6 py-8 font-black uppercase italic">STATUT</th>
                    </>
                  ) : (
                    <>
                      {/* En-tête Club modifié */}
                      <th className="px-6 py-8 font-black uppercase italic">CLUB (NOM USAGE)</th>
                      <th className="px-6 py-8 font-black uppercase italic">VILLE</th>
                      <th className="px-6 py-8 font-black uppercase italic">STATUS</th>
                    </>
                  )}
                  
                  <th className="px-6 py-8 font-black uppercase italic text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-black italic uppercase">
                {loading && dataList.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#ef4444]" size={30} /></td></tr>
                ) : dataList.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-white/20">AUCUN RÉSULTAT TROUVÉ</td></tr>
                ) : dataList.map((item: any) => (
                  <tr key={item.id} className={`hover:bg-white/5 transition-colors group ${selectedIds.has(item.id) ? 'bg-[#ef4444]/5' : ''}`}>
                    {/* Checkbox */}
                    <td className="px-6 py-8 text-center">
                      <button onClick={() => toggleSelectItem(item.id)} className="text-white/20 hover:text-white transition-colors">
                        {selectedIds.has(item.id) ? <CheckSquare size={16} className="text-[#ef4444]" /> : <Square size={16} />}
                      </button>
                    </td>

                    {/* VUE UTILISATEURS */}
                    {view === 'users' ? (
                      <>
                        <td className="px-6 py-8">
                          <div className="flex flex-col gap-1">
                            <span className="text-white text-sm tracking-tight">{item.email}</span>
                            <span className="text-white/30 text-[8px] font-bold not-italic">{item.nom}</span>
                          </div>
                        </td>
                        <td className="px-6 py-8 text-white/60 italic">
                          {item.club_nom || 'NON DÉFINI'}
                        </td>
                        <td className="px-6 py-8">
                          <span className="flex items-center gap-2 text-[#22c55e] italic">
                            <CheckCircle2 size={12} /> ACTIF
                          </span>
                        </td>
                      </>
                    ) : (
                      /* VUE CLUBS */
                      <>
                        {/* Colonne CLUB: Nom d'usage uniquement, sans ID */}
                        <td className="px-6 py-8">
                          <div className="flex flex-col gap-1">
                             <span className="text-white text-sm tracking-tight">
                               {item.nom_usage /* Affichage strict de nom_usage */}
                             </span>
                          </div>
                        </td>
                        
                        {/* Colonne VILLE */}
                        <td className="px-6 py-8 text-white/60 italic">
                          {item.ville || 'INCONNUE'}
                        </td>
                        
                        {/* Colonne STATUS */}
                        <td className="px-6 py-8">
                          <span className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-[10px]
                            ${item.status === 'actif' ? 'bg-green-500/10 text-green-500' : 
                              item.status === 'inactif' ? 'bg-red-500/10 text-red-500' : 
                              'bg-white/10 text-white/60'
                            }`}
                          >
                             {item.status ? item.status.replace('_', ' ') : 'N/A'}
                          </span>
                        </td>
                      </>
                    )}

                    {/* Colonne ACTION (Commune) */}
                    <td className="px-6 py-8 text-right">
                      <div className="flex justify-end gap-3 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button className="p-3 bg-[#f97316]/10 text-[#f97316] rounded-xl border border-[#f97316]/20 hover:bg-[#f97316] hover:text-white transition-all">
                          <Ban size={16} />
                        </button>
                        <button 
                          onClick={() => triggerSingleDelete(item.id, item.nom_usage || item.nom)}
                          className="p-3 bg-[#ef4444]/10 text-[#ef4444] rounded-xl border border-[#ef4444]/20 hover:bg-[#ef4444] hover:text-white transition-all active:scale-95"
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
      </div>
    </div>
  );
}