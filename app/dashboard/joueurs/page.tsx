"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Plus, Search, User as UserIcon, ArrowLeft, 
  Loader2, Trash2, LayoutGrid, List, Share2, ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

export default function JoueursPage() {
  const [loading, setLoading] = useState(true);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchJoueurs();
  }, []);

  const fetchJoueurs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('joueurs')
        .select('*')
        .order('nom', { ascending: true });
      
      if (error) throw error;
      setJoueurs(data || []);
    } catch (err) {
      console.error("Erreur chargement joueurs:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = (id: string) => {
    const token = btoa(`player-${id}`); 
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    alert("LIEN D'INVITATION COPIÉ !");
  };

  const filteredJoueurs = joueurs.filter(j => 
    `${j.prenom} ${j.nom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-5xl tracking-tighter text-black italic leading-none">
                Effectif <span className="text-[#ff9d00]">Joueurs</span>
              </h1>
              <p className="text-gray-400 text-[10px] tracking-[0.4em] mt-2 font-bold italic not-italic">
                Gestion des fiches et invitations coach.
              </p>
            </div>
          </div>
          <Link href="/dashboard/joueurs/nouveau" className="bg-black text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-2xl active:scale-95">
            <Plus size={20} /> AJOUTER UN JOUEUR
          </Link>
        </div>

        {/* BARRE DE RECHERCHE & TOGGLE */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="flex-1 relative bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center">
            <Search className="absolute left-6 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="RECHERCHER UN JOUEUR..." 
              className="w-full p-4 pl-14 rounded-2xl bg-gray-50 border-none outline-none font-black text-[10px] text-black italic uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex gap-2">
            <button 
              onClick={() => setViewMode('grid')} 
              className={`p-4 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-lg' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')} 
              className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-lg' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* AFFICHAGE DES DONNÉES */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJoueurs.map((joueur) => (
              <div key={joueur.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-[#ff9d00]/40 transition-all group relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-14 h-14 bg-black text-[#ff9d00] rounded-2xl flex items-center justify-center font-black italic text-xl">
                      {joueur.numero || '?'}
                    </div>
                    <button onClick={() => generateInviteLink(joueur.id)} className="text-gray-300 hover:text-[#ff9d00] transition-colors p-2">
                      <Share2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-2xl text-black tracking-tighter mb-1 italic">{joueur.prenom} {joueur.nom}</h3>
                  <p className="text-gray-400 text-[9px] tracking-widest font-black mb-8 italic">{joueur.poste || 'MILIEU'}</p>
                  <Link href={`/dashboard/joueurs/${joueur.id}`} className="flex items-center gap-2 text-[10px] text-[#ff9d00] font-black hover:gap-4 transition-all">
                    CONSULTER LA FICHE <ChevronRight size={14} />
                  </Link>
                </div>
                <UserIcon className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-[#ff9d00]/5 transition-all duration-700" size={150} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left italic">
              <tbody className="divide-y divide-gray-50">
                {filteredJoueurs.map((joueur) => (
                  <tr key={joueur.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-black text-[#ff9d00] rounded-xl flex items-center justify-center text-xs font-black italic">{joueur.numero || '?'}</div>
                        <span className="text-black font-black text-sm uppercase">{joueur.prenom} {joueur.nom}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-gray-400 text-[10px] font-black">{joueur.poste}</td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => generateInviteLink(joueur.id)} className="p-3 text-gray-300 hover:text-[#ff9d00] transition-colors"><Share2 size={18} /></button>
                        <Link href={`/dashboard/joueurs/${joueur.id}`} className="p-3 text-gray-300 hover:text-black transition-colors"><ChevronRight size={18} /></Link>
                        <button className="p-3 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredJoueurs.length === 0 && !loading && (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[4rem]">
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic">AUCUN JOUEUR TROUVÉ</p>
          </div>
        )}
      </div>
    </div>
  );
}