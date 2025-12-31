"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, Trash2, Loader2, CheckCircle2, 
  ChevronLeft, Users, ShieldHalf, AlertTriangle, X,
  Ban
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  nom: string;
  email: string;
  club_nom?: string;
}

interface Club {
  id: string;
  nom: string;
  ville: string;
}

export default function AdministrationBDD() {
  const [view, setView] = useState<'users' | 'clubs'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ÉTATS POUR LA MODALE PERSONNALISÉE
  const [showModal, setShowModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string, type: 'user' | 'club'} | null>(null);

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (view === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('nom');
        setProfiles(data || []);
      } else {
        const { data } = await supabase.from('clubs').select('*').order('nom');
        setClubs(data || []);
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerDelete = (id: string, name: string, type: 'user' | 'club') => {
    setItemToDelete({ id, name, type });
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(itemToDelete.id);
    const table = itemToDelete.type === 'user' ? 'profiles' : 'clubs';
    const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);

    if (!error) {
      if (itemToDelete.type === 'user') setProfiles(p => p.filter(x => x.id !== itemToDelete.id));
      else setClubs(c => c.filter(x => x.id !== itemToDelete.id));
      setShowModal(false);
    }
    setActionLoading(null);
    setItemToDelete(null);
  };

  const filteredData = (view === 'users' ? profiles : clubs).filter((item: any) =>
    (item.nom || item.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 italic uppercase font-black">
      
      {/* --- MODALE DE CONFIRMATION THÈME BLEU/ROUGE --- */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[#0f172a]/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#1e293b] border border-white/5 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div className="bg-[#ef4444]/20 p-3 rounded-2xl">
                <AlertTriangle className="text-[#ef4444]" size={24} />
              </div>
              <button onClick={() => setShowModal(false)} className="text-white/20 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <h3 className="text-2xl font-black italic mb-2 tracking-tighter">Confirmation</h3>
            <p className="text-white/40 text-[11px] leading-relaxed mb-8 tracking-widest font-bold lowercase not-italic">
              Souhaitez-vous supprimer <span className="text-white uppercase italic font-black">"{itemToDelete?.name}"</span> ? 
              Cette action est irréversible.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmDelete}
                disabled={actionLoading !== null}
                className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white py-4 rounded-2xl font-black text-[10px] tracking-[0.2em] transition-all flex items-center justify-center gap-2"
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "CONFIRMER LA SUPPRESSION"}
              </button>
              <button onClick={() => setShowModal(false)} className="w-full bg-white/5 hover:bg-white/10 text-white/40 py-4 rounded-2xl font-black text-[10px] tracking-[0.2em]">
                ANNULER
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header avec lien Dashboard rouge */}
        <Link href="/backoffice" className="text-[#ef4444] flex items-center gap-2 text-[10px] hover:underline mb-6 tracking-widest">
          <ChevronLeft size={14} /> DASHBOARD
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
          <h1 className="text-5xl md:text-6xl tracking-tighter italic uppercase">
            ADMINISTRATION <span className="text-[#ef4444] font-black italic">BDD</span>
          </h1>

          {/* TOGGLE UTILISATEURS / CLUBS STYLE IMAGE */}
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
        <div className="bg-[#1e293b]/50 border border-white/5 rounded-[2rem] p-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="w-full bg-[#1e293b] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-[#ef4444]/30 transition-all italic uppercase font-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tableau de données style image */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px] tracking-widest">
              <thead>
                <tr className="text-white/20 border-b border-white/5">
                  <th className="px-10 py-8 font-black uppercase italic">NOM / EMAIL</th>
                  <th className="px-10 py-8 font-black uppercase italic">{view === 'users' ? 'INFO / VILLE' : 'VILLE'}</th>
                  <th className="px-10 py-8 font-black uppercase italic">STATUT</th>
                  <th className="px-10 py-8 font-black uppercase italic text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-black italic uppercase">
                {loading ? (
                  <tr><td colSpan={4} className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#ef4444]" size={30} /></td></tr>
                ) : filteredData.map((item: any) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col gap-1">
                        <span className="text-white text-sm tracking-tight">{item.email || item.nom}</span>
                        <span className="text-white/30 text-[8px] font-bold not-italic">{item.nom || 'SANS NOM'}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-white/60 italic">
                      {item.club_nom || item.ville || 'AUCUN CLUB'}
                    </td>
                    <td className="px-10 py-8">
                      <span className="flex items-center gap-2 text-[#22c55e] italic">
                        <CheckCircle2 size={12} /> ACTIF
                      </span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end gap-3">
                        <button className="p-3 bg-[#f97316]/10 text-[#f97316] rounded-2xl border border-[#f97316]/20 hover:bg-[#f97316] hover:text-white transition-all">
                          <Ban size={18} />
                        </button>
                        <button 
                          onClick={() => triggerDelete(item.id, item.nom || item.email, view === 'users' ? 'user' : 'club')}
                          className="p-3 bg-[#ef4444]/10 text-[#ef4444] rounded-2xl border border-[#ef4444]/20 hover:bg-[#ef4444] hover:text-white transition-all active:scale-95"
                        >
                          <Trash2 size={18} />
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