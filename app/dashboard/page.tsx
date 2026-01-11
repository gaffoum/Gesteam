"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar as CalendarIcon,
  LogOut, 
  Loader2, 
  Trophy, 
  Activity, 
  Shield,
  Menu, 
  X,
  ArrowUpRight,
  UserCog,
  Plus,
  UserPlus,
  BookOpen, // Ajout pour le guide
  ArrowRight // Ajout pour les liens
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    joueurs: 0,
    equipes: 0,
    matchs: 0
  });

  // Logs d'activité
  const [logs, setLogs] = useState<any[]>([]);

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

      const { data: profile } = await supabase
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
        // 1. Récupération des compteurs
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

        // 2. Récupération des LOGS (Activité récente)
        const { data: logsData } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (logsData) setLogs(logsData);
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

  // Helper pour l'icône selon l'action
  const getActionIcon = (type: string) => {
    switch(type) {
      case 'JOUEUR': return <UserPlus size={20} />;
      case 'MATCH': return <Trophy size={20} />;
      case 'EQUIPE': return <Shield size={20} />;
      case 'STAFF': return <UserCog size={20} />;
      default: return <ArrowUpRight size={20} />;
    }
  };

  // Helper pour la couleur selon l'action
  const getActionColor = (type: string) => {
    switch(type) {
      case 'JOUEUR': return 'text-blue-500 bg-blue-50';
      case 'MATCH': return 'text-green-500 bg-green-50';
      case 'EQUIPE': return 'text-purple-500 bg-purple-50';
      default: return 'text-[#ff9d00] bg-[#fff4e0]';
    }
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

      {/* SIDEBAR */}
      <aside className={`
        ${isSidebarOpen ? 'fixed inset-0 z-50 flex' : 'hidden'} 
        md:flex md:w-72 md:fixed md:h-full bg-[#1a1a1a] p-8 text-white flex-col shadow-2xl transition-all
      `}>
        <div className="mb-12 hidden md:block">
          <h2 className="text-2xl font-black uppercase tracking-tighter">
            Gesteam <span className="text-[#ff9d00]">Pro</span>
          </h2>
          <p className="text-[9px] font-bold uppercase opacity-40 mt-1 tracking-[0.3em] italic">
            {adminData?.clubs?.nom || 'Club Manager'}
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
          {/* Nouveau lien vers le guide dans le menu */}
          <Link href="/dashboard/guide" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <BookOpen size={18} /> Guide
          </Link>
          <Link href="/dashboard/staff" className="p-4 hover:bg-white/5 rounded-2xl flex items-center gap-3 text-white/50 hover:text-white font-black uppercase text-xs transition-all">
            <UserCog size={18} /> Staff
          </Link>
        </nav>

        <div className="pt-8 border-t border-white/10">
          <button onClick={handleLogout} className="w-full p-5 bg-white/5 text-white/50 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <div className="flex-1 md:ml-72 p-6 md:p-12 overflow-y-auto min-h-screen w-full font-sans">
        
        {/* HEADER PAGE */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none italic">
              BONJOUR, <span className="text-[#ff9d00]">{adminData?.prenom || adminData?.nom || 'COACH'}</span>
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-2 italic">
               Bienvenue sur votre espace de gestion
            </p>
          </div>
          
          <div className="flex gap-3">
             <Link href="/dashboard/matchs/nouveau" className="bg-black text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-2 italic">
                <Plus size={16} /> Match Rapide
             </Link>
          </div>
        </header>

        {/* CARTES STATS (VERSION RICHE) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* 1. Carte JOUEURS */}
          <Link href="/dashboard/joueurs">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer h-full hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Users size={100} />
               </div>
               <div className="relative z-10">
                 <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Effectif Total</p>
                 <h3 className="text-5xl font-black tracking-tighter italic text-black">{stats.joueurs}</h3>
                 <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 border-b-2 border-transparent group-hover:border-[#ff9d00] transition-all pb-1 italic">
                   Gérer <ArrowRight size={14} />
                 </span>
               </div>
               <div className="p-4 bg-blue-50 text-blue-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all relative z-10">
                 <Users size={24} />
               </div>
            </div>
          </Link>

          {/* 2. Carte EQUIPES */}
          <Link href="/dashboard/equipes">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer h-full hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <Shield size={100} />
               </div>
               <div className="relative z-10">
                 <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Catégories</p>
                 <h3 className="text-5xl font-black tracking-tighter italic text-black">{stats.equipes}</h3>
                 <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 border-b-2 border-transparent group-hover:border-[#ff9d00] transition-all pb-1 italic">
                   Configurer <ArrowRight size={14} />
                 </span>
               </div>
               <div className="p-4 bg-purple-50 text-purple-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all relative z-10">
                 <Shield size={24} />
               </div>
            </div>
          </Link>

          {/* 3. Carte MATCHS */}
          <Link href="/dashboard/matchs">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex justify-between items-start group hover:border-[#ff9d00] transition-all cursor-pointer h-full hover:shadow-xl hover:-translate-y-1 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                  <CalendarIcon size={100} />
               </div>
               <div className="relative z-10">
                 <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest mb-2 italic">Matchs joués</p>
                 <h3 className="text-5xl font-black tracking-tighter italic text-black">{stats.matchs}</h3>
                 <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest mt-6 border-b-2 border-transparent group-hover:border-[#ff9d00] transition-all pb-1 italic">
                   Calendrier <ArrowRight size={14} />
                 </span>
               </div>
               <div className="p-4 bg-green-50 text-green-500 rounded-2xl group-hover:bg-[#ff9d00] group-hover:text-white transition-all relative z-10">
                 <CalendarIcon size={24} />
               </div>
            </div>
          </Link>
        </div>

        {/* SECTION ACTIVITÉ RÉCENTE + CARD GUIDE ORANGE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* ZONE D'ACTIVITÉ */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 flex flex-col h-full">
            <h4 className="font-black uppercase text-lg tracking-tighter italic mb-8 flex items-center justify-between">
              Activité <span className="text-[#ff9d00]">Récente</span>
              <Activity className="text-gray-200" size={24} />
            </h4>
            
            <div className="space-y-4 flex-1">
              {logs.length > 0 ? (
                logs.map((log) => (
                  <div key={log.id} className="flex items-center gap-5 p-4 rounded-[2rem] bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${getActionColor(log.action_type)}`}>
                        {getActionIcon(log.action_type)}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase italic">{log.description}</p>
                        <p className="text-[10px] text-gray-400 font-bold italic mt-0.5">
                          {format(new Date(log.created_at), "d MMMM à HH:mm", { locale: fr })}
                        </p>
                      </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                  <Activity className="text-gray-300 mb-2" size={32} />
                  <p className="text-xs font-bold text-gray-400 uppercase italic">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>

          {/* CARTE GUIDE DE GESTION (ORANGE) - Conforme à l'image fournie */}
          <div className="bg-[#ff9d00] p-12 rounded-[3.5rem] shadow-2xl text-white relative overflow-hidden group transition-transform hover:scale-[1.01] cursor-pointer flex flex-col justify-center min-h-[300px]">
            <div className="relative z-10">
              <h4 className="font-black uppercase text-3xl mb-4 tracking-tighter italic text-[#1a1a1a]">Guide de gestion</h4>
              <p className="font-bold text-sm opacity-90 mb-8 max-w-[300px] text-[#1a1a1a]/80">
                Apprenez à gérer vos catégories efficacement et découvrez les fonctionnalités de Gesteam Pro.
              </p>
              
              <Link 
                href="/dashboard/guide"
                className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white hover:text-[#1a1a1a] transition-all shadow-xl inline-flex items-center gap-2 italic"
              >
                <BookOpen size={16} /> Ouvrir l'aide
              </Link>
            </div>
            {/* Décoration Trophée en fond */}
            <Trophy className="absolute -right-8 -bottom-8 opacity-10 text-white group-hover:rotate-12 transition-all duration-700" size={280} />
          </div>

        </div>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}