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
  User,
  LogOut,
  RefreshCw
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
    try {
      // Récupération des profils admin (colonne 'nom' confirmée)
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('*, clubs(name, ville)')
        .eq('role', 'admin')
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      // Récupération des derniers logs de connexion
      const { data: logsData, error: logError } = await supabase
        .from('login_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (logError) console.warn("Erreur logs:", logError.message);

      setAdmins(profilesData || []);
      setLogs(logsData || []);
    } catch (err: any) {
      alert("Erreur de chargement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleBlockStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !currentStatus })
      .eq('id', id);

    if (error) {
      alert("Erreur lors de la modification : " + error.message);
    } else {
      fetchData();
    }
  };

  const filteredAdmins = admins.filter(admin => 
    admin.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex italic">
      {/* SIDEBAR GESTEAM ROOT */}
      <div className="w-80 bg-[#1a1a1a] p-8 text-white flex flex-col fixed h-full">
        <div className="mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Gesteam <span className="text-[#ff9d00]">Root</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 tracking-[0.3em] mt-1">Console de Contrôle</p>
        </div>

        <nav className="space-y-4 flex-1 not-italic">
          <div className="p-4 bg-[#ff9d00] rounded-2xl flex items-center gap-3 text-[#1a1a1a] font-black uppercase text-xs shadow-lg shadow-[#ff9d00]/20">
            <Users size={18} /> Gestion Admins
          </div>
          <button 
            onClick={fetchData}
            className="w-full p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 font-black uppercase text-xs transition-all"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} /> Actualiser
          </button>
        </nav>

        <div className="pt-8 border-t border-white/10">
          <button 
            onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
            className="w-full p-5 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Déconnexion Root
          </button>
        </div>
      </div>

      {/* ZONE DE CONTENU PRINCIPAL */}
      <div className="flex-1 ml-80 p-12 overflow-y-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">
              Dashboard <span className="text-[#ff9d00]">Admins</span>
            </h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-xs tracking-widest mt-2 italic">
              Supervision des responsables de clubs et sécurité
            </p>
          </div>

          <div className="relative not-italic">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou email..."
              className="pl-12 pr-6 py-4 bg-white rounded-2xl border-none shadow-sm focus:ring-2 focus:ring-[#ff9d00] outline-none font-bold text-sm w-96 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLEAU DES ADMINISTRATEURS */}
        <div className="bg-white rounded-[3rem] shadow-xl border border-gray-100 overflow-hidden not-italic">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Responsable</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Club / Localisation</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Statut</th>
                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="animate-spin text-[#ff9d00]" size={32} />
                      <span className="font-black uppercase text-[10px] text-gray-400 tracking-widest">Synchronisation...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="p-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center text-[#1a1a1a] border border-gray-200">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm leading-tight">{admin.nom || 'Compte sans nom'}</p>
                        <p className="text-xs text-gray-400 font-medium lowercase italic">{admin.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-8">
                    <p className="font-black uppercase text-xs text-[#ff9d00] mb-0.5">
                      {admin.clubs?.name || 'Pas de club lié'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight italic opacity-60">
                      {admin.clubs?.ville || 'Ville non renseignée'}
                    </p>
                  </td>
                  <td className="p-8 text-center">
                    {admin.is_blocked ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase border border-red-100">
                        <Ban size={12} /> Accès Bloqué
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase border border-green-100">
                        <CheckCircle size={12} /> Accès Autorisé
                      </span>
                    )}
                  </td>
                  <td className="p-8 text-right">
                    <button 
                      onClick={() => toggleBlockStatus(admin.id, admin.is_blocked)}
                      className={`p-4 rounded-2xl transition-all shadow-md group ${
                        admin.is_blocked 
                        ? 'bg-green-500 text-white hover:bg-green-600 hover:scale-105' 
                        : 'bg-[#1a1a1a] text-white hover:bg-red-500 hover:scale-105'
                      }`}
                      title={admin.is_blocked ? "Débloquer" : "Bloquer"}
                    >
                      {admin.is_blocked ? <ShieldCheck size={20} /> : <Ban size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {!loading && filteredAdmins.length === 0 && (
            <div className="p-24 text-center">
              <p className="text-gray-300 font-black uppercase text-xs tracking-[0.3em] italic">
                Aucun administrateur ne correspond à votre recherche
              </p>
            </div>
          )}
        </div>

        {/* SECTION FOOTER / INFO */}
        <div className="mt-8 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest italic">
          <p>{filteredAdmins.length} administrateur(s) listé(s)</p>
          <p>Gesteam v1.0 - Root Access Only</p>
        </div>
      </div>
    </div>
  );
}