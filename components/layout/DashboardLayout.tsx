"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, Users, Calendar, Layout, 
  Settings, LogOut, Trophy, ShieldAlert, ChevronRight,
  TrendingUp, ListOrdered
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Données fictives pour le graphique (Position)
const positionData = [
  { day: 'J1', place: 5 }, { day: 'J2', place: 3 }, { day: 'J3', place: 4 },
  { day: 'J4', place: 2 }, { day: 'J5', place: 1 }, { day: 'J6', place: 2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Joueurs', href: '/dashboard/joueurs', icon: Users }, // LIEN VERS TA PAGE JOUEURS
    { name: 'Calendrier', href: '/dashboard/matchs', icon: Calendar },
    { name: 'Tactique Board', href: '/dashboard/board', icon: Layout },
    { name: 'Résultats', href: '/dashboard/resultats', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex italic font-black uppercase">
      
      {/* 1. SIDEBAR DE NAVIGATION (GAUCHE) */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-40 shadow-sm">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-[#ff9d00] rounded-lg flex items-center justify-center text-white font-black italic shadow-md shadow-[#ff9d00]/20">
              G
            </div>
            <span className="text-lg font-black tracking-tighter text-black italic">
              Gesteam<span className="text-[#ff9d00]">Pro</span>
            </span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-[9px] tracking-widest transition-all ${
                    isActive 
                    ? 'bg-[#ff9d00] text-white shadow-lg shadow-[#ff9d00]/20' 
                    : 'text-gray-400 hover:text-black hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={16} className={isActive ? 'text-white' : 'text-[#ff9d00]'} />
                    {item.name}
                  </div>
                  {isActive && <ChevronRight size={12} />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100 space-y-4">
          <Link href="/backoffice" className="flex items-center gap-3 px-4 text-gray-400 text-[9px] hover:text-red-500 transition-colors">
            <ShieldAlert size={16} /> Administration
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 text-red-400 text-[9px] hover:text-red-600 transition-colors w-full text-left">
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* 2. ZONE DE STATISTIQUES DYNAMIQUES (JUSTE APRÈS LA NAV - À GAUCHE) */}
      <div className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 ml-64 p-6 space-y-8 h-screen sticky top-0 overflow-y-auto">
        
        {/* Graphique de Position */}
        <div className="bg-gray-50 rounded-[2rem] p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#ff9d00]" />
            <h4 className="text-[10px] tracking-widest text-black">Position Dynamique</h4>
          </div>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={positionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="day" hide />
                <YAxis reversed domain={[1, 10]} hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                <Line type="monotone" dataKey="place" stroke="#ff9d00" strokeWidth={3} dot={{ r: 4, fill: '#ff9d00' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-[8px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Actuel : 2ème</p>
        </div>

        {/* Classement Poule */}
        <div className="bg-white">
          <div className="flex items-center gap-2 mb-4">
            <ListOrdered size={16} className="text-[#ff9d00]" />
            <h4 className="text-[10px] tracking-widest text-black">Classement Poule</h4>
          </div>
          <div className="space-y-2">
            {[
              { pos: 1, team: "AS GESTEAM", pts: 15, color: "bg-[#ff9d00] text-white shadow-lg shadow-[#ff9d00]/20" },
              { pos: 2, team: "FC SKRINER", pts: 12, color: "bg-gray-100 text-black" },
              { pos: 3, team: "OLYMPIQUE", pts: 10, color: "bg-gray-50 text-gray-400" },
              { pos: 4, team: "RC VILLE", pts: 9, color: "bg-gray-50 text-gray-400" },
            ].map((team) => (
              <div key={team.pos} className={`flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02] ${team.color}`}>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black w-4">{team.pos}</span>
                  <span className="text-[9px] tracking-tighter truncate w-24">{team.team}</span>
                </div>
                <span className="text-[10px] font-black italic">{team.pts} PTS</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. ZONE PRINCIPALE (CONTENU) */}
      <main className="flex-1 lg:ml-0 p-8 lg:p-12 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

    </div>
  );
}