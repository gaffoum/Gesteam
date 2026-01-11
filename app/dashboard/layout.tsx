"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, Users, Trophy, UserCog, 
  LogOut, Menu, X, Shield, BarChart2, BookOpen 
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clubName, setClubName] = useState("Club Manager");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchClubInfo = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // On récupère les données brutes
      const { data } = await supabase
        .from('profiles')
        .select('clubs(nom)') // La jointure est correcte ici
        .eq('id', session.user.id)
        .single();
        
      // CORRECTION ICI : On force le type pour éviter l'erreur TypeScript
      const profile = data as any;

      // On vérifie si club et nom existent avant de l'assigner
      // On gère le cas où clubs pourrait être un tableau ou un objet
      if (profile?.clubs) {
          // Si c'est un tableau (parfois le cas avec Supabase selon la config)
          if (Array.isArray(profile.clubs) && profile.clubs[0]?.nom) {
             setClubName(profile.clubs[0].nom);
          } 
          // Si c'est un objet unique (cas standard avec .single())
          else if (profile.clubs?.nom) {
             setClubName(profile.clubs.nom);
          }
      }
    };
    fetchClubInfo();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // LISTE DES MENUS
  const menuItems = [
    { label: "Vue d'ensemble", icon: <LayoutDashboard size={18} />, href: "/dashboard" },
    { label: "Effectifs", icon: <Users size={18} />, href: "/dashboard/joueurs" },
    { label: "Équipes", icon: <Shield size={18} />, href: "/dashboard/equipes" },
    { label: "Matchs", icon: <Trophy size={18} />, href: "/dashboard/matchs" },
    { label: "Statistiques", icon: <BarChart2 size={18} />, href: "/dashboard/stats" },
    { label: "Guide", icon: <BookOpen size={18} />, href: "/dashboard/guide" },
    { label: "Staff", icon: <UserCog size={18} />, href: "/dashboard/staff" },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col md:flex-row text-[#1a1a1a] font-sans">
      
      {/* HEADER MOBILE */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#1a1a1a] text-white z-[60] sticky top-0">
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
          <p className="text-[9px] font-bold uppercase opacity-40 mt-1 tracking-[0.3em] italic truncate">
            {clubName}
          </p>
        </div>

        <nav className="space-y-3 flex-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setIsSidebarOpen(false)}
                className={`p-4 rounded-2xl flex items-center gap-3 font-black uppercase text-xs transition-all
                  ${isActive 
                    ? 'bg-[#ff9d00] text-[#1a1a1a] shadow-lg shadow-[#ff9d00]/20' 
                    : 'text-white/50 hover:bg-white/5 hover:text-white'}
                `}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-8 border-t border-white/10">
          <button onClick={handleLogout} className="w-full p-4 bg-white/5 text-white/50 rounded-2xl font-black uppercase text-[10px] hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2">
            <LogOut size={14} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* CONTENU DES PAGES */}
      <main className="flex-1 md:ml-72 w-full min-h-screen">
        {children}
      </main>

      {/* Overlay Mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}
    </div>
  );
}