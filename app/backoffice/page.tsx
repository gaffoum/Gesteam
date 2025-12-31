"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, Users, Building2, Activity, 
  LogOut, Loader2, ArrowUpRight, Database,
  Settings, Menu, X 
} from 'lucide-react';
import Link from 'next/link';

export default function BackofficePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ clubs: 0, users: 0 });
  const [clubs, setClubs] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.replace('/login');

        // Sécurité SuperAdmin par email
        if (session.user.email !== 'gaffoum@gmail.com') {
             router.replace('/dashboard');
             return;
        }

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
    <div className="min-h-screen bg-[#0f172a] text-white italic flex flex-col md:flex-row">
      
      {/* HEADER MOBILE - Visible uniquement sur petit écran */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1e293b] border-b border-white/5 z-[60]">
        <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
          <ShieldCheck className="text-red-500" size={20} /> GESTEAM <span className="text-red-500">ROOT</span>
        </h2>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR RESPONSIVE */}
      <div className={`
        ${isMobileMenuOpen ? 'fixed inset-0 translate-x-0' : 'fixed -translate-x-full'} 
        md:relative md:translate-x-0 md:flex w-full md:w-72 bg-[#1e293b] p-8 flex-col border-r border-white/5 z-50 transition-transform duration-300 ease-in-out h-screen md:h-auto
      `}>
        <div className="mb-12 hidden md:block">
          <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
            <ShieldCheck className="text-red-500" /> GESTEAM <span className="text-red-500">ROOT</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 mt-1 italic tracking-widest">Console SuperAdmin</p>
        </div>

        <nav className="space-y-4 flex-1 not-italic">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 font-black uppercase text-xs mb-4">
            <Database size={18} /> Vue globale
          </div>
          
          <Link href="/backoffice/administration" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-3 text-white font-black uppercase text-xs transition-all cursor-pointer shadow-lg border border-transparent hover:border-red-500/30">
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
          className="w-full p-5 bg-white/5 text-white/50 rounded-2xl font-black uppercase text-[10px] hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2 mt-4"
        >
          <LogOut size={14} /> Déconnexion
        </button>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto w-full">
        <header className="mb-10 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight">
            System <span className="text-red-500">Control</span>
          </h1>
          <p className="text-white/40 font-bold not-italic uppercase text-[10px] md:text-xs tracking-widest mt-4">Supervision de l'infrastructure Gesteam Pro</p>
        </header>

        {/* STATS GRID - Responsive 1 -> 2 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-16 not-italic">
          <div className="bg-[#1e293b] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 flex justify-between items-center shadow-2xl">
            <div>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 italic">Total Clubs</p>
              <h3 className="text-4xl md:text-6xl font-black text-white">{stats.clubs}</h3>
            </div>
            <Building2 size={40} className="text-red-500 opacity-20" />
          </div>
          <div className="bg-[#1e293b] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3rem] border border-white/5 flex justify-between items-center shadow-2xl">
            <div>
              <p className="text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 italic">Total Users</p>
              <h3 className="text-4xl md:text-6xl font-black text-white">{stats.users}</h3>
            </div>
            <Users size={40} className="text-red-500 opacity-20" />
          </div>
        </div>

        {/* LISTE DES CLUBS */}
        <div className="bg-[#1e293b] p-6 md:p-12 rounded-[2rem] md:rounded-[3.5rem] border border-white/5 not-italic shadow-2xl">
          <h4 className="font-black uppercase text-xs md:text-sm mb-8 flex items-center gap-2 italic">
            Clubs enregistrés <span className="px-3 py-1 bg-red-600 text-[10px] rounded-lg ml-2">Mainnet</span>
          </h4>
          
          <div className="grid grid-cols-1 gap-4">
            {clubs.map((club) => (
              <div key={club.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:bg-white/10 transition-all group gap-4">
                <div className="flex items-center gap-4 md:gap-5">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-red-600/10 rounded-xl md:rounded-2xl flex items-center justify-center text-red-500 font-black text-lg md:text-xl border border-red-500/20 shrink-0">
                    {club.logo_url ? <img src={club.logo_url} className="w-full h-full object-contain p-2" alt="logo" /> : club.name[0]}
                  </div>
                  <div>
                    <p className="font-black uppercase text-sm md:text-base tracking-tight">{club.name}</p>
                    <p className="text-[9px] md:text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">{club.ville || 'Localisation inconnue'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:gap-8">
                  <div className="text-left sm:text-right">
                    <p className="text-[8px] md:text-[9px] font-black text-white/20 uppercase tracking-widest">ID Système</p>
                    <p className="text-[8px] md:text-[9px] font-mono text-white/40">{club.id.substring(0,8)}...</p>
                  </div>
                  <button className="p-3 md:p-4 bg-white/5 rounded-xl md:rounded-2xl group-hover:bg-red-600 transition-all shrink-0">
                    <ArrowUpRight size={18} className="text-white/20 group-hover:text-white" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay pour fermer le menu mobile en cliquant à côté */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}