"use client";
import React from 'react';
import { 
  Database, 
  Users, 
  ShieldCheck, 
  Settings, 
  ChevronRight, 
  LayoutDashboard,
  LogOut,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function BackofficeDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const menuItems = [
    {
      title: "Administration BDD",
      description: "Gérer les comptes coachs et les clubs enregistrés",
      icon: <Database className="text-[#ef4444]" size={24} />,
      href: "/backoffice/administration",
      color: "border-[#ef4444]/20"
    },
    {
      title: "Gestion des Coachs",
      description: "Validation des accès et modération des profils",
      icon: <Users className="text-white" size={24} />,
      href: "/backoffice/administration", 
      color: "border-white/10"
    },
    {
      title: "Analytique",
      description: "Statistiques d'utilisation et performances système",
      icon: <BarChart3 className="text-[#ef4444]" size={24} />,
      href: "#",
      color: "border-[#ef4444]/20"
    },
    {
      title: "Configuration",
      description: "Réglages techniques de la plateforme Gesteam",
      icon: <Settings className="text-white/40" size={24} />,
      href: "#",
      color: "border-white/5"
    }
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 md:p-12 italic font-black uppercase overflow-hidden relative">
      {/* Effet de lueur en arrière-plan */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#ef4444]/5 blur-[120px] rounded-full -z-10" />

      <div className="max-w-6xl mx-auto">
        {/* Barre supérieure */}
        <div className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#ef4444]/10 rounded-2xl border border-[#ef4444]/20">
              <LayoutDashboard className="text-[#ef4444]" size={28} />
            </div>
            <div>
              <h1 className="text-3xl tracking-tighter italic uppercase">
                Control <span className="text-[#ef4444]">Center</span>
              </h1>
              <p className="text-white/20 text-[10px] tracking-[0.4em] font-bold">Gesteam Pro Administration</p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#ef4444] hover:text-white transition-colors text-[10px] tracking-widest font-black"
          >
            <LogOut size={16} /> DÉCONNEXION
          </button>
        </div>

        {/* Carte de bienvenue massive style Admin BDD */}
        <div className="bg-[#1e293b]/60 border border-white/5 p-12 rounded-[3.5rem] mb-12 backdrop-blur-xl relative overflow-hidden group shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl mb-2 tracking-tighter italic uppercase">
              Bonjour, <span className="text-[#ef4444]">Administrateur</span>
            </h2>
            <p className="text-white/30 text-xs font-bold tracking-[0.3em] lowercase not-italic italic">prêt pour la gestion de la saison en cours.</p>
          </div>
          <ShieldCheck className="absolute right-12 top-1/2 -translate-y-1/2 text-white/[0.02] group-hover:text-[#ef4444]/5 transition-all duration-700" size={220} />
        </div>

        {/* Grille de menu */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {menuItems.map((item, index) => (
            <Link key={index} href={item.href}>
              <div className={`bg-[#1e293b]/40 border ${item.color} p-10 rounded-[3rem] hover:bg-[#1e293b]/80 transition-all group cursor-pointer relative overflow-hidden h-full shadow-lg`}>
                <div className="flex justify-between items-start mb-8">
                  <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-[#ef4444]/20 group-hover:scale-110 transition-all duration-500">
                    {item.icon}
                  </div>
                  <ChevronRight className="text-white/10 group-hover:text-[#ef4444] group-hover:translate-x-2 transition-all" size={24} />
                </div>
                
                <h3 className="text-2xl mb-2 group-hover:text-[#ef4444] transition-colors tracking-tighter italic">
                  {item.title}
                </h3>
                <p className="text-white/30 text-[10px] font-bold tracking-widest leading-relaxed uppercase italic">
                  {item.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Pied de page système */}
        <div className="mt-20 text-center">
          <p className="text-[9px] text-white/10 tracking-[1em] font-bold uppercase italic">System Status: Online / Database Synced</p>
        </div>
      </div>
    </div>
  );
}