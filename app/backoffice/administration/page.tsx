"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldCheck, Users, Trash2, Ban, 
  CheckCircle, Loader2, ArrowLeft, Search, 
  AlertTriangle, Building2
} from 'lucide-react';
import Link from 'next/link';

export default function AdministrationPage() {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'users' | 'clubs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'user' | 'club' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, clubsRes] = await Promise.all([
      supabase.from('profiles').select('*, clubs(name)').order('created_at', { ascending: false }),
      supabase.from('clubs').select('*').order('name', { ascending: true })
    ]);

    if (!profilesRes.error) setUsers(profilesRes.data || []);
    if (!clubsRes.error) setClubs(clubsRes.data || []);
    setLoading(false);
  };

  const toggleBlockUser = async (userId: string, currentStatus: boolean) => {
    setActionLoading(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_blocked: !currentStatus } : u));
    }
    setActionLoading(null);
  };

  const confirmDelete = (id: string, name: string, type: 'user' | 'club') => {
    setItemToDelete({ id, name, type });
    setShowDeleteModal(true);
  };

  const handleDeleteExecute = async () => {
    if (!itemToDelete) return;
    setActionLoading(itemToDelete.id);

    try {
      if (itemToDelete.type === 'club') {
        await supabase.from('profiles').delete().eq('club_id', itemToDelete.id);
        const { error } = await supabase.from('clubs').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        setClubs(clubs.filter(c => c.id !== itemToDelete.id));
      } else {
        const { error } = await supabase.from('profiles').delete().eq('id', itemToDelete.id);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== itemToDelete.id));
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error: any) {
      alert("Erreur: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredData = view === 'users' 
    ? users.filter(u => u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || u.nom?.toLowerCase().includes(searchTerm.toLowerCase()))
    : clubs.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <Loader2 className="animate-spin text-red-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white italic p-4 md:p-12">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <Link href="/backoffice" className="text-red-500 flex items-center gap-2 mb-8 hover:gap-4 transition-all not-italic font-bold text-xs uppercase">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                ADMINISTRATION <span className="text-red-500">BDD</span>
              </h1>
            </div>

            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 not-italic">
              <button onClick={() => setView('users')} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${view === 'users' ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                <Users className="inline mr-2" size={14} /> Utilisateurs
              </button>
              <button onClick={() => setView('clubs')} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all ${view === 'clubs' ? 'bg-red-500 text-white shadow-lg' : 'text-white/40 hover:text-white'}`}>
                <Building2 className="inline mr-2" size={14} /> Clubs
              </button>
            </div>
          </div>
        </header>

        <div className="bg-[#1e293b] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <div className="p-6 md:p-8 border-b border-white/5">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text"
                placeholder="Rechercher..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-red-500/50 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left table-fixed border-collapse"> {/* table-fixed force le respect des largeurs */}
              <thead>
                <tr className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
                  <th className="p-6 w-1/2 md:w-2/5">Nom / Email</th>
                  <th className="p-6 w-1/4 md:w-1/4">Info / Ville</th>
                  {view === 'users' && <th className="p-6 w-20 md:w-32">Statut</th>}
                  <th className="p-6 text-right w-24 md:w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="not-italic">
                {filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-all">
                    <td className="p-6">
                      {/* TRUNCATE empêche le texte de déborder */}
                      <p className="font-bold text-sm uppercase truncate max-w-full block" title={view === 'users' ? item.email : item.name}>
                        {view === 'users' ? item.email : item.name}
                      </p>
                      <p className="text-[10px] text-white/30 uppercase font-black italic truncate">
                        {view === 'users' ? (item.nom || 'SANS NOM') : (item.id)}
                      </p>
                    </td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-white/60 truncate uppercase italic">
                        {view === 'users' ? (item.clubs?.name || 'AUCUN CLUB') : (item.ville || 'NON RENSEIGNÉE')}
                      </p>
                    </td>
                    {view === 'users' && (
                      <td className="p-6">
                        {item.is_blocked ? (
                          <span className="text-red-500 text-[9px] font-black uppercase italic flex items-center gap-1"><Ban size={12} /> BLOQUÉ</span>
                        ) : (
                          <span className="text-green-500 text-[9px] font-black uppercase italic flex items-center gap-1"><CheckCircle size={12} /> ACTIF</span>
                        )}
                      </td>
                    )}
                    <td className="p-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {view === 'users' && (
                          <button onClick={() => toggleBlockUser(item.id, item.is_blocked)} className={`p-3 rounded-xl transition-all ${item.is_blocked ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'} hover:scale-110`}>
                            <Ban size={16} />
                          </button>
                        )}
                        <button onClick={() => confirmDelete(item.id, view === 'users' ? item.email : item.name, view === 'users' ? 'user' : 'club')} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
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

      {/* MODALE DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-[#1e293b] w-full max-w-md rounded-[2.5rem] border border-white/10 p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
                <AlertTriangle className="text-red-500" size={40} />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 italic">Confirmation</h3>
              <p className="text-white/40 text-xs font-bold uppercase tracking-widest mb-8 leading-relaxed">
                Supprimer <span className="text-white truncate block max-w-xs">{itemToDelete?.name}</span> ?
                {itemToDelete?.type === 'club' && <span className="block text-red-500 mt-2">⚠️ SUPPRIME AUSSI TOUS LES UTILISATEURS LIÉS</span>}
              </p>
              <div className="flex flex-col w-full gap-3">
                <button onClick={handleDeleteExecute} disabled={actionLoading !== null} className="w-full bg-red-600 text-white font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2">
                  {actionLoading ? <Loader2 className="animate-spin" /> : "CONFIRMER"}
                </button>
                <button onClick={() => setShowDeleteModal(false)} className="w-full bg-white/5 text-white/50 font-black uppercase py-5 rounded-2xl text-[10px]">ANNULER</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}