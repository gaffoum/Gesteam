"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  ShieldAlert, 
  Activity, 
  Lock, 
  Unlock, 
  LogOut, 
  Search, 
  RefreshCw,
  Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BackofficePage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // 1. Récupérer tous les profils ayant le rôle 'admin' (Responsables de club)
    const { data: adminData } = await supabase
      .from('profiles')
      .select('*, clubs(name)')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    // 2. Récupérer les logs de connexion récents
    const { data: logData } = await supabase
      .from('login_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .limit(20);

    setAdmins(adminData || []);
    setLogs(logData || []);
    setLoading(false);
  };

  const toggleBlockStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', userId);

    if (!error) fetchData();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const filteredAdmins = admins.filter(a => 
    a.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 font-sans italic">
      <div className="max-w-7xl mx-auto">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
              System <span className="text-red-600">Control</span>
            </h1>
            <p className="text-gray-500 font-bold not-italic uppercase text-[10px] tracking-[0.4em] mt-4">
              Plateforme de gestion globale
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-white/5 hover:bg-red-600/20 text-white px-8 py-4 rounded-2xl transition-all border border-white/10 flex items-center gap-3 font-black uppercase text-[10px] tracking-widest"
          >
            <LogOut size={16} /> Quitter la session
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* COLONNE GAUCHE : GESTION DES ADMINS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 rounded-[3rem] p-8 border border-white/10">
              <div className="flex justify-between items-center mb-8 px-4">
                <h2 className="text-2xl font-black uppercase flex items-center gap-3">
                  <ShieldAlert className="text-red-600" /> Admins Clubs
                </h2>
                <div className="relative not-italic">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                  <input 
                    type="text"
                    placeholder="Rechercher un admin..."
                    className="bg-white/5 border border-white/10 rounded-xl py-2 pl-12 pr-4 text-sm focus:border-red-600 outline-none transition-all"
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredAdmins.map((admin) => (
                  <div key={admin.id} className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.05] transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black ${admin.is_blocked ? 'bg-red-600/20 text-red-600' : 'bg-green-600/20 text-green-600'}`}>
                        {admin.nom?.[0] || 'A'}
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm tracking-tight">{admin.nom} {admin.prenom}</p>
                        <p className="text-[10px] text-gray-500 font-bold not-italic">{admin.email} • {admin.clubs?.name || 'Sans club'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => toggleBlockStatus(admin.id, admin.is_blocked)}
                      className={`p-3 rounded-xl transition-all ${admin.is_blocked ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-400 hover:text-red-600'}`}
                    >
                      {admin.is_blocked ? <Lock size={18} /> : <Unlock size={18} />}
                    </button>
                  </div>
                ))}
                {filteredAdmins.length === 0 && (
                  <p className="text-center py-10 text-gray-600 font-bold uppercase text-[10px]">Aucun administrateur trouvé</p>
                )}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : STATS & LOGS */}
          <div className="space-y-8">
            {/* STATS RAPIDES */}
            <div className="bg-gradient-to-br from-red-600 to-red-900 rounded-[2.5rem] p-8 shadow-2xl shadow-red-900/20">
              <Activity size={32} className="mb-6" />
              <p className="text-white/60 font-bold uppercase text-[10px] tracking-widest mb-1">Total Connexions</p>
              <p className="text-5xl font-black">{logs.length}+</p>
            </div>

            {/* LOGS DE CONNEXION */}
            <div className="bg-white/5 rounded-[2.5rem] p-8 border border-white/10">
              <h3 className="text-sm font-black uppercase mb-6 flex items-center gap-2">
                <Clock size={16} className="text-red-600" /> Activité Récente
              </h3>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="text-[9px] border-l-2 border-red-600/30 pl-4 py-1">
                    <p className="font-black text-gray-300 uppercase">{log.role}</p>
                    <p className="text-gray-500 font-bold not-italic">{new Date(log.logged_at).toLocaleString()}</p>
                    <p className="text-red-600/50 truncate mt-1 uppercase tracking-tighter">ID: {log.user_id.substring(0,8)}...</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}