"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Users, Building2, Activity, 
  LogOut, Loader2, ArrowUpRight, Database,
  Settings // Ajout de l'icône
} from 'lucide-react';
import Link from 'next/link'; // Import de Link

export default function BackofficePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ clubs: 0, users: 0 });
  const [clubs, setClubs] = useState<any[]>([]);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.replace('/login');

        // Vérification de sécurité (si vous utilisez le système de rôle)
        // Note: Si vous n'avez pas de colonne role='superAdmin', vous pouvez aussi vérifier l'email
        if (session.user.email !== 'gaffoum@gmail.com') {
             router.replace('/dashboard');
             return;
        }

        // Récupération des données globales
        const [clubsRes, profilesRes] = await Promise.all([
          supabase.from('clubs').select('*'),
          supabase.from('profiles').select('*')
        ]);

        setClubs(clubsRes.data || []);
        setStats({
          clubs: clubsRes.data?.length || 0,
          users: profilesRes.data?.length || 0
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemData();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <Loader2 className="animate-spin text-red-500" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white italic flex">
      {/* SIDEBAR */}
      <div className="w-72 bg-[#1e293b] p-8 flex flex-col fixed h-full border-r border-white/5">
        <div className="mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <ShieldCheck className="text-red-500" /> GESTEAM <span className="text-red-500">ROOT</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 mt-1 italic tracking-widest">Console SuperAdmin</p>
        </div>

        <nav className="space-y-4 flex-1 not-italic">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-black uppercase text-xs">
            <Database size={18} /> Vue globale
          </div>
          
          {/* LIEN AJOUTÉ VERS L'ADMINISTRATION AVANCÉE */}
          <Link href="/backoffice/administration">
            <div className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 text-white font-black uppercase text-xs transition-all cursor-pointer shadow-lg hover:shadow-red-500/10 border border-transparent hover:border-red-500/30">
                <Settings size={18} /> Administration BDD
            </div>
          </Link>

          <div className="h-px bg-white/5 my-4"></div>

          <div className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/40 font-black uppercase text-xs transition-all cursor-pointer">
            <Building2 size={18} /> Liste des Clubs
          </div>
          <div className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/40 font-black uppercase text-xs transition-all cursor-pointer">
            <Users size={18} /> Utilisateurs
          </div>
        </nav>

        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="w-full p-5 bg-white/5 text-white/50 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 ml-72 p-12 overflow-y-auto">
        <header className="mb-16">
          <h1 className="text-6xl font-black uppercase tracking-tighter leading-none">
            System <span className="text-red-500">Control</span>
          </h1>
          <p className="text-white/40 font-bold not-italic uppercase text-xs tracking-widest mt-4">Supervision de l'infrastructure Gesteam Pro</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 not-italic">
          <div className="bg-[#1e293b] p-10 rounded-[3rem] border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 italic">Total Clubs</p>
              <h3 className="text-6xl font-black text-white">{stats.clubs}</h3>
            </div>
            <Building2 size={50} className="text-red-500 opacity-20" />
          </div>
          <div className="bg-[#1e293b] p-10 rounded-[3rem] border border-white/5 flex justify-between items-center">
            <div>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 italic">Total Users</p>
              <h3 className="text-6xl font-black text-white">{stats.users}</h3>
            </div>
            <Users size={50} className="text-red-500 opacity-20" />
          </div>
        </div>

        <div className="bg-[#1e293b] p-12 rounded-[3.5rem] border border-white/5 not-italic shadow-2xl">
          <h4 className="font-black uppercase text-sm mb-10 flex items-center gap-2 italic">
            Clubs enregistrés <span className="px-3 py-1 bg-red-600 text-[10px] rounded-lg ml-2">Mainnet</span>
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {clubs.map((club) => (
              <div key={club.id} className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-500 font-black text-xl border border-red-500/20">
                    {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-contain p-2" /> : club.name[0]}
                  </div>
                  <div>
                    <p className="font-black uppercase text-base tracking-tight">{club.name}</p>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">{club.ville || 'Localisation inconnue'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden md:block">
                    <p className="text-[9px] font-black text-white/20 uppercase">ID Système</p>
                    <p className="text-[9px] font-mono text-white/40">{club.id.substring(0,8)}...</p>
                  </div>
                  <button className="p-4 bg-white/5 rounded-2xl group-hover:bg-red-600 transition-all">
                    <ArrowUpRight size={20} className="text-white/20 group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}