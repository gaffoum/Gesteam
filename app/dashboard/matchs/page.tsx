"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Trophy, 
  ArrowLeft, Loader2, ChevronDown, Edit2
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Imports composants
import LiveStandings from '../../components/LiveStandings';
import TeamPositionChart from '../../components/TeamPositionChart';
import ScoreModal from '../../components/ScoreModal';

export default function MatchsPageDynamique() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchs, setMatchs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats internes (pour usage futur ou graphique)
  const [stats, setStats] = useState({ standings: [], history: [] });

  // États pour le sélecteur d'équipe (Classement FFF)
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  // --- ÉTATS POUR LA MODALE SCORE ---
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  useEffect(() => {
    fetchMatchsAndCalculate();
  }, []);

  const fetchMatchsAndCalculate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        
        // 1. Récupérer les équipes
        const { data: teamsData } = await supabase
          .from('equipes')
          .select('id, nom, categorie')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });

        if (teamsData && teamsData.length > 0) {
          setTeams(teamsData);
          // On ne change la sélection que si elle est vide (pour éviter reset si refresh)
          if (!selectedTeamId) setSelectedTeamId(teamsData[0].id);
        }

        // 2. Récupérer les matchs
        const { data: matchesData, error } = await supabase
          .from('matchs')
          .select('*, equipes(nom, categorie)')
          .eq('club_id', profile.club_id)
          .order('date_heure', { ascending: true });

        if (error) throw error;

        // 3. Calculs Stats (Interne)
        const clubsMap: any = {};
        const history: any[] = [];
        let currentPoints = 0;

        matchesData?.forEach((m, index) => {
          if (m.statut === 'termine') {
            const home = m.equipes?.categorie || m.equipes?.nom || 'MON ÉQUIPE';
            const away = m.adversaire;
            
            if (!clubsMap[home]) clubsMap[home] = { nom: home, pts: 0, j: 0 };
            if (!clubsMap[away]) clubsMap[away] = { nom: away, pts: 0, j: 0 };

            clubsMap[home].j += 1;
            clubsMap[away].j += 1;

            if (m.score_home > m.score_away) {
              clubsMap[home].pts += 3;
            } else if (m.score_home < m.score_away) {
              clubsMap[away].pts += 3;
            } else {
              clubsMap[home].pts += 1;
              clubsMap[away].pts += 1;
            }

            if (m.equipes?.id) {
              currentPoints = clubsMap[home].pts;
              history.push({ day: `J${history.length + 1}`, pts: currentPoints });
            }
          }
        });

        const sortedStandings = Object.values(clubsMap)
          .sort((a: any, b: any) => b.pts - a.pts)
          .map((team: any, idx) => ({ ...team, pos: idx + 1 }));

        setMatchs(matchesData || []);
        setStats({ standings: sortedStandings as any, history: history as any });
      }
    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- FONCTION POUR OUVRIR LA MODALE ---
  const openScoreModal = (match: any) => {
    setSelectedMatch(match);
    setIsScoreModalOpen(true);
  };

  const filteredMatchs = matchs.filter(m => 
    (m.adversaire?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.equipes?.nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.equipes?.categorie?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      
      {/* --- INTEGRATION DE LA MODALE --- */}
      <ScoreModal 
        isOpen={isScoreModalOpen} 
        match={selectedMatch} 
        onClose={() => setIsScoreModalOpen(false)}
        onUpdate={fetchMatchsAndCalculate} // Met à jour le calendrier après validation
      />

      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-5xl tracking-tighter text-black italic">
                Calendrier <span className="text-[#ff9d00]">Matchs</span>
              </h1>
              <p className="text-gray-400 text-[10px] tracking-[0.4em] mt-1 font-bold">Gestion des scores et performances</p>
            </div>
          </div>
          <Link href="/dashboard/matchs/nouveau" className="bg-black text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-2xl active:scale-95">
            <Plus size={20} /> PROGRAMMER UN MATCH
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* GAUCHE : CLASSEMENT + GRAPHIQUE */}
          <div className="w-full lg:w-1/3 space-y-6 sticky top-6 z-10 order-2 lg:order-1">
            <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl">
               <label className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-3 block">
                 Sélectionner une équipe :
               </label>
               <div className="relative">
                 <select 
                   value={selectedTeamId || ''}
                   onChange={(e) => setSelectedTeamId(e.target.value)}
                   className="w-full bg-white/10 border border-white/20 text-white p-4 rounded-xl font-bold uppercase text-xs appearance-none outline-none focus:bg-white/20 transition-all cursor-pointer"
                 >
                   {teams.length === 0 && <option>Aucune équipe</option>}
                   {teams.map(t => (
                     <option key={t.id} value={t.id} className="text-black">
                       {t.categorie} - {t.nom}
                     </option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50" size={16}/>
               </div>
            </div>

            {selectedTeamId ? (
               <>
                 <TeamPositionChart />
                 <div className="h-[400px]">
                    <LiveStandings equipeId={selectedTeamId} />
                 </div>
               </>
            ) : (
               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
                 <p className="text-gray-300 text-[10px] font-bold">Sélectionnez une équipe pour voir son classement.</p>
               </div>
            )}
          </div>

          {/* DROITE : LISTE MATCHS */}
          <div className="flex-1 w-full order-1 lg:order-2">
            <div className="bg-white p-3 rounded-3xl border border-gray-100 mb-8 shadow-sm">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
                <input 
                  type="text" 
                  placeholder="RECHERCHER UN MATCH..." 
                  className="w-full p-5 pl-16 rounded-2xl bg-gray-50 border-none outline-none font-black text-xs text-black italic uppercase"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              {filteredMatchs.map((match) => (
                <div key={match.id} className="group bg-white p-6 rounded-[3rem] border border-gray-100 hover:border-[#ff9d00]/40 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-visible">
                  
                  {/* DATE */}
                  <div className="flex items-center gap-5 min-w-[150px]">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-black text-white flex flex-col items-center justify-center group-hover:bg-[#ff9d00] transition-all duration-500">
                      <span className="text-3xl leading-none">{format(new Date(match.date_heure), 'dd')}</span>
                      <span className="text-[10px] font-black">{format(new Date(match.date_heure), 'MMM', { locale: fr })}</span>
                    </div>
                    <div className="text-[#ff9d00] font-black text-base italic">{format(new Date(match.date_heure), 'HH:mm')}</div>
                  </div>

                  {/* EQUIPES (CORRIGÉ : FLEX-1 pour éviter de couper le texte) */}
                  <div className="flex-1 flex items-center justify-center gap-4 z-10 w-full min-w-0">
                    {/* NOM EQUIPE */}
                    <span className="flex-1 font-black text-lg md:text-xl text-black tracking-tighter text-right truncate">
                        {match.equipes?.categorie || match.equipes?.nom}
                    </span>
                    
                    {/* VS BADGE */}
                    <div className="w-10 h-8 bg-black text-white text-[10px] rounded-lg flex items-center justify-center font-black skew-x-[-10deg] shrink-0 shadow-md">VS</div>
                    
                    {/* ADVERSAIRE */}
                    <span className="flex-1 font-black text-lg md:text-xl text-black tracking-tighter text-left truncate">
                        {match.adversaire}
                    </span>
                  </div>

                  {/* STATUT / BOUTON ACTION (STYLISÉ) */}
                  <div 
                    onClick={() => openScoreModal(match)}
                    className={`cursor-pointer px-6 py-4 rounded-2xl font-black text-xl min-w-[140px] text-center transition-all z-20 flex items-center justify-center gap-2 hover:scale-105 active:scale-95
                      ${match.statut === 'termine' ? 'bg-gray-100 text-black hover:bg-[#ff9d00] hover:text-white' : 'bg-white text-black border-2 border-gray-100 hover:border-black shadow-sm'}
                    `}
                  >
                    {match.statut === 'termine' ? (
                        <>{match.score_home} - {match.score_away}</>
                    ) : (
                        <span className="text-gray-300 group-hover:text-black flex items-center gap-2 text-sm">
                          <Edit2 size={14} /> SCORE
                        </span>
                    )}
                  </div>

                  <Trophy className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-[#ff9d00]/5 transition-all duration-700 pointer-events-none" size={140} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}