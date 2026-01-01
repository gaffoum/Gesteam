"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Users, Trophy, Calendar, LayoutDashboard, 
  Settings, LogOut, Loader2 
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [clubDisplay, setClubDisplay] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // RÉCUPÉRATION DU NOM_USAGE DANS LA REQUÊTE
      const { data: profile } = await supabase
        .from('profiles')
        .select('nom, clubs(nom, nom_usage)')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserData(profile);
        const club = profile.clubs as any;
        // Priorité au nom d'usage (en dur), sinon nom complet
        setClubDisplay(club?.nom_usage || club?.nom || "");
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  const navItems = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Mon Effectif', href: '/dashboard/equipe', icon: Trophy },
    { label: 'Joueurs', href: '/dashboard/joueurs', icon: Users },
    { label: 'Calendrier', href: '/dashboard/calendrier', icon: Calendar },
    { label: 'Paramètres', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f9fafb] flex italic font-black uppercase">
      
      {/* SIDEBAR */}
      <aside className="w-80 bg-black text-white p-8 flex flex-col hidden lg:flex shadow-2xl">
        <div className="mb-12">
          <h2 className="text-2xl tracking-tighter italic mb-1">
            GESTEAM<span className="text-[#ff9d00]">PRO</span>
          </h2>
          {/* NOM EN DUR ICI */}
          <p className="text-[#ff9d00] text-[9px] tracking-[0.2em]">
            {clubDisplay}
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${
                  isActive ? 'bg-[#ff9d00] text-black shadow-lg shadow-[#ff9d00]/20' : 'text-gray-500 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] tracking-widest">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))}
          className="flex items-center gap-4 p-4 text-gray-500 hover:text-red-500 transition-all mt-auto"
        >
          <LogOut size={20} />
          <span className="text-[10px] tracking-widest">Déconnexion</span>
        </button>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md p-8 md:p-12 border-b border-gray-100">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-[#ff9d00] shadow-inner">
                <Trophy size={28} />
              </div>
              <div>
                <h3 className="text-4xl md:text-5xl tracking-tighter leading-none">
                  SALUT, <span className="text-[#ff9d00]">{userData?.nom}</span> !
                </h3>
                {/* NOM EN DUR ICI AUSSI */}
                <p className="text-gray-400 text-[10px] tracking-[0.4em] mt-2 font-bold not-italic">
                  GESTION DE {clubDisplay}
                </p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}