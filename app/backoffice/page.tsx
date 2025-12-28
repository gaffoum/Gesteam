"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, 
  ShieldCheck, 
  Ban, 
  CheckCircle, 
  Search, 
  Activity,
  User
} from 'lucide-react';

export default function BackofficePage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // On récupère 'full_name' au lieu de 'nom' pour correspondre à la BDD
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*, clubs(name)')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });

    const { data: logsData } = await supabase
      .from('login_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setAdmins(profilesData || []);
    setLogs(logsData || []);
    setLoading(false);
  };

  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', id);

    if (!error) fetchData();
  };

  const filteredAdmins = admins.filter(admin => 
    admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex italic">
      {/* Sidebar Gauche - Style Gesteam */}
      <div className="w-80 bg-[#1a1a1a] p-8 text-white flex flex-col">
        <div className="mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Gesteam <span className="text-[#ff9d00]">Root</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 tracking-[0.3em] mt-1">Super Admin Control</p>
        </div>

        <nav className="space-y-4 flex-1 not-italic">
          <div className="p-4 bg-[#ff9d00] rounded-2xl flex items-center gap-3 text-[#1a1a1a] font-black uppercase text-xs">
            <Users size={18} /> Gestion Admins
          </div>
          <div className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 font-black uppercase text-xs transition-all cursor-not-allowed">
            <Activity size={18} /> Logs Système
          </div>
        </nav>

        <div className="pt-8 border-t border-white/10">
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="w-full p-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all"
          >
            Déconnexion Root
          </button>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="flex-1 p-12 overflow-y-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">Console <span className="text-[#ff9d00]">Admins</span></h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-xs tracking-widest mt-2">Validez ou bloquez les responsables de club</p>
          </div>

          <div className="relative not-italic">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un admin..."
              className="pl-12 pr-6 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#ff9d00] outline-none font-bold text-sm w-80 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Liste des Admins */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden not-italic">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Responsable</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Club / Ville</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Statut</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50/30 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-[#1a1a1a]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm">{admin.full_name || 'Sans nom'}</p>
                        <p className="text-xs text-gray-400 font-medium">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="font-black uppercase text-xs text-[#ff9d00]">{admin.clubs?.name || 'En attente...'}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{admin.clubs?.ville || 'Non renseigné'}</p>
                  </td>
                  <td className="p-8 text-center">
                    {admin.is_blocked ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-600 rounded-full text-[9px] font-black uppercase">
                        <Ban size={12} /> Bloqué
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-600 rounded-full text-[9px] font-black uppercase">
                        <CheckCircle size={12} /> Actif
                      </span>
                    )}
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => toggleBlockStatus(admin.id, admin.is_blocked)}
                      className={`p-4 rounded-2xl transition-all ${
                        admin.is_blocked 
                        ? 'bg-green-500 text-white hover:bg-green-600 shadow-lg shadow-green-200' 
                        : 'bg-[#1a1a1a] text-white hover:bg-red-500 shadow-lg shadow-gray-200'
                      }`}
                    >
                      {admin.is_blocked ? <ShieldCheck size={18} /> : <Ban size={18} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAdmins.length === 0 && (
            <div className="p-20 text-center italic text-gray-300 font-bold uppercase text-xs tracking-widest">
              Aucun administrateur trouvé
            </div>
          )}
        </div>
      </div>
    </div>
  );
}