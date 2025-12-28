"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Plus, ChevronRight, Home, Plane, TrendingUp, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CalendrierPage() {
  const router = useRouter();
  const [matchs, setMatchs] = useState<any[]>([]);
  const [classement, setClassement] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data: mData } = await supabase.from('matchs').select('*').order('date_match', { ascending: true });
    const { data: cData } = await supabase.from('classement').select('*').order('rang', { ascending: true });
    if (mData) setMatchs(mData);
    if (cData) setClassement(cData);
    setIsLoading(false);
  };

  // Configuration du graphique
  const progression = [14, 12, 11, 8, 5, 6, 3, 2]; 
  const maxRange = 16; // Pour laisser un peu d'espace en bas
  const width = 300;
  const height = 120;
  const step = width / (progression.length - 1);

  // Génération des points du graphique
  const points = progression.map((pos, i) => ({
    x: i * step,
    y: (pos / maxRange) * height,
    val: pos
  }));

  const areaPath = `0,${height} ${points.map(p => `${p.x},${p.y}`).join(' ')} ${width},${height}`;
  const linePath = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <DashboardLayout>
      <div className="italic pb-20">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">Le <span className="text-[#ff9d00]">Calendrier</span></h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em]">Performance & Planning</p>
          </div>
          <button className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff9d00] transition-all shadow-xl">
            <Plus size={16} /> Planifier
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* COLONNE GAUCHE */}
          <div className="lg:w-1/3 space-y-8 not-italic">
            
            {/* GRAPHIQUE DE ZONE AVEC VALEURS */}
            <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] shadow-2xl text-white overflow-hidden relative">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-[#ff9d00]" />
                  <h3 className="font-black uppercase italic text-xs tracking-widest">Évolution Rang</h3>
                </div>
              </div>

              <div className="relative h-40 w-full pt-6"> {/* Ajout de padding-top pour les labels du haut */}
                <svg viewBox={`0 -20 ${width} ${height + 20}`} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff9d00" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#ff9d00" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Zone remplie */}
                  <polyline fill="url(#areaGradient)" points={areaPath} />
                  
                  {/* Ligne de crête */}
                  <polyline fill="none" stroke="#ff9d00" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={linePath} />

                  {/* Points et Valeurs */}
                  {points.map((p, i) => (
                    <g key={i}>
                      {/* Petit cercle sur chaque point */}
                      <circle cx={p.x} cy={p.y} r="3" fill="#ff9d00" />
                      
                      {/* Étiquette de la position (1er, 2e, etc.) */}
                      <text 
                        x={p.x} 
                        y={p.y - 12} 
                        fill={i === points.length - 1 ? "#ff9d00" : "white"} 
                        fontSize="8" 
                        fontWeight="900" 
                        textAnchor="middle" 
                        className="italic uppercase"
                      >
                        {p.val}{p.val === 1 ? 'er' : 'e'}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              
              <div className="flex justify-between mt-6 text-[7px] font-black uppercase text-gray-500 tracking-widest">
                <span>Journée 1</span>
                <span className="text-[#ff9d00]">Aujourd'hui</span>
              </div>
            </div>

            {/* TABLEAU CLASSEMENT */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <Award size={18} className="text-[#ff9d00]" />
                <h3 className="font-black uppercase italic text-xs text-[#1a1a1a]">Classement</h3>
              </div>
              <div className="space-y-3">
                {classement.map((equipe) => (
                  <div key={equipe.id} className={`grid grid-cols-6 items-center p-3 rounded-2xl text-[10px] font-black uppercase italic transition-all ${equipe.equipe === 'SKRINER LAB' ? 'bg-[#1a1a1a] text-white' : 'hover:bg-gray-50 text-gray-600'}`}>
                    <span className="col-span-1">#{equipe.rang}</span>
                    <span className="col-span-3 truncate">{equipe.equipe}</span>
                    <span className={equipe.equipe === 'SKRINER LAB' ? 'text-[#ff9d00]' : 'text-[#1a1a1a]'}>{equipe.points}</span>
                    <span className="opacity-40">{equipe.difference_buts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* COLONNE DROITE : LISTE DES MATCHS */}
          <div className="flex-1 space-y-6">
            {matchs.map((match) => (
              <div key={match.id} className={`bg-white rounded-[3rem] p-8 shadow-xl border-l-8 transition-all flex items-center justify-between group ${match.lieu === 'Domicile' ? 'border-l-[#ff9d00]' : 'border-l-gray-200'}`}>
                <div className="flex items-center gap-6">
                  <div className="bg-[#1a1a1a] text-white w-20 h-20 rounded-[2rem] flex flex-col items-center justify-center font-black group-hover:bg-[#ff9d00] transition-colors shadow-lg">
                    <span className="text-[10px] opacity-40 uppercase">{new Date(match.date_match).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                    <span className="text-2xl tracking-tighter">{new Date(match.date_match).getDate()}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 not-italic">
                      <span className="text-[#ff9d00] text-[9px] font-black uppercase italic tracking-widest">{match.competition}</span>
                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded flex items-center gap-1 ${match.lieu === 'Domicile' ? 'bg-orange-100 text-[#ff9d00]' : 'bg-gray-100 text-gray-400'}`}>
                        {match.lieu === 'Domicile' ? <Home size={8} /> : <Plane size={8} />} {match.lieu}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black uppercase italic text-[#1a1a1a]">VS {match.adversaire}</h3>
                  </div>
                </div>

                <div className="text-4xl font-black italic uppercase text-[#1a1a1a] tracking-widest min-w-[120px] text-center">
                  {match.score_final}
                </div>

                <button 
                  onClick={() => router.push(`/calendrier/${match.id}`)}
                  className="bg-[#1a1a1a] text-white px-7 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff9d00] transition-all shadow-lg"
                >
                  Détails <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}