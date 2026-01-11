"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Check, X, Clock, AlertTriangle, UserX, 
  Loader2, Calendar, Users, Percent 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EntrainementAppelPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [participations, setParticipations] = useState<any[]>([]);

  // Stats calculées en temps réel
  const [stats, setStats] = useState({ present: 0, absent: 0, blesse: 0, total: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
        // 1. Récupérer les infos de la séance
        const { data: session } = await supabase
            .from('entrainements')
            .select('*, equipes(nom, categorie)')
            .eq('id', params.id)
            .single();
        
        setSessionData(session);

        // 2. Récupérer les participations (joueurs)
        const { data: parts } = await supabase
            .from('entrainement_participations')
            .select('*, joueurs(id, nom, prenom, poste, photo_url)')
            .eq('entrainement_id', params.id)
            .order('joueurs(nom)'); // Tri alphabétique pour l'appel

        // Petite astuce pour trier correctement malgré la jointure Supabase
        const sortedParts = parts?.sort((a: any, b: any) => a.joueurs.nom.localeCompare(b.joueurs.nom)) || [];
        
        setParticipations(sortedParts);
        calculateStats(sortedParts);

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const calculateStats = (parts: any[]) => {
      const s = { present: 0, absent: 0, blesse: 0, total: parts.length };
      parts.forEach(p => {
          if(p.statut === 'PRESENT' || p.statut === 'RETARD') s.present++;
          if(p.statut === 'ABSENT' || p.statut === 'EXCUSE') s.absent++;
          if(p.statut === 'BLESSE') s.blesse++;
      });
      setStats(s);
  };

  const updateStatus = async (participationId: string, newStatus: string) => {
      // 1. Mise à jour Optimiste (Interface immédiate)
      const newParts = participations.map(p => 
          p.id === participationId ? { ...p, statut: newStatus } : p
      );
      setParticipations(newParts);
      calculateStats(newParts);

      // 2. Envoi BDD
      await supabase
          .from('entrainement_participations')
          .update({ statut: newStatus })
          .eq('id', participationId);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#ff9d00]" size={40}/></div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8 font-sans text-[#1a1a1a] pb-24">
       
       {/* HEADER FIXE (Mobile friendly) */}
       <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 mb-6 sticky top-4 z-20">
           <div className="flex justify-between items-start mb-4">
               <Link href="/dashboard/entrainements" className="p-3 bg-gray-50 rounded-xl hover:bg-black hover:text-white transition-colors">
                   <ArrowLeft size={20}/>
               </Link>
               <div className="text-right">
                   <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-1">Feuille de présence</h1>
                   <p className="text-xs font-bold text-gray-400 uppercase">
                       {sessionData?.equipes?.categorie} • {format(new Date(sessionData?.date_heure), 'dd MMMM', { locale: fr })}
                   </p>
               </div>
           </div>

           {/* BARRE DE STATS */}
           <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl">
               <div className="flex-1 flex flex-col items-center border-r border-gray-200">
                   <span className="text-[10px] font-black uppercase text-gray-400">Présents</span>
                   <span className="text-2xl font-black text-green-600">{stats.present}</span>
               </div>
               <div className="flex-1 flex flex-col items-center border-r border-gray-200">
                   <span className="text-[10px] font-black uppercase text-gray-400">Absents</span>
                   <span className="text-2xl font-black text-red-500">{stats.absent}</span>
               </div>
               <div className="flex-1 flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase text-gray-400">Taux</span>
                   <span className="text-2xl font-black text-[#ff9d00]">
                       {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                   </span>
               </div>
           </div>
       </div>

       {/* LISTE DES JOUEURS */}
       <div className="space-y-3">
           {participations.map((p) => {
               // Définition de la couleur active selon le statut
               const isPresent = p.statut === 'PRESENT';
               const isAbsent = p.statut === 'ABSENT';
               const isBlesse = p.statut === 'BLESSE';
               const isRetard = p.statut === 'RETARD';

               return (
                <div key={p.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in slide-in-from-bottom-2">
                    
                    {/* INFO JOUEUR */}
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-md
                            ${isPresent ? 'bg-green-500' : isAbsent ? 'bg-red-500' : isBlesse ? 'bg-yellow-500' : 'bg-gray-200 text-gray-400'}
                        `}>
                            {p.joueurs.nom.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-black uppercase text-sm text-[#1a1a1a]">{p.joueurs.nom} {p.joueurs.prenom}</h4>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded uppercase">
                                {p.statut === 'EN_ATTENTE' ? 'En attente...' : p.statut}
                            </span>
                        </div>
                    </div>

                    {/* BOUTONS D'ACTION (Appel Rapide) */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                        
                        {/* 1. PRÉSENT */}
                        <button 
                            onClick={() => updateStatus(p.id, 'PRESENT')}
                            className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center gap-1 transition-all
                                ${isPresent ? 'bg-green-500 text-white shadow-lg ring-2 ring-green-200' : 'bg-gray-50 text-gray-400 hover:bg-green-50 hover:text-green-600'}
                            `}
                        >
                            <Check size={16} /> Présent
                        </button>

                        {/* 2. ABSENT */}
                        <button 
                            onClick={() => updateStatus(p.id, 'ABSENT')}
                            className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center gap-1 transition-all
                                ${isAbsent ? 'bg-red-500 text-white shadow-lg ring-2 ring-red-200' : 'bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600'}
                            `}
                        >
                            <X size={16} /> Absent
                        </button>

                        {/* 3. RETARD */}
                        <button 
                            onClick={() => updateStatus(p.id, 'RETARD')}
                            className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center gap-1 transition-all
                                ${isRetard ? 'bg-orange-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-600'}
                            `}
                        >
                            <Clock size={16} /> Retard
                        </button>

                        {/* 4. BLESSÉ */}
                        <button 
                            onClick={() => updateStatus(p.id, 'BLESSE')}
                            className={`flex-1 min-w-[80px] py-3 rounded-xl font-black text-[10px] uppercase flex flex-col items-center gap-1 transition-all
                                ${isBlesse ? 'bg-yellow-500 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-yellow-50 hover:text-yellow-600'}
                            `}
                        >
                            <AlertTriangle size={16} /> Blessé
                        </button>

                    </div>

                </div>
               )
           })}
       </div>

    </div>
  );
}