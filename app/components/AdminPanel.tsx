"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, Ban, CheckCircle, Eye, Search, ArrowLeft, User, Trophy } from 'lucide-react';

export default function AdminPanel() {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [activeTab, setActiveTab] = useState<'clubs' | 'users'>('clubs');
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  
  // Data
  const [clubs, setClubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [detailsClub, setDetailsClub] = useState<any>(null);
  const [detailsEquipes, setDetailsEquipes] = useState<any[]>([]);
  
  // UI
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (view === 'list') fetchData();
  }, [view, activeTab]);

  useEffect(() => {
    if (view === 'details' && selectedClubId) fetchDetails(selectedClubId);
  }, [view, selectedClubId]);

  // --- LOGIQUE DE RÉCUPÉRATION ---
  const fetchData = async () => {
    setLoading(true);
    if (activeTab === 'clubs') {
      const { data } = await supabase.from('clubs').select('*, profiles(count), equipes(count)').order('created_at', { ascending: false });
      setClubs(data || []);
    } else {
      const { data } = await supabase.from('profiles').select('*, clubs(name)').order('created_at', { ascending: false });
      setUsers(data || []);
    }
    setLoading(false);
  };

  const fetchDetails = async (id: string) => {
    setLoading(true);
    const { data: c } = await supabase.from('clubs').select('*, profiles(*)').eq('id', id).single();
    const { data: e } = await supabase.from('equipes').select('*, joueurs(*)').eq('club_id', id);
    setDetailsClub(c);
    setDetailsEquipes(e || []);
    setLoading(false);
  };

  // --- LOGIQUE D'ACTIONS ---
  const handleClubAction = async (id: string, action: 'block' | 'delete' | 'activate') => {
    if (!confirm(`Action : ${action} ?`)) return;
    if (action === 'delete') {
      await supabase.from('clubs').delete().eq('id', id);
    } else {
      await supabase.from('clubs').update({ status: action === 'block' ? 'blocked' : 'active' }).eq('id', id);
    }
    fetchData();
  };

  const handleBulkUserAction = async (status: 'blocked' | 'active') => {
    if (!selectedUsers.length) return;
    await supabase.from('profiles').update({ status }).in('id', selectedUsers);
    setSelectedUsers([]);
    fetchData();
  };

  // --- RENDER ---
  const filteredList = (activeTab === 'clubs' ? clubs : users).filter(item => 
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  // VUE DÉTAILS D'UN CLUB
  if (view === 'details' && detailsClub) {
    return (
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-right-4">
        <button onClick={() => setView('list')} className="mb-6 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors">
          <ArrowLeft size={16}/> Retour à la liste
        </button>
        
        <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-6">
          <div>
            <h1 className="text-3xl font-black uppercase text-[#1a1a1a]">{detailsClub.name}</h1>
            <p className="text-gray-400 font-bold text-sm">{detailsClub.ville} • {detailsClub.code_postal}</p>
          </div>
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full border border-gray-100" style={{background: detailsClub.primary_color}}></div>
            <div className="w-8 h-8 rounded-full border border-gray-100" style={{background: detailsClub.secondary_color}}></div>
            {detailsClub.tertiary_color && <div className="w-8 h-8 rounded-full border border-gray-100" style={{background: detailsClub.tertiary_color}}></div>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2"><User size={18}/> Staff ({detailsClub.profiles?.length})</h3>
            <div className="space-y-2">
              {detailsClub.profiles?.map((p: any) => (
                <div key={p.id} className="bg-white p-3 rounded-xl text-sm font-bold flex justify-between">
                  <span>{p.full_name || p.email}</span>
                  <span className="text-[10px] uppercase bg-gray-100 px-2 rounded text-gray-500">{p.role}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl">
            <h3 className="font-black uppercase mb-4 flex items-center gap-2"><Trophy size={18}/> Équipes ({detailsEquipes.length})</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {detailsEquipes.map((e: any) => (
                <div key={e.id} className="bg-white p-3 rounded-xl border border-gray-100">
                  <div className="font-bold text-sm mb-1">{e.name}</div>
                  <div className="text-xs text-gray-400">{e.joueurs?.length || 0} joueurs</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // VUE LISTE (TABLEAU DE BORD)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('clubs')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'clubs' ? 'bg-white shadow text-[#1a1a1a]' : 'text-gray-400'}`}>Clubs</button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${activeTab === 'users' ? 'bg-white shadow text-[#1a1a1a]' : 'text-gray-400'}`}>Coachs</button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            className="pl-9 pr-4 py-2 bg-gray-50 rounded-xl text-xs font-bold outline-none focus:ring-1 focus:ring-[#ff9d00]" 
            placeholder="Rechercher..." 
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 font-bold text-xs uppercase animate-pulse">Chargement des données...</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] uppercase font-black text-gray-400">
              <tr>
                {activeTab === 'users' && <th className="p-4 w-10">Select</th>}
                <th className="p-4">Nom</th>
                <th className="p-4">{activeTab === 'clubs' ? 'Localisation' : 'Club'}</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-xs font-bold text-gray-600">
              {filteredList.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  
                  {/* CHECKBOX USER */}
                  {activeTab === 'users' && (
                    <td className="p-4">
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setSelectedUsers([...selectedUsers, item.id]);
                        else setSelectedUsers(selectedUsers.filter(id => id !== item.id));
                      }} checked={selectedUsers.includes(item.id)}/>
                    </td>
                  )}

                  {/* NOM / EMAIL */}
                  <td className="p-4 text-[#1a1a1a]">
                    {activeTab === 'clubs' ? item.name : (item.email || item.full_name)}
                    {activeTab === 'clubs' && <div className="text-[10px] text-gray-400 mt-1">{item.equipes[0].count} éq • {item.profiles[0].count} coachs</div>}
                  </td>

                  {/* VILLE / CLUB */}
                  <td className="p-4">
                    {activeTab === 'clubs' ? `${item.ville} (${item.code_postal})` : (item.clubs?.name || "-")}
                  </td>

                  {/* STATUT */}
                  <td className="p-4">
                    {item.status === 'blocked' 
                      ? <span className="text-red-500 bg-red-50 px-2 py-1 rounded-md">Bloqué</span> 
                      : <span className="text-green-500 bg-green-50 px-2 py-1 rounded-md">Actif</span>}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-4 flex justify-end gap-2">
                    {activeTab === 'clubs' && (
                      <>
                        <button onClick={() => { setSelectedClubId(item.id); setView('details'); }} className="p-1.5 bg-gray-100 rounded hover:bg-[#ff9d00] hover:text-white"><Eye size={14}/></button>
                        <button onClick={() => handleClubAction(item.id, item.status === 'blocked' ? 'activate' : 'block')} className="p-1.5 bg-gray-100 rounded hover:bg-gray-200"><Ban size={14}/></button>
                        <button onClick={() => handleClubAction(item.id, 'delete')} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 size={14}/></button>
                      </>
                    )}
                    {activeTab === 'users' && (
                      <span className="text-[10px] text-gray-300 italic">Via sélection</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* FOOTER ACTION MASSE USERS */}
      {activeTab === 'users' && selectedUsers.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-[#1a1a1a] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 z-50">
          <span className="text-xs font-bold">{selectedUsers.length} coachs sélectionnés</span>
          <div className="h-4 w-px bg-white/20"></div>
          <button onClick={() => handleBulkUserAction('active')} className="text-xs font-black uppercase hover:text-green-400">Activer</button>
          <button onClick={() => handleBulkUserAction('blocked')} className="text-xs font-black uppercase hover:text-red-400">Bloquer</button>
        </div>
      )}
    </div>
  );
}