"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Goal, Footprints, AlertTriangle, XOctagon, 
  ChevronDown, Trophy, Shield, BarChart2, Medal
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- COMPOSANT "TOP 3 CARD" ---
const Top3Card = ({ title, icon: Icon, color, data, valueKey }: any) => (
  <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 mb-4">
    <h3 className={`font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2 ${color}`}>
      <Icon size={16} /> {title}
    </h3>
    <div className="space-y-3">
      {data.length === 0 ? (
        <p className="text-[10px] text-gray-300 italic font-bold">Aucune donnée</p>
      ) : (
        data.map((p: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${idx === 0 ? 'bg-[#ff9d00]' : 'bg-gray-200 text-gray-500'}`}>
                {idx + 1}
              </div>
              <div>
                <p className="text-xs font-black uppercase text-[#1a1a1a] leading-none">
                  {p.joueurs.nom}
                </p>
                <p className="text-[9px] font-bold text-gray-400 capitalize">
                  {p.joueurs.prenom}
                </p>
              </div>
            </div>
            <span className={`text-xs font-black ${color}`}>
              {/* Gestion spéciale pour les buts (incluant penaltys) ou valeur simple */}
              {valueKey === 'total_buts' 
                ? (p.buts || 0) + (p.penaltys_reussis || 0) 
                : (p[valueKey] || 0)}
            </span>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function GlobalStatsPage() {
  const [loading, setLoading] = useState(true);
  
  // --- DONNÉES ---
  const [teamsList, setTeamsList] = useState<any[]>([]);
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  
  // --- ÉTATS POUR LES TOPS ---
  const [topScorers, setTopScorers] = useState<any[]>([]);
  const [topAssists, setTopAssists] = useState<any[]>([]);
  const [topYellow, setTopYellow] = useState<any[]>([]);
  const [topRed, setTopRed] = useState<any[]>([]);

  // --- FILTRES ---
  const [selectedTeamId, setSelectedTeamId] = useState<string>(""); 
  const [selectedScope, setSelectedScope] = useState<string>("saison"); 

  // 1. Initialisation
  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session.user.id).single();
      
      if (profile?.club_id) {
          const { data: teams } = await supabase
            .from('equipes')
            .select('id, nom, categorie')
            .eq('club_id', profile.club_id)
            .order('categorie', { ascending: true });
          
          setTeamsList(teams || []);
          if (teams && teams.length > 0) setSelectedTeamId(teams[0].id);
      }
    };
    init();
  }, []);

  // 2. Chargement des Matchs
  useEffect(() => {
    const fetchMatches = async () => {
        if (!selectedTeamId) return;
        
        const { data: matches } = await supabase
            .from('matchs')
            .select('id, date_heure, adversaire, score_home, score_away')
            .eq('equipe_id', selectedTeamId)
            .order('date_heure', { ascending: false });
            
        setMatchesList(matches || []);
        setSelectedScope('saison'); 
    };
    fetchMatches();
  }, [selectedTeamId]);

  // 3. Calcul des Stats & Tops
  useEffect(() => {
    const compute = async () => {
        if (!selectedTeamId) return;
        setLoading(true);
        try {
            let dataToProcess: any[] = [];
            const matchIds = selectedScope === 'saison' ? matchesList.map(m => m.id) : [selectedScope];

            if (matchIds.length > 0) {
                const { data: parts } = await supabase
                    .from('match_participations')
                    .select('*, joueurs(id, nom, prenom, poste)')
                    .in('match_id', matchIds);
                
                const agg: any = {};
                parts?.forEach((p: any) => {
                    if (!agg[p.joueur_id]) agg[p.joueur_id] = { 
                        joueurs: p.joueurs, m_joues: 0, buts: 0, passes: 0, j: 0, r: 0, penaltys_reussis: 0
                    };
                    
                    agg[p.joueur_id].m_joues += 1;
                    agg[p.joueur_id].buts += (p.buts || 0);
                    agg[p.joueur_id].penaltys_reussis += (p.penaltys_reussis || 0);
                    agg[p.joueur_id].passes += (p.passes_d || 0);
                    agg[p.joueur_id].j += (p.cartons_jaunes || 0);
                    agg[p.joueur_id].r += (p.cartons_rouges || 0);
                });
                
                // Conversion en tableau
                dataToProcess = Object.values(agg);

                // --- CALCUL DES TOPS (Tri et Slice) ---
                
                // Top Buteurs (Buts + Pénaltys)
                const scorers = [...dataToProcess]
                    .filter(p => (p.buts + p.penaltys_reussis) > 0)
                    .sort((a, b) => (b.buts + b.penaltys_reussis) - (a.buts + a.penaltys_reussis))
                    .slice(0, 3);
                setTopScorers(scorers);

                // Top Passeurs
                const assists = [...dataToProcess]
                    .filter(p => p.passes > 0)
                    .sort((a, b) => b.passes - a.passes)
                    .slice(0, 3);
                setTopAssists(assists);

                // Top Jaunes
                const yellow = [...dataToProcess]
                    .filter(p => p.j > 0)
                    .sort((a, b) => b.j - a.j)
                    .slice(0, 3);
                setTopYellow(yellow);

                // Top Rouges
                const red = [...dataToProcess]
                    .filter(p => p.r > 0)
                    .sort((a, b) => b.r - a.r)
                    .slice(0, 3);
                setTopRed(red);

                // Tri principal pour le grand tableau (Buts puis Passes)
                dataToProcess.sort((a: any, b: any) => {
                    const totalButsA = a.buts + a.penaltys_reussis;
                    const totalButsB = b.buts + b.penaltys_reussis;
                    return totalButsB - totalButsA || b.passes - a.passes;
                });
            } else {
                // Si pas de matchs, on vide tout
                setTopScorers([]);
                setTopAssists([]);
                setTopYellow([]);
                setTopRed([]);
            }
            
            setTableData(dataToProcess);
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };
    compute();
  }, [selectedScope, matchesList, selectedTeamId]);

  const cleanName = (n: string) => n ? n.replace(/\s*\(.*?\)/g, '').trim() : "";

  return (
    <div className="p-6 md:p-12 font-sans text-[#1a1a1a] min-h-screen bg-[#f9fafb]">
        
        {/* HEADER */}
        <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-4">
                 <div className="w-14 h-14 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg">
                    <BarChart2 size={28}/>
                 </div>
                 <div>
                     <h1 className="text-3xl font-black italic uppercase tracking-tighter">STATISTIQUES</h1>
                     <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">Performances globales</p>
                 </div>
             </div>

             <div className="flex gap-4 w-full md:w-auto">
                 {/* FILTRES */}
                 <div className="relative flex-1 md:w-60">
                     <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                     <select value={selectedTeamId} onChange={(e) => setSelectedTeamId(e.target.value)} className="w-full bg-white pl-12 pr-10 py-4 rounded-2xl font-black uppercase text-xs outline-none border border-gray-100 focus:border-[#ff9d00] cursor-pointer shadow-sm">
                        {teamsList.map((t) => (
                            <option key={t.id} value={t.id}>{cleanName(t.nom === t.categorie ? t.categorie : `${t.categorie} - ${t.nom}`)}</option>
                        ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                 </div>
                 <div className="relative flex-1 md:w-60">
                     <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff9d00]" size={16} />
                     <select value={selectedScope} onChange={(e) => setSelectedScope(e.target.value)} className="w-full bg-black text-white pl-12 pr-10 py-4 rounded-2xl font-black uppercase text-xs outline-none border-2 border-transparent focus:border-[#ff9d00] cursor-pointer shadow-lg hover:bg-gray-900">
                        <option value="saison">🏆 SAISON (GLOBAL)</option>
                        <optgroup label="Historique des Matchs">
                            {matchesList.map((m) => <option key={m.id} value={m.id}>{format(new Date(m.date_heure), 'dd/MM')} vs {cleanName(m.adversaire)}</option>)}
                        </optgroup>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16}/>
                 </div>
             </div>
        </div>

        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 items-start">
            
            {/* GAUCHE : TOP 3 PODIUMS */}
            <div className="w-full lg:w-1/3 space-y-2">
                <div className="bg-black text-white p-4 rounded-[1.5rem] mb-6 text-center shadow-lg">
                    <h3 className="font-black italic uppercase text-lg tracking-tighter">Les Leaders <span className="text-[#ff9d00]">Top 3</span></h3>
                </div>

                <Top3Card title="Meilleurs Buteurs" icon={Goal} color="text-green-600" data={topScorers} valueKey="total_buts" />
                <Top3Card title="Meilleurs Passeurs" icon={Footprints} color="text-blue-500" data={topAssists} valueKey="passes" />
                
                <div className="grid grid-cols-2 gap-2">
                    <Top3Card title="Cartons Jaunes" icon={AlertTriangle} color="text-yellow-500" data={topYellow} valueKey="j" />
                    <Top3Card title="Cartons Rouges" icon={XOctagon} color="text-red-500" data={topRed} valueKey="r" />
                </div>
            </div>

            {/* DROITE : TABLEAU COMPLET */}
            <div className="flex-1 w-full bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 p-5 border-b border-gray-100 grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center items-center">
                    <div className="col-span-5 text-left pl-4">Joueur</div>
                    <div className="col-span-1">M.J</div>
                    <div className="col-span-2 text-green-600 flex justify-center gap-1"><Goal size={12}/> Buts</div>
                    <div className="col-span-2 text-blue-500 flex justify-center gap-1"><Footprints size={12}/> Passes</div>
                    <div className="col-span-1 text-yellow-500 flex justify-center"><AlertTriangle size={12}/></div>
                    <div className="col-span-1 text-red-500 flex justify-center"><XOctagon size={12}/></div>
                </div>
                
                <div className="divide-y divide-gray-50 max-h-[700px] overflow-y-auto custom-scrollbar">
                    {loading ? <div className="p-12 text-center text-gray-300 font-bold italic">Chargement...</div> : 
                     tableData.length === 0 ? <div className="p-12 text-center text-gray-300 font-bold italic">Aucune donnée disponible.</div> : 
                     tableData.map((d: any, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-4 items-center text-center hover:bg-gray-50 transition-colors group">
                            <div className="col-span-5 text-left flex items-center gap-4 pl-2">
                                <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-[#ff9d00] group-hover:text-white transition-colors">
                                    {d.joueurs.nom.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-black text-xs md:text-sm uppercase leading-none mb-1 text-[#1a1a1a]">
                                        {d.joueurs.nom} <span className="text-gray-400 font-bold">{d.joueurs.prenom}</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded w-fit">
                                        {d.joueurs.poste || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-1 font-black text-gray-300 text-xs">{d.m_joues}</div>
                            <div className="col-span-2">
                                <span className={`inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-lg font-black text-sm shadow-sm border 
                                    ${(d.buts + d.penaltys_reussis) > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                                    {(d.buts + d.penaltys_reussis) > 0 ? (d.buts + d.penaltys_reussis) : '-'}
                                </span>
                            </div>
                            <div className="col-span-2 font-bold text-blue-500 text-sm">{d.passes > 0 ? d.passes : '-'}</div>
                            <div className="col-span-1 font-bold text-yellow-500 text-sm">{d.j > 0 ? d.j : '-'}</div>
                            <div className="col-span-1 font-bold text-red-500 text-sm">{d.r > 0 ? d.r : '-'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
}