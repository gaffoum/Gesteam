"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, MessageCircle, Send, Phone, 
  Trophy, Activity, User as UserIcon, Loader2,
  Calendar, Shield, Zap, Target
} from 'lucide-react';
import Link from 'next/link';

export default function FicheJoueurPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    fetchPlayerData();
  }, [params.id]);

  const fetchPlayerData = async () => {
    setLoading(true);
    try {
      // 1. Vérification du rôle de l'utilisateur connecté
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(profile?.role || 'user');
      }

      // 2. Récupération des données du joueur
      const { data, error } = await supabase
        .from('joueurs')
        .select('*, equipes(nom, categorie)')
        .eq('id', params.id)
        .single();
      
      if (error) throw error;
      setPlayer(data);
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Bonjour Coach, je suis ${player?.prenom} ${player?.nom}. Je vous contacte depuis ma fiche Gesteam Pro.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  const isReadOnly = userRole === 'user';

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-6xl mx-auto">
        
        {/* NAVIGATION & TITRE */}
        <div className="flex items-center gap-6 mb-12">
          <Link href="/dashboard/joueurs" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-5xl tracking-tighter text-black italic leading-none">
              Fiche <span className="text-[#ff9d00]">Technique</span>
            </h1>
            <p className="text-gray-400 text-[10px] tracking-[0.4em] mt-2 font-bold">
              {isReadOnly ? "Consultation Profil Joueur" : "Administration Performance"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* --- COLONNE GAUCHE : IDENTITÉ (4/12) --- */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm text-center relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] mx-auto mb-6 flex items-center justify-center text-gray-300 shadow-inner">
                  <UserIcon size={64} />
                </div>
                <h2 className="text-3xl text-black tracking-tighter mb-1">{player?.prenom} {player?.nom}</h2>
                <div className="inline-block bg-black text-[#ff9d00] px-4 py-1 rounded-lg text-xs mb-8 italic">
                  N° {player?.numero || '--'} | {player?.poste || 'MILIEU'}
                </div>

                {/* BOUTONS CONTACT (Action User / Tâche 4) */}
                <div className="space-y-3">
                  <button 
                    onClick={shareOnWhatsApp}
                    className="w-full bg-[#25D366] text-white py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#25D366]/20"
                  >
                    <MessageCircle size={20} /> WHATSAPP DIRECT
                  </button>
                  <button className="w-full bg-[#0088cc] text-white py-5 rounded-2xl flex items-center justify-center gap-3 text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#0088cc]/20">
                    <Send size={20} /> TELEGRAM
                  </button>
                </div>
              </div>
              <Trophy className="absolute -right-10 -bottom-10 text-gray-50 opacity-50" size={200} />
            </div>

            {/* INFO CLUB */}
            <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-xl">
              <div className="flex items-center gap-4 mb-4">
                <Shield className="text-[#ff9d00]" size={24} />
                <span className="text-xs tracking-widest">ÉQUIPE ACTUELLE</span>
              </div>
              <p className="text-2xl tracking-tighter italic">{player?.equipes?.nom || 'GESTEAM PRO'}</p>
              <p className="text-[#ff9d00] text-[10px] mt-1">{player?.equipes?.categorie || 'SÉNIOR'}</p>
            </div>
          </div>

          {/* --- COLONNE DROITE : STATS & DATA (8/12) --- */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* STATS DE PERFORMANCE */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#ff9d00]/10 rounded-xl text-[#ff9d00]">
                    <Zap size={24} />
                  </div>
                  <h3 className="text-lg tracking-tighter italic text-black font-black">Performances Saison</h3>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: "MATCHS JOUÉS", val: "14", icon: <Calendar size={18}/> },
                  { label: "BUTS MARQUÉS", val: "08", icon: <Target size={18}/> },
                  { label: "TEMPS DE JEU", val: "1.120'", icon: <Activity size={18}/> },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-center group hover:bg-black transition-all">
                    <div className="text-[#ff9d00] mb-3 flex justify-center">{stat.icon}</div>
                    <span className="text-[9px] text-gray-400 block mb-2 group-hover:text-white/40">{stat.label}</span>
                    <span className="text-3xl text-black group-hover:text-white">{stat.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ZONE D'ÉDITION COACH (Masquée si ReadOnly / Tâche 3) */}
            {!isReadOnly && (
              <div className="bg-white p-10 rounded-[3rem] border-2 border-dashed border-[#ff9d00]/30 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-sm tracking-[0.3em] text-[#ff9d00] mb-4">ESPACE ADMINISTRATEUR COACH</h3>
                  <p className="text-gray-400 text-[10px] mb-8 italic not-italic lowercase leading-relaxed">
                    En tant que coach, vous avez les droits pour modifier les statistiques, changer le numéro de maillot ou transférer ce joueur dans une autre catégorie.
                  </p>
                  <div className="flex gap-4">
                    <button className="bg-black text-white px-8 py-4 rounded-2xl text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all">
                      MODIFIER LES STATS
                    </button>
                    <button className="border border-red-100 text-red-500 px-8 py-4 rounded-2xl text-[10px] tracking-widest hover:bg-red-50 transition-all">
                      EXCLURE L'EFFECTIF
                    </button>
                  </div>
                </div>
                <Zap className="absolute -right-4 -bottom-4 text-[#ff9d00]/5" size={120} />
              </div>
            )}

            {/* MESSAGE EN LECTURE SEULE POUR LE JOUEUR (Tâche 4) */}
            {isReadOnly && (
              <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 flex items-center gap-6">
                <div className="p-4 bg-white rounded-2xl text-blue-500 shadow-sm">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="text-blue-900 text-[11px] tracking-widest font-black">MODE CONSULTATION</h4>
                  <p className="text-blue-700/60 text-[10px] italic not-italic lowercase mt-1 font-bold">
                    Vos données sont mises à jour par le staff technique. Contactez votre coach pour toute modification.
                  </p>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}