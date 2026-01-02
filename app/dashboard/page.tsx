"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon,
  Settings, 
  LogOut, 
  Loader2, 
  Trophy, 
  ChevronRight, 
  Activity, 
  Shield,
  Menu, 
  X,
  ArrowUpRight 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({
    joueurs: 0,
    equipes: 0,
    matchs: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, clubs(*)')
        .eq('id', session.user.id)
        .single();

      if (!profile?.club_id && session.user.email !== 'gaffoum@gmail.com') {
        router.push('/onboarding');
        return;
      }

      setAdminData(profile);

      if (profile?.club_id) {
        const [joueursRes, equipesRes, matchsRes] = await Promise.all([
          supabase.from('joueurs').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id),
          supabase.from('equipes').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id),
          supabase.from('matchs').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id)
        ]);

        setStats({
          joueurs: joueursRes.count || 0,
          equipes: equipesRes.count || 0,
          matchs: matchsRes.count || 0
        });
      }

    } catch (err) {
      console.error("Erreur Dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row italic text-[#1a1a1a]">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1a1a1a] text-white z-[60]">
        <h2 className="text-xl font-black uppercase tracking-tighter">
          Gesteam <span className="text-[#ff9d00]">Pro</span>
        </h2>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* SIDEBAR NOIRE RESPONSIVE */}
      <aside className={`
        ${isSidebarOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} 
        md:flex md:w-72 md:fixed md:h-full bg-[#1a1a1a] p-8 text-white flex-col shadow-2xl transition-all
      `}>
        <div className="mb-12 hidden md:block">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Gesteam <span className="text-[#ff9d00]">Pro</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 mt-1 tracking-[0.3em] italic">
            {adminData?.clubs?.name || 'Club Manager'}
          </p>
        </div>

        <nav className="space-y-4 flex-1 not-italic">
          <Link href="/dashboard" className="p-4 bg-[#ff9d00] rounded-2xl flex items-center gap-3 text-[#1a1a1a] font-black uppercase text-xs shadow-lg shadow-[#ff9d00]/20 transition-all">
            <LayoutDashboard size={18} /> Vue d'ensemble
          </Link>
          <Link href="/dashboard/joueurs" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <Users size={18} /> Effectifs
          </Link>
          <Link href="/dashboard/equipes" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <Shield size={18} /> Équipes
          </Link>
          <Link href="/dashboard/matchs" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <Trophy size={18} /> Matchs
          </Link>
        </nav>

        <div className="pt-8 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="w-full p-5 bg-white/5 text-white/50 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 md:ml-72 p-6 md:p-12 overflow-y-auto min-h-screen w-full">
        <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-16 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-[2rem] shadow-2xl p-3 flex items-center justify-center border-4 border-white overflow-hidden shrink-0">
              {adminData?.clubs?.logo_url ? (
                <img src={adminData.clubs.logo_url} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Trophy size={40} className="text-[#ff9d00]" />
              )}
            </div>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                Salut, <span className="text-[#ff9d00]">{adminData?.nom || 'Coach'}</span> !
              </h1>
              <p className="text-gray-400 font-bold not-italic uppercase text-xs tracking-widest mt-3 italic">
                Gestion de {adminData?.clubs?.nom_usage || 'votre club'}
              </p>
            </div>
          </div>
          
          <Link href="/dashboard/joueurs/nouveau" className="bg-[#1a1a1a] text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 shadow-2xl">
            <Plus size={20} /> Nouveau Joueur
          </Link>
        </header>

        {/* GRILLE DE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 not-italic">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Effectif</p>
              <h3 className="text-5xl font-black tracking-tighter">{stats.joueurs}</h3>
            </div>
            <div className="p-5 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <Users size={28} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Catégories</p>
              <h3 className="text-5xl font-black tracking-tighter">{stats.equipes}</h3>
            </div>
            <div className="p-5 bg-purple-50 text-purple-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <Shield size={28} />
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Calendrier</p>
              <h3 className="text-5xl font-black tracking-tighter">{stats.matchs}</h3>
            </div>
            <div className="p-5 bg-green-50 text-green-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <CalendarIcon size={28} />
            </div>
          </div>
        </div>

        {/* SECTION INFOS BAS DE PAGE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-100">
            <h4 className="font-black uppercase text-lg tracking-tighter italic mb-10 flex items-center justify-between">
              Activité <span className="text-[#ff9d00]">Récente</span>
              <Activity className="text-gray-200" size={24} />
            </h4>
            <div className="flex items-center gap-5 p-6 rounded-[2rem] bg-gray-50 border border-gray-100 group hover:bg-white hover:shadow-xl transition-all">
               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#ff9d00] shadow-sm group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
                 <ArrowUpRight size={20} />
               </div>
               <div>
                 <p className="text-sm font-black uppercase">Système Prêt</p>
                 <p className="text-[11px] text-gray-400 font-bold italic">Club opérationnel.</p>
               </div>
            </div>
          </div>

          <div className="bg-[#ff9d00] p-12 rounded-[3.5rem] shadow-2xl text-[#1a1a1a] relative overflow-hidden group transition-transform hover:scale-[1.01] cursor-pointer">
            <div className="relative z-10">
              <h4 className="font-black uppercase text-2xl mb-3 tracking-tighter italic">Guide de gestion</h4>
              <p className="font-bold text-sm opacity-90 mb-8 not-italic max-w-[250px]">Apprenez à gérer vos catégories efficacement.</p>
              <button className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-[#1a1a1a] transition-all shadow-xl">
                Ouvrir l'aide
              </button>
            </div>
            <Trophy className="absolute -right-12 -bottom-12 opacity-10 group-hover:rotate-12 transition-all duration-700" size={280} />
          </div>
        </div>
      </div>

      {/* OVERLAY MOBILE CORRIGÉ */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}

const Plus = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);