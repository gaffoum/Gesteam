"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, LayoutDashboard, LogOut, Search, Trash2, Ban, CheckCircle, Menu, X, Users, Trophy, Activity, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

// IMPORT DU NOUVEAU COMPOSANT
import AdminConfirmModal from '@/app/components/AdminConfirmModal';

export default function SuperAdminPage() {
  const router = useRouter();
  
  // États de l'interface
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'clubs' | 'users'>('clubs');
  const [search, setSearch] = useState("");
  
  // Données
  const [clubs, setClubs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // Sélection
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // --- NOUVEL ÉTAT POUR LA MODAL ---
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'warning';
    pendingAction?: () => void; // La fonction à exécuter si on clique sur "Confirmer"
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: 'warning'
  });

  useEffect(() => { checkAccess(); }, []);
  useEffect(() => { if (user) fetchData(); }, [activeTab, user]);

  const checkAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.email !== 'gaffoum@gmail.com') {
      router.push('/dashboard');
      return;
    }
    setUser(session.user);
  };

  const fetchData = async () => {
    setLoading(true);
    setSelectedClubs([]); setSelectedUsers([]);
    try {
      if (activeTab === 'clubs') {
        const { data } = await supabase.from('clubs').select('*, profiles(count), equipes(count)').order('created_at', { ascending: false });
        setClubs(data || []);
      } else {
        const { data } = await supabase.from('profiles').select('*, clubs(name)').order('created_at', { ascending: false });
        setUsers(data || []);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const toggleSelect = (id: string) => {
    if (activeTab === 'clubs') setSelectedClubs(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    else setSelectedUsers(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = activeTab === 'clubs' ? clubs : users;
    const allIds = list.map(item => item.id);
    if (activeTab === 'clubs') setSelectedClubs(e.target.checked ? allIds : []);
    else setSelectedUsers(e.target.checked ? allIds : []);
  };

  // --- FONCTION PRÉPARATOIRE (Affiche la Modal) ---
  const requestAction = (action: 'delete' | 'block' | 'activate', targetIds: string[] | string) => {
    const ids = Array.isArray(targetIds) ? targetIds : [targetIds];
    if (ids.length === 0) return;

    // Configuration des textes de la modal
    let title = "Confirmation Requise";
    let message = `Vous êtes sur le point d'appliquer une action sur ${ids.length} élément(s).`;
    let type: 'danger' | 'warning' = 'warning';

    if (action === 'delete') {
      title = "Suppression Définitive";
      message = `ATTENTION : Vous allez supprimer définitivement ${ids.length} élément(s). Cette action est irréversible et effacera toutes les données liées (équipes, joueurs, etc.).`;
      type = 'danger';
    } else if (action === 'block') {
      title = "Bloquer l'accès";
      message = "Ces utilisateurs ou clubs ne pourront plus accéder à la plateforme.";
      type = 'danger';
    } else {
      title = "Réactivation";
      message = "Ces comptes seront de nouveau autorisés à se connecter.";
    }

    // On ouvre la modal et on prépare l'action
    setModalConfig({
      isOpen: true,
      title,
      message,
      type,
      pendingAction: () => executeAction(action, ids)
    });
  };

  // --- FONCTION D'EXÉCUTION RÉELLE (Appelée par la Modal) ---
  const executeAction = async (action: 'delete' | 'block' | 'activate', ids: string[]) => {
    setModalConfig(prev => ({ ...prev, isOpen: false })); // Fermer la modal
    setLoading(true);
    
    const table = activeTab === 'clubs' ? 'clubs' : 'profiles';
    try {
      if (action === 'delete') {
        await supabase.from(table).delete().in('id', ids);
      } else {
        const status = action === 'block' ? 'blocked' : 'active';
        await supabase.from(table).update({ status }).in('id', ids);
      }
      fetchData();
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/login'); };

  const filteredList = (activeTab === 'clubs' ? clubs : users).filter(item => 
    JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] flex font-sans text-slate-200 selection:bg-red-600 selection:text-white">
      
      {/* --- INJECTION DE LA MODAL --- */}
      <AdminConfirmModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={() => modalConfig.pendingAction && modalConfig.pendingAction()}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1e293b] border-r border-slate-700/50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 flex flex-col p-8 shadow-2xl`}>
        <div className="mb-12 select-none">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-2">
            <ShieldAlert className="text-red-600" /> <span>Gesteam</span>
          </h2>
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-[0.3em] mt-2 pl-1">Command Center</p>
        </div>
        <nav className="space-y-3 flex-1">
          <Link href="/backoffice" className="p-4 hover:bg-slate-700/50 rounded-xl flex items-center gap-3 text-slate-400 hover:text-white font-bold uppercase text-xs transition-all group">
            <ArrowLeft size={18} className="group-hover:text-red-500 transition-colors"/> Retour Root
          </Link>
          <div className="p-4 bg-red-600/10 border border-red-600/20 text-red-500 rounded-xl flex items-center gap-3 font-bold uppercase text-xs cursor-default shadow-[0_0_15px_rgba(220,38,38,0.1)]">
            <Activity size={18} /> Administration BDD
          </div>
        </nav>
        <div className="pt-8 border-t border-slate-700/50">
          <button onClick={handleLogout} className="w-full p-4 bg-slate-800 text-slate-400 rounded-xl font-bold uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENT */}
      <div className="flex-1 lg:ml-0 p-6 lg:p-12 overflow-y-auto min-h-screen relative">
         <header className="lg:hidden flex justify-between items-center mb-8">
            <span className="font-black uppercase text-white tracking-widest text-sm">Backoffice</span>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-2 bg-slate-800 rounded-lg"><Menu /></button>
         </header>

         <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-white leading-none mb-2">Base de <span className="text-red-600">Données</span></h1>
              <p className="text-slate-500 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Système Opérationnel</p>
            </div>
            <div className="bg-[#1e293b] p-1.5 rounded-2xl shadow-xl border border-slate-700/50 flex gap-1">
               <button onClick={() => setActiveTab('clubs')} className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${activeTab === 'clubs' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                 <Trophy size={14}/> Clubs <span className="opacity-50 text-[9px] ml-1 bg-black/20 px-1.5 rounded-full">{clubs.length}</span>
               </button>
               <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-black uppercase text-xs tracking-wider transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}>
                 <Users size={14}/> Users <span className="opacity-50 text-[9px] ml-1 bg-black/20 px-1.5 rounded-full">{users.length}</span>
               </button>
            </div>
         </header>

         <div className="mb-8 relative max-w-xl group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder={activeTab === 'clubs' ? "Rechercher un club par nom, ville..." : "Rechercher un utilisateur par email..."}
              className="w-full pl-14 pr-6 py-5 bg-[#1e293b] border border-slate-700 rounded-2xl text-sm font-bold text-white outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/20 transition-all placeholder:text-slate-600 shadow-lg"
              onChange={(e) => setSearch(e.target.value)}
            />
         </div>

         <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl border border-slate-700/50 overflow-hidden min-h-[500px] relative">
            {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4 bg-[#1e293b]/80 backdrop-blur-sm z-10">
                   <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                   <span className="font-black uppercase text-xs tracking-widest animate-pulse">Accès aux serveurs...</span>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#0f172a] text-[10px] uppercase font-black text-slate-500 tracking-widest border-b border-slate-800">
                            <tr>
                                <th className="p-6 w-16 text-center">
                                    <input type="checkbox" className="w-4 h-4 accent-red-600 cursor-pointer bg-slate-700 border-slate-600 rounded focus:ring-0 focus:ring-offset-0" onChange={toggleSelectAll} checked={filteredList.length > 0 && (activeTab === 'clubs' ? selectedClubs.length === filteredList.length : selectedUsers.length === filteredList.length)} />
                                </th>
                                <th className="p-6">{activeTab === 'clubs' ? 'Identité Club' : 'Identité Utilisateur'}</th>
                                <th className="p-6">{activeTab === 'clubs' ? 'Détails' : 'Rattachement'}</th>
                                <th className="p-6">Statut</th>
                                <th className="p-6 text-right">Actions Rapides</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-sm font-bold text-slate-300">
                            {filteredList.map((item: any) => {
                                const isSelected = activeTab === 'clubs' ? selectedClubs.includes(item.id) : selectedUsers.includes(item.id);
                                return (
                                    <tr key={item.id} className={`transition-all duration-200 ${isSelected ? 'bg-red-600/10' : 'hover:bg-slate-800/50'}`}>
                                        <td className="p-6 text-center">
                                            <input type="checkbox" className="w-4 h-4 accent-red-600 cursor-pointer rounded" checked={isSelected} onChange={() => toggleSelect(item.id)} />
                                        </td>
                                        <td className="p-6">
                                          <div className={`font-black text-base ${isSelected ? 'text-red-400' : 'text-white'}`}>
                                            {activeTab === 'clubs' ? item.name : (item.full_name || item.email)}
                                          </div>
                                          <div className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-2">
                                            {activeTab === 'clubs' ? (
                                              <><span className="w-1 h-1 bg-slate-600 rounded-full"></span> {item.ville} ({item.code_postal})</>
                                            ) : (
                                              <><span className="w-1 h-1 bg-slate-600 rounded-full"></span> {item.email}</>
                                            )}
                                          </div>
                                        </td>
                                        <td className="p-6">
                                          {activeTab === 'clubs' ? (
                                            <div className="flex gap-2">
                                              <span className="bg-[#0f172a] border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-slate-400 font-mono">{item.profiles?.[0]?.count || 0} Coachs</span>
                                              <span className="bg-[#0f172a] border border-slate-700 px-2 py-1 rounded-lg text-[10px] text-slate-400 font-mono">{item.equipes?.[0]?.count || 0} Équipes</span>
                                            </div>
                                          ) : (
                                            <span className="text-slate-400 text-xs bg-[#0f172a] px-3 py-1 rounded-full border border-slate-800">{item.clubs?.name || "Sans Club"}</span>
                                          )}
                                        </td>
                                        <td className="p-6">
                                            {item.status === 'blocked' 
                                              ? <span className="inline-flex items-center gap-1 text-red-500 bg-red-950/30 border border-red-900/50 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm"><Ban size={12}/> Bloqué</span>
                                              : <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-sm"><CheckCircle size={12}/> Actif</span>
                                            }
                                        </td>
                                        <td className="p-6 text-right">
                                          <div className="flex justify-end gap-2">
                                             <button 
                                               onClick={() => requestAction(item.status === 'blocked' ? 'activate' : 'block', item.id)}
                                               className={`p-2 rounded-lg transition-colors ${item.status === 'blocked' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'}`}
                                             >
                                                {item.status === 'blocked' ? <CheckCircle size={16}/> : <Ban size={16}/>}
                                             </button>
                                             <button 
                                               onClick={() => requestAction('delete', item.id)}
                                               className="p-2 bg-slate-800 text-slate-500 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                             >
                                                <Trash2 size={16} />
                                             </button>
                                          </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* BULK ACTIONS FLOATING BAR */}
        {((activeTab === 'clubs' && selectedClubs.length > 0) || (activeTab === 'users' && selectedUsers.length > 0)) && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white p-3 pl-6 rounded-full shadow-[0_20px_50px_rgba(220,38,38,0.4)] flex items-center gap-6 animate-in slide-in-from-bottom-20 z-50 border-4 border-[#0f172a] group hover:scale-105 transition-transform duration-300">
             <div className="font-black text-sm flex flex-col leading-none">
               <span className="text-[10px] opacity-80 uppercase tracking-wider">Sélection</span>
               <span>{activeTab === 'clubs' ? selectedClubs.length : selectedUsers.length}</span>
             </div>
             <div className="h-6 w-px bg-white/30"></div>
             <div className="flex gap-1">
                <button onClick={() => requestAction('activate', activeTab === 'clubs' ? selectedClubs : selectedUsers)} className="hover:bg-black/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                   <CheckCircle size={14} /> Activer
                </button>
                <button onClick={() => requestAction('block', activeTab === 'clubs' ? selectedClubs : selectedUsers)} className="hover:bg-black/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all">
                   <Ban size={14} /> Bloquer
                </button>
                <button onClick={() => requestAction('delete', activeTab === 'clubs' ? selectedClubs : selectedUsers)} className="bg-white text-red-600 hover:bg-gray-100 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ml-2 shadow-sm">
                   <Trash2 size={14} /> Supprimer
                </button>
             </div>
             <button onClick={() => { setSelectedClubs([]); setSelectedUsers([]); }} className="p-2 bg-black/10 rounded-full hover:bg-black/20 transition-all ml-2">
               <X size={16} />
             </button>
          </div>
        )}

      </div>
    </div>
  );
}