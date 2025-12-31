"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Search, Users, ArrowLeft, 
  ChevronRight, Loader2, Trash2, LayoutGrid, List, AlertTriangle, X 
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  "U6", "U7", "U8", "U9", "U10", "U11", "U12", "U13", 
  "U14", "U15", "U16", "U17", "U18", "U19", "U20", "U21",
  "SENIOR", "VÉTÉRANT", "CDM"
];

export default function EquipePage() {
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modales
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, name: string} | null>(null);
  
  // Formulaire
  const [newEquipeName, setNewEquipeName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SENIOR');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEquipes();
  }, []);

  const fetchEquipes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('*')
        .order('nom', { ascending: true });
      if (error) throw error;
      setEquipes(data || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipe = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('equipes')
        .insert([{ nom: newEquipeName, categorie: selectedCategory }]);
      if (error) throw error;
      setNewEquipeName('');
      setShowAddModal(false);
      fetchEquipes();
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('equipes').delete().eq('id', itemToDelete.id);
      if (error) throw error;
      setEquipes(equipes.filter(e => e.id !== itemToDelete.id));
      setShowDeleteModal(false);
      setItemToDelete(null);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEquipes = equipes.filter(e => 
    e.nom.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.categorie.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

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
              <h1 className="text-5xl tracking-tighter text-black italic">
                Mon <span className="text-[#ff9d00]">Effectif</span>
              </h1>
              <p className="text-gray-400 text-[10px] tracking-[0.4em] mt-1 font-bold italic not-italic">gestion globale de vos catégories.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-black text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-2xl active:scale-95"
          >
            <Plus size={20} /> AJOUTER UNE ÉQUIPE
          </button>
        </div>

        {/* BARRE D'OUTILS (RECHERCHE + TOGGLE) */}
        <div className="flex flex-col lg:flex-row gap-4 mb-10">
          <div className="flex-1 relative bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex items-center">
            <Search className="absolute left-6 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="RECHERCHER UNE ÉQUIPE OU UNE CATÉGORIE..." 
              className="w-full p-4 pl-14 rounded-2xl bg-gray-50 border-none outline-none font-black text-[10px] text-black italic uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="bg-white p-2 rounded-3xl border border-gray-100 shadow-sm flex gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-4 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-lg shadow-[#ff9d00]/20' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-4 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-lg shadow-[#ff9d00]/20' : 'text-gray-300 hover:bg-gray-50'}`}
            >
              <List size={20} />
            </button>
          </div>
        </div>

        {/* AFFICHAGE DES ÉQUIPES */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredEquipes.map((equipe) => (
              <div key={equipe.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:border-[#ff9d00]/40 transition-all group relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-black text-[#ff9d00] rounded-xl flex items-center justify-center">
                      <Users size={24} />
                    </div>
                    <button 
                      onClick={() => { setItemToDelete({id: equipe.id, name: equipe.nom}); setShowDeleteModal(true); }}
                      className="text-gray-200 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <h3 className="text-2xl text-black tracking-tighter mb-2 italic">{equipe.nom}</h3>
                  <span className="inline-block bg-[#ff9d00]/10 text-[#ff9d00] text-[9px] px-3 py-1 rounded-full tracking-widest font-black">
                    {equipe.categorie}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-left italic">
              <thead>
                <tr className="bg-gray-50 text-gray-400 text-[10px] tracking-[0.2em] border-b border-gray-100">
                  <th className="px-10 py-6">ÉQUIPE</th>
                  <th className="px-10 py-6">CATÉGORIE</th>
                  <th className="px-10 py-6 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredEquipes.map((equipe) => (
                  <tr key={equipe.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-6 text-black font-black text-sm">{equipe.nom}</td>
                    <td className="px-10 py-6 text-gray-400 text-[10px]">{equipe.categorie}</td>
                    <td className="px-10 py-6 text-right">
                      <button 
                        onClick={() => { setItemToDelete({id: equipe.id, name: equipe.nom}); setShowDeleteModal(true); }}
                        className="p-3 text-gray-200 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODALE SUPPRESSION (THEME LIGHT) */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex justify-between items-start mb-6">
                <div className="p-4 bg-red-50 text-red-500 rounded-2xl italic"><AlertTriangle size={24}/></div>
                <button onClick={() => setShowDeleteModal(false)} className="text-gray-300 hover:text-black"><X size={20}/></button>
              </div>
              <h2 className="text-2xl font-black tracking-tighter mb-4 text-black">SUPPRIMER <span className="text-red-500">L'ÉQUIPE</span> ?</h2>
              <p className="text-gray-400 text-[11px] leading-relaxed mb-8 italic not-italic">Voulez-vous supprimer "{itemToDelete?.name}" ? Cette action effacera également les données liées.</p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full bg-red-500 text-white py-4 rounded-2xl font-black text-[10px] tracking-widest hover:bg-red-600 transition-all">
                  {actionLoading ? <Loader2 className="animate-spin mx-auto"/> : "CONFIRMER LA SUPPRESSION"}
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full py-4 text-gray-400 font-black text-[10px] tracking-widest">ANNULER</button>
              </div>
            </div>
          </div>
        )}

        {/* MODALE AJOUT (RESTE INCHANGÉE) */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
              <h2 className="text-3xl font-black italic tracking-tighter mb-8 text-black">NOUVELLE <span className="text-[#ff9d00]">ÉQUIPE</span></h2>
              <form onSubmit={handleAddEquipe} className="space-y-6">
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-2 font-bold">NOM DE L'ÉQUIPE</label>
                  <input required type="text" placeholder="EX: SENIOR A" className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic uppercase focus:ring-2 ring-[#ff9d00]/20" value={newEquipeName} onChange={(e) => setNewEquipeName(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-2 font-bold">CHOISIR LA CATÉGORIE</label>
                  <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 outline-none font-black text-sm italic uppercase cursor-pointer">
                    {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <button type="submit" className="w-full bg-[#ff9d00] text-white py-5 rounded-2xl font-black text-[10px] tracking-widest shadow-lg shadow-[#ff9d00]/20 hover:bg-black transition-all">
                  {actionLoading ? <Loader2 className="animate-spin mx-auto"/> : "CONFIRMER L'AJOUT"}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}