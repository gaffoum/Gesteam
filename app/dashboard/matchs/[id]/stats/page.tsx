"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Goal, Footprints, AlertTriangle, XOctagon, 
  ChevronDown, Trophy, Shield, Filter
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MatchStatsPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  
  // --- ÉTATS DONNÉES ---
  const [teamsList, setTeamsList] = useState<any[]>([]); // Liste de toutes les équipes du club
  const [matchesList, setMatchesList] = useState<any[]>([]); // Liste des matchs de l'équipe sélectionnée
  const [tableData, setTableData] = useState<any[]>([]); // Les stats affichées

  // --- ÉTATS FILTRES ---
  const [selectedTeamId, setSelectedTeamId] = useState<string>(""); 
  const [selectedScope, setSelectedScope] = useState<string>("saison"); // 'saison' ou UUID du match

  // 1. CHARGEMENT INITIAL (Profil, Teams, et Match courant)
  useEffect(() => {
    const initPage = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // A. Récupérer le profil pour avoir le club_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('club_id')
            .eq('id', session.user.id)
            .single();

        if (profile?.club_id) {
            // B. Récupérer toutes les équipes du club (pour le menu déroulant 1)
            const { data: teams } = await supabase
                .from('equipes')
                .select('id, nom, categorie')
                .eq('club_id', profile.club_id)
                .order('categorie', { ascending: true });
            
            setTeamsList(teams || []);

            // C. Récupérer le match de l'URL pour l'initialisation
            const { data: currentMatch } = await supabase
                .from('matchs')
                .select('equipe_id')
                .eq('id', params.id)
                .single();

            // D. Initialiser les filtres
            if (currentMatch && currentMatch.equipe_id) {
                setSelectedTeamId(currentMatch.equipe_id); // On sélectionne l'équipe du match
                setSelectedScope(params.id); // On sélectionne ce match précis
            } else if (teams && teams.length > 0) {
                // Fallback si pas de match trouvé (ex: url cassée), on prend la 1ère équipe
                setSelectedTeamId(teams[0].id);
                setSelectedScope('saison');
            }
        }
      } catch (e) {
        console.error("Erreur init:", e);
      }
    };

    initPage();
  }, [params.id]);

  // 2. CHARGEMENT DES MATCHS (Quand on change d'équipe)
  useEffect(() => {
    const fetchMatchesForTeam = async () => {
        if (!selectedTeamId) return;

        const { data: matches } = await supabase
            .from('matchs')
            .select('id, date_heure, adversaire, score_home, score_away')
            .eq('equipe_id', selectedTeamId)
            .order('date_heure', { ascending: false }); // Plus récent en haut

        setMatchesList(matches || []);
        
        // IMPORTANT : Si le scope actuel (ex: un ID de match) ne fait pas partie de la nouvelle liste de matchs,
        // on remet le scope sur "Saison" pour éviter de montrer un match qui n'appartient pas à l'équipe.
        const isMatchInList = matches?.some(m => m.id === selectedScope);
        if (selectedScope !== 'saison' && !isMatchInList) {
            setSelectedScope('saison');
        }
    };

    fetchMatchesForTeam();
  }, [selectedTeamId]);

  // 3. CALCUL DES STATS (Quand Equipe ou Scope change)
  useEffect(() => {
    const computeStats = async () => {
        if (!selectedTeamId) return;
        setLoading(true);

        try {
            let dataToProcess = [];

            if (selectedScope === 'saison') {
                // --- CAS A : TOUTE LA SAISON ---
                // On prend tous les IDs des matchs chargés
                const allMatchIds = matchesList.map(m => m.id);

                if (allMatchIds.length > 0) {
                    const { data: allParticipations } = await supabase
                        .from('match_participations')
                        .select('*, joueurs(id, nom, prenom, poste)')
                        .in('match_id', allMatchIds);

                    // Agrégation
                    const aggregated: any = {};
                    allParticipations?.forEach((p: any) => {
                        if (!aggregated[p.joueur_id]) {
                            aggregated[p.joueur_id] = {
                                joueurs: p.joueurs,
                                matchs_joues: 0,
                                buts: 0,
                                passes_d: 0,
                                cartons_jaunes: 0,
                                cartons_rouges: 0,
                                penaltys_reussis: 0
                            };
                        }
                        // On compte le match joué
                        aggregated[p.joueur_id].matchs_joues += 1;
                        
                        aggregated[p.joueur_id].buts += (p.buts || 0);
                        aggregated[p.joueur_id].passes_d += (p.passes_d || 0);
                        aggregated[p.joueur_id].cartons_jaunes += (p.cartons_jaunes || 0);
                        aggregated[p.joueur_id].cartons_rouges += (p.cartons_rouges || 0);
                        aggregated[p.joueur_id].penaltys_reussis += (p.penaltys_reussis || 0);
                    });
                    dataToProcess = Object.values(aggregated);
                }
            } else {
                // --- CAS B : UN SEUL MATCH ---
                const { data } = await supabase
                    .from('match_participations')
                    .select('*, joueurs(id, nom, prenom, poste)')
                    .eq('match_id', selectedScope)
                    .order('est_titulaire', { ascending: false });
                
                dataToProcess = data?.map((p: any) => ({ ...p, matchs_joues: 1 })) || [];
            }

            // TRI PAR DÉFAUT : Buts (desc) puis Passes (desc)
            dataToProcess.sort((a: any, b: any) => {
                const totalButsA = (a.buts || 0) + (a.penaltys_reussis || 0);
                const totalButsB = (b.buts || 0) + (b.penaltys_reussis || 0);
                if (totalButsB !== totalButsA) return totalButsB - totalButsA;
                return (b.passes_d || 0) - (a.passes_d || 0);
            });

            setTableData(dataToProcess);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    computeStats();
  }, [selectedScope, matchesList, selectedTeamId]); // Déclencheur : changement de scope ou liste de matchs (donc equipe)

  // Helper pour affichage nom équipe
  const getTeamName = (id: string) => {
      const t = teamsList.find(t => t.id === id);
      return t ? (t.nom === t.categorie ? t.categorie : `${t.categorie} - ${t.nom}`) : 'Chargement...';
  };

  const getCleanTeamName = (name: string) => name ? name.replace(/\s*\(.*?\)/g, '').trim() : "";

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8 font-sans text-[#1a1a1a]">
        
        {/* HEADER & FILTRES */}
        <div className="max-w-5xl mx-auto mb-8 flex flex-col gap-6">
             
             {/* Ligne 1 : Retour + Titre */}
             <div className="flex items-center gap-4">
                 <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors"><ArrowLeft size={20}/></Link>
                 <div>
                     <h1 className="text-3xl font-black italic uppercase tracking-tighter">ANALYSE STATS</h1>
                     <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Performances Joueurs</p>
                 </div>
             </div>

             {/* Ligne 2 : Les Deux Menus Déroulants */}
             <div className="flex flex-col md:flex-row gap-4">
                 
                 {/* FILTRE 1 : L'ÉQUIPE */}
                 <div className="relative flex-1">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Shield size={16} />
                     </div>
                     <select 
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full bg-white text-black pl-12 pr-10 py-4 rounded-2xl font-black uppercase text-xs appearance-none outline-none border border-gray-100 focus:border-[#ff9d00] shadow-sm cursor-pointer"
                     >
                        {teamsList.map((t) => (
                            <option key={t.id} value={t.id}>
                                {getCleanTeamName(t.nom === t.categorie ? t.categorie : `${t.categorie} - ${t.nom}`)}
                            </option>
                        ))}
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                 </div>

                 {/* FILTRE 2 : LA PÉRIODE (Saison ou Match) */}
                 <div className="relative flex-1">
                     <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff9d00]">
                        <Trophy size={16} />
                     </div>
                     <select 
                        value={selectedScope}
                        onChange={(e) => setSelectedScope(e.target.value)}
                        className="w-full bg-black text-white pl-12 pr-10 py-4 rounded-2xl font-black uppercase text-xs appearance-none outline-none border-2 border-transparent focus:border-[#ff9d00] transition-all cursor-pointer shadow-lg hover:bg-gray-900"
                     >
                        <option value="saison">🏆 SAISON (CUMUL GLOBAL)</option>
                        <optgroup label="Matchs Joués">
                            {matchesList.map((m) => (
                                <option key={m.id} value={m.id}>
                                    {format(new Date(m.date_heure), 'dd/MM')} vs {getCleanTeamName(m.adversaire)} {m.score_home !== null ? `(${m.score_home}-${m.score_away})` : ''}
                                </option>
                            ))}
                        </optgroup>
                     </select>
                     <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-white pointer-events-none" size={16}/>
                 </div>

             </div>
        </div>

        {/* CONTENU PRINCIPAL (TABLEAU) */}
        <div className="max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
            
            {/* EN-TÊTE TABLEAU */}
            <div className="bg-gray-50 p-5 border-b border-gray-100 grid grid-cols-12 gap-2 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center items-center">
                <div className="col-span-5 text-left pl-4">Joueur</div>
                <div className="col-span-1" title="Matchs Joués">M.J</div>
                <div className="col-span-2 text-green-600 flex justify-center gap-1"><Goal size={12}/> Buts</div>
                <div className="col-span-2 text-blue-500 flex justify-center gap-1"><Footprints size={12}/> Passes</div>
                <div className="col-span-1 text-yellow-500 flex justify-center"><AlertTriangle size={12}/></div>
                <div className="col-span-1 text-red-500 flex justify-center"><XOctagon size={12}/></div>
            </div>

            {/* LISTE JOUEURS */}
            <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="p-12 text-center text-gray-300 font-bold italic flex justify-center items-center gap-2">
                        Chargement des stats...
                    </div>
                ) : tableData.length === 0 ? (
                    <div className="p-12 text-center text-gray-300 font-bold italic">
                        Aucune donnée disponible pour cette sélection.
                    </div>
                ) : (
                    tableData.map((data: any, idx) => {
                        const totalButs = (data.buts || 0) + (data.penaltys_reussis || 0);
                        return (
                        <div key={idx} className="grid grid-cols-12 gap-2 p-4 items-center text-center hover:bg-gray-50 transition-colors group">
                            {/* Nom & Poste */}
                            <div className="col-span-5 text-left flex items-center gap-4 pl-2">
                                <div className="w-10 h-10 rounded-2xl bg-gray-100 text-gray-500 flex items-center justify-center font-black text-xs shadow-sm group-hover:bg-[#ff9d00] group-hover:text-white transition-colors">
                                    {data.joueurs.nom.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-black text-xs md:text-sm uppercase leading-none mb-1 text-[#1a1a1a]">
                                        {data.joueurs.nom} <span className="text-gray-400 font-bold">{data.joueurs.prenom}</span>
                                    </div>
                                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded w-fit">
                                        {data.joueurs.poste || 'N/A'}
                                    </div>
                                </div>
                            </div>

                            {/* Matchs Joués */}
                            <div className="col-span-1 font-black text-gray-300 text-xs">
                                {data.matchs_joues}
                            </div>

                            {/* BUTS (Highlight) */}
                            <div className="col-span-2">
                                {totalButs > 0 ? (
                                    <span className="inline-flex items-center justify-center min-w-[30px] h-[30px] rounded-lg bg-green-50 text-green-600 font-black text-sm shadow-sm border border-green-100">
                                        {totalButs}
                                    </span>
                                ) : (
                                    <span className="text-gray-200 font-bold">-</span>
                                )}
                            </div>

                            {/* PASSES */}
                            <div className="col-span-2 font-bold text-blue-500 text-sm">
                                {data.passes_d > 0 ? data.passes_d : <span className="text-gray-200 font-bold">-</span>}
                            </div>

                            {/* CARTONS JAUNES */}
                            <div className="col-span-1 font-bold text-yellow-500 text-sm">
                                {data.cartons_jaunes > 0 ? data.cartons_jaunes : <span className="text-gray-200">-</span>}
                            </div>

                            {/* CARTONS ROUGES */}
                            <div className="col-span-1 font-bold text-red-500 text-sm">
                                {data.cartons_rouges > 0 ? data.cartons_rouges : <span className="text-gray-200">-</span>}
                            </div>
                        </div>
                    )})
                )}
            </div>
        </div>
    </div>
  );
}