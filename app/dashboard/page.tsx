"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar, 
  LogOut, 
  Plus, 
  ArrowUpRight, 
  Loader2, 
  Activity 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
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

      // 1. Récupérer le profil et les infos du club
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*, clubs(*)')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile?.club_id) {
        router.push('/onboarding');
        return;
      }

      setAdminData(profile);

      // 2. Récupérer les statistiques réelles
      const [joueursRes, teamsRes, matchsRes] = await Promise.all([
        supabase.from('joueurs').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id),
        supabase.from('teams').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id),
        supabase.from('matchs').select('*', { count: 'exact', head: true }).eq('club_id', profile.club_id)
      ]);

      setStats({
        joueurs: joueursRes.count || 0,
        equipes: teamsRes.count || 0,
        matchs: matchsRes.count || 0
      });

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
    <div className="min-h-screen bg-[#f8f9fa] flex italic">
      {/* SIDEBAR FIXE */}
      <div className="w-72 bg-[#1a1a1a] p-8 text-white flex flex-col fixed h-full shadow-2xl">
        <div className="mb-12">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Gesteam <span className="text-[#ff9d00]">Pro</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 tracking-[0.3em] mt-1 italic">
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

          <Link href="/dashboard/matchs" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <Trophy size={18} /> Matchs
          </Link>

          <Link href="/dashboard/calendrier" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <Calendar size={18} /> Calendrier
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
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 ml-72 p-12 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#1a1a1a]">
              Salut, <span className="text-[#ff9d00]">{adminData?.nom || 'Coach'}</span> !
            </h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-xs tracking-widest mt-2 italic">
              Gestion de {adminData?.clubs?.name || 'votre club'}
            </p>
          </div>
          
          <Link href="/dashboard/joueurs/nouveau" className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-xl">
            <Plus size={18} /> Nouveau Joueur
          </Link>
        </header>

        {/* GRILLE DE STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 not-italic">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2">Joueurs</p>
              <h3 className="text-4xl font-black text-[#1a1a1a]">{stats.joueurs}</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2">Équipes</p>
              <h3 className="text-4xl font-black text-[#1a1a1a]">{stats.equipes}</h3>
            </div>
            <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <Trophy size={24} />
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all">
            <div>
              <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2">Matchs</p>
              <h3 className="text-4xl font-black text-[#1a1a1a]">{stats.matchs}</h3>
            </div>
            <div className="p-4 bg-green-50 text-green-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        {/* SECTION ACTIVITÉ & GUIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-black uppercase text-sm tracking-tighter">Activité <span className="text-[#ff9d00]">Récente</span></h4>
              <Activity className="text-gray-300" size={20} />
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#ff9d00] shadow-sm">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1a1a1a]">Plateforme opérationnelle</p>
                  <p className="text-[10px] text-gray-400 font-medium italic">Bienvenue sur votre espace Gesteam</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#ff9d00] p-10 rounded-[3rem] shadow-xl shadow-[#ff9d00]/20 text-[#1a1a1a] flex flex-col justify-between relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="font-black uppercase text-xl mb-2 tracking-tighter">Démarrage Rapide</h4>
              <p className="font-bold text-sm opacity-80 mb-6 not-italic">Commencez par ajouter vos joueurs pour générer vos premières convocations.</p>
              <Link href="/dashboard/joueurs/nouveau" className="inline-block bg-[#1a1a1a] text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg">
                Ajouter un Joueur
              </Link>
            </div>
            <Trophy className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-110 transition-transform duration-700" size={200} />
          </div>
        </div>
      </div>
    </div>
  );
}