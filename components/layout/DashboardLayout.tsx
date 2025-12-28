"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Layout, // Icône pour le Board
  Settings,
  LogOut,
  Trophy
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Effectif', href: '/joueurs', icon: Users },
    { name: 'Calendrier', href: '/calendrier', icon: Calendar },
    { name: 'Tactique Board', href: '/board', icon: Layout }, // Nouveau lien ajouté
    { name: 'Résultats', href: '/resultats', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      {/* SIDEBAR */}
      <aside className="w-72 bg-[#1a1a1a] text-white flex flex-col fixed h-full z-40">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#ff9d00] rounded-xl flex items-center justify-center font-black italic text-xl">
              S
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic">
              Skriner<span className="text-[#ff9d00]">Lab</span>
            </span>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-4 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                    isActive 
                    ? 'bg-[#ff9d00] text-white shadow-lg shadow-[#ff9d00]/20' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-gray-500'} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-white/5 space-y-4">
          <Link href="/settings" className="flex items-center gap-4 px-6 text-gray-500 font-black uppercase text-[10px] hover:text-white transition-colors">
            <Settings size={18} /> Paramètres
          </Link>
          <button className="flex items-center gap-4 px-6 text-red-500 font-black uppercase text-[10px] hover:text-red-400 transition-colors">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-72 p-12 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}