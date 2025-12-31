"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Trash2, 
  Ban, 
  CheckCircle, 
  Eye, 
  Search, 
  ArrowLeft, 
  ShieldAlert,
  X
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'clubs' | 'users'>('clubs');
  const [clubs, setClubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // --- ÉTATS POUR LA SÉLECTION MULTIPLE ---
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    // On vide les sélections quand on change d'onglet pour éviter les erreurs
    setSelectedClubs([]); 
    setSelectedUsers([]);

    if (activeTab === 'clubs') {
      const { data } = await supabase
        .from('clubs')
        .select('*, profiles(count), equipes(count)')
        .order('created_at', { ascending: false });
      setClubs(data || []);
    } else {
      const { data } = await supabase
        .from('profiles')
        .select('*, clubs(name)')
        .order('created_at', { ascending: false });
      setUsers(data || []);
    }
    setLoading(false);
  };

  // --- LOGIQUE DE SÉLECTION (GENERIQUE) ---
  const toggleSelect = (id: string, type: 'club' | 'user') => {
    if (type === 'club') {
      setSelectedClubs(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedUsers(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    }
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>, list: any[], type: 'club' | 'user') => {
    if (e.target.checked) {
      const allIds = list.map(item => item.id);
      type === 'club' ? setSelectedClubs(allIds) : setSelectedUsers(allIds);
    } else {
      type === 'club' ? setSelectedClubs([]) : setSelectedUsers([]);
    }
  };

  // --- ACTIONS DE MASSE (BULK) ---
  
  // 1. Supprimer plusieurs Clubs
  const handleBulkDeleteClubs = async () => {
    if (!confirm(`ATTENTION : Vous allez supprimer définitivement ${selectedClubs.length} clubs et toutes leurs données (équipes, joueurs, matchs).\n\nContinuer ?`)) return;
    
    setLoading(true);
    const { error } = await supabase.from('clubs').delete().in('id', selectedClubs);
    
    if (error) alert("Erreur suppression : " + error.message);
    else {
      setSelectedClubs([]);
      fetchData();
    }
  };

  // 2. Actions sur plusieurs Utilisateurs (Bloquer / Activer / Supprimer)
  const handleBulkUsers = async (action: 'block' | 'activate' | 'delete') => {
    const count = selectedUsers.length;
    if (!confirm(`Voulez-vous vraiment ${action === 'delete' ? 'SUPPRIMER' : action === 'block' ? 'BLOQUER' : 'ACTIVER'} ces ${count} utilisateurs ?`)) return;

    setLoading(true);

    if (action === 'delete') {
      // Suppression
      await supabase.from('profiles').delete().in('id', selectedUsers);
    } else {
      // Changement de statut
      const status = action === 'block' ? 'blocked' : 'active';
      await supabase.from('profiles').update({ status }).in('id', selectedUsers);
    }

    setSelectedUsers([]);
    fetchData();
  };


  // --- ACTIONS INDIVIDUELLES ---
  const handleClubAction = async (id: string, action: 'block' | 'delete' | 'activate') => {
    if (!confirm(`Confirmation : ${action} ce club ?`)) return;
    if (action === 'delete') await supabase.from('clubs').delete().eq('id', id);
    else await supabase.from('clubs').update({ status: action === 'block' ? 'blocked' : 'active' }).eq('id', id);
    fetchData();
  };

  // Filtrage
  const filteredList = (activeTab === 'clubs' ? clubs : users).filter(item => 
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[#1a1a1a]">
      
      {/* HEADER FIXE */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-xl font-black uppercase text-red-600 leading-none flex items-center gap-2">
              <ShieldAlert size={24}/> Administration
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
              Super Admin Access
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        
        {/* BARRE D'OUTILS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          
          {/* Onglets */}
          <div className="bg-white p-1 rounded-2xl border border-gray-200 shadow-sm flex">
             <button 
               onClick={() => setActiveTab('clubs')} 
               className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all ${activeTab === 'clubs' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
             >
               Clubs ({clubs.length})
             </button>
             <button 
               onClick={() => setActiveTab('users')} 
               className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all ${activeTab === 'users' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}
             >
               Utilisateurs ({users.length})
             </button>
          </div>

          {/* Recherche */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Rechercher nom, ville, email..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-[#ff9d00] shadow-sm transition-all"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* TABLEAUX DE DONNÉES */}
        <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden min-h-[500px]">
          {loading ? (
            <div className="p-10 text-center text-gray-400 font-bold animate-pulse">Chargement...</div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400 tracking-widest border-b border-gray-100">
                <tr>
                  {/* CHECKBOX "TOUT SÉLECTIONNER" */}
                  <th className="p-6 w-14 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded cursor-pointer accent-[#1a1a1a]"
                      onChange={(e) => toggleSelectAll(e, filteredList, activeTab === 'clubs' ? 'club' : 'user')}
                      checked={filteredList.length > 0 && (activeTab === 'clubs' ? selectedClubs.length === filteredList.length : selectedUsers.length === filteredList.length)}
                    />
                  </th>
                  
                  <th className="p-6">{activeTab === 'clubs' ? 'Nom du Club' : 'Utilisateur'}</th>
                  <th className="p-6">{activeTab === 'clubs' ? 'Localisation' : 'Rôle / Club'}</th>
                  <th className="p-6">Statut</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm font-bold text-gray-600">
                {filteredList.map((item: any) => {
                  const isSelected = activeTab === 'clubs' ? selectedClubs.includes(item.id) : selectedUsers.includes(item.id);
                  
                  return (
                    <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-orange-50/50' : 'hover:bg-gray-50'}`}>
                      
                      {/* CHECKBOX LIGNE */}
                      <td className="p-6 text-center">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded cursor-pointer accent-[#1a1a1a]"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id, activeTab === 'clubs' ? 'club' : 'user')}
                        />
                      </td>

                      <td className="p-6 text-[#1a1a1a]">
                        {activeTab === 'clubs' ? item.name : (item.full_name || item.email)}
                        {activeTab === 'clubs' && <div className="text-[10px] text-gray-400 mt-1">{item.equipes[0]?.count || 0} éq • {item.profiles[0]?.count || 0} coachs</div>}
                        {activeTab === 'users' && <div className="text-[10px] text-gray-400 mt-1">{item.email}</div>}
                      </td>

                      <td className="p-6">
                        {activeTab === 'clubs' 
                          ? `${item.ville} (${item.code_postal})` 
                          : (item.clubs?.name || <span className="text-gray-300 italic">Sans club</span>)
                        }
                      </td>

                      <td className="p-6">
                        {item.status === 'blocked' 
                          ? <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">Bloqué</span>
                          : <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-3 py-1 rounded-full text-[10px] font-black uppercase">Actif</span>
                        }
                      </td>

                      <td className="p-6 flex justify-end gap-2">
                        {activeTab === 'clubs' && (
                          <Link href={`/admin/clubs/${item.id}`} className="p-2 bg-gray-100 rounded-lg hover:bg-[#ff9d00] hover:text-white transition-colors">
                            <Eye size={16} />
                          </Link>
                        )}
                        
                        {/* Actions Rapides Individuelles */}
                        <button 
                          onClick={() => handleClubAction(item.id, item.status === 'blocked' ? 'activate' : 'block')}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          title={item.status === 'blocked' ? 'Débloquer' : 'Bloquer'}
                        >
                          {item.status === 'blocked' ? <CheckCircle size={16} className="text-green-600"/> : <Ban size={16} className="text-orange-600"/>}
                        </button>
                        
                        <button 
                          onClick={() => handleClubAction(item.id, 'delete')}
                          className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- BARRE D'ACTIONS FLOTTANTE (BULK ACTIONS) --- */}
      {/* Apparaît uniquement si des éléments sont sélectionnés */}
      
      {((activeTab === 'clubs' && selectedClubs.length > 0) || (activeTab === 'users' && selectedUsers.length > 0)) && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a1a] text-white p-4 rounded-3xl shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-10 z-50 border-4 border-white/10 backdrop-blur-sm">
          
          <div className="flex items-center gap-3 pl-2">
            <span className="bg-[#ff9d00] text-[#1a1a1a] w-8 h-8 rounded-full flex items-center justify-center font-black text-xs">
              {activeTab === 'clubs' ? selectedClubs.length : selectedUsers.length}
            </span>
            <span className="text-xs font-bold uppercase tracking-wide">Sélectionnés</span>
          </div>
          
          <div className="h-8 w-px bg-white/20"></div>

          <div className="flex items-center gap-2">
            
            {/* Actions pour CLUBS */}
            {activeTab === 'clubs' && (
              <button 
                onClick={handleBulkDeleteClubs}
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                <Trash2 size={14} /> Supprimer Définitivement
              </button>
            )}

            {/* Actions pour USERS */}
            {activeTab === 'users' && (
              <>
                <button onClick={() => handleBulkUsers('activate')} className="hover:bg-green-600/20 text-green-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                  <CheckCircle size={14} /> Activer
                </button>
                <button onClick={() => handleBulkUsers('block')} className="hover:bg-orange-600/20 text-orange-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                  <Ban size={14} /> Bloquer
                </button>
                <button onClick={() => handleBulkUsers('delete')} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ml-2">
                  <Trash2 size={14} /> Supprimer
                </button>
              </>
            )}
          </div>

          {/* Bouton Annuler */}
          <button 
            onClick={() => { setSelectedClubs([]); setSelectedUsers([]); }}
            className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

    </div>
  );
}