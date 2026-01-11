"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Trophy, 
  ArrowLeft, Loader2, ChevronDown, Edit2, Users, Trash2, CheckCircle2, UserCheck, Bell
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Imports composants existants
import LiveStandings from '../../components/LiveStandings';
import TeamPositionChart from '../../components/TeamPositionChart';
import ScoreModal from '../../components/ScoreModal';

// --- COMPOSANT TOAST (NOTIFICATION) INTERNE ---
const ToastNotification = ({ message, show }: { message: string, show: boolean }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-black text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-[#ff9d00]/30">
        <div className="bg-[#ff9d00] p-1.5 rounded-full text-black">
          <Bell size={14} fill="currentColor" />
        </div>
        <span className="text-xs font-black uppercase tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default function MatchsPageDynamique() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchs, setMatchs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats internes
  const [stats, setStats] = useState({ standings: [], history: [] });

  // États sélecteur équipe
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all'); // Par défaut 'all' ou l'ID de la première équipe

  // États Modale Score
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // États Notifications
  const [toast, setToast] = useState({ show: false, message: '' });

  useEffect(() => {
    fetchMatchsAndCalculate();

    // --- SUBSCRIPTION TEMPS RÉEL (REALTIME) ---
    const channel = supabase
      .channel('presence-updates')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'match_participations' },
        async (payload: any) => {
          if (payload.new && payload.new.reponse) {
             const { data: joueur } = await supabase
                .from('joueurs')
                .select('prenom, nom')
                .eq('id', payload.new.joueur_id)
                .single();
             
             const statusText = payload.new.reponse === 'present' ? 'est PRÉSENT ✅' : 'est ABSENT ❌';
             showNotification(`${joueur?.prenom || 'Un joueur'} ${statusText}`);
             fetchMatchsAndCalculate(false); 
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showNotification = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 4000);
  };

  const fetchMatchsAndCalculate = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        
        // 1. Equipes
        const { data: teamsData } = await supabase
          .from('equipes')
          .select('id, nom, categorie')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });

        if (teamsData && teamsData.length > 0) {
          setTeams(teamsData);
          // Si aucune équipe sélectionnée, on met la première par défaut (ou 'all' si vous préférez)
          if (!selectedTeamId || selectedTeamId === 'all') {
             // On garde 'all' par défaut si on veut voir tous les matchs au début
             // setSelectedTeamId(teamsData[0].id); 
          }
        }

        // 2. Matchs
        const { data: matchesData, error } = await supabase
          .from('matchs')
          .select('*, equipes(nom, categorie), match_participations(reponse)') 
          .eq('club_id', profile.club_id)
          .order('date_heure', { ascending: true });

        if (error) throw error;

        // 3. Calculs Stats
        const clubsMap: any = {};
        const history: any[] = [];

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
      if (showLoading) setLoading(false);
    }
  };

  const openScoreModal = (match: any) => {
    setSelectedMatch(match);
    setIsScoreModalOpen(true);
  };

  const handleDeleteMatch = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.")) {
        try {
            const { error } = await supabase.from('matchs').delete().eq('id', id);
            if (error) throw error;
            fetchMatchsAndCalculate();
            showNotification("Match supprimé avec succès");
        } catch (err) {
            console.error("Erreur suppression:", err);
            alert("Erreur lors de la suppression.");
        }
    }
  };

  const cleanTeamName = (name: string) => {
    if (!name) return "";
    return name.replace(/\s*\(.*?\)/g, '').trim();
  };

  // --- FILTRAGE AMÉLIORÉ ---
  const filteredMatchs = matchs.filter(m => {
    // 1. Filtre par équipe sélectionnée (si pas 'all')
    const teamMatch = selectedTeamId !== 'all' ? m.equipe_id === selectedTeamId : true;

    // 2. Filtre Recherche
    const searchMatch = (
        (m.adversaire?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.equipes?.nom?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.equipes?.categorie?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return teamMatch && searchMatch;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      
      {/* --- NOTIFICATION EN BAS --- */}
      <ToastNotification show={toast.show} message={toast.message} />

      <ScoreModal 
        isOpen={isScoreModalOpen} 
        match={selectedMatch} 
        onClose={() => setIsScoreModalOpen(false)}
        onUpdate={fetchMatchsAndCalculate} 
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
          
          {/* GAUCHE : SÉLECTEUR & CLASSEMENT */}
          <div className="w-full lg:w-1/3 space-y-6 sticky top-6 z-10 order-2 lg:order-1">
            <div className="bg-black text-white p-6 rounded-[2rem] shadow-xl">
               <label className="text-[9px] font-black uppercase tracking-widest text-white/50 mb-3 block">
                 Filtrer par équipe :
               </label>
               <div className="relative">
                 <select 
                   value={selectedTeamId || 'all'}
                   onChange={(e) => setSelectedTeamId(e.target.value)}
                   className="w-full bg-white/10 border border-white/20 text-white p-4 rounded-xl font-bold uppercase text-xs appearance-none outline-none focus:bg-white/20 transition-all cursor-pointer"
                 >
                   <option value="all" className="text-black font-black">🌍 VUE GLOBALE (TOUTES)</option>
                   {teams.map(t => (
                     <option key={t.id} value={t.id} className="text-black">
                       {cleanTeamName(t.nom === t.categorie ? t.categorie : `${t.categorie} - ${t.nom}`)}
                     </option>
                   ))}
                 </select>
                 <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50" size={16}/>
               </div>
            </div>

            {selectedTeamId && selectedTeamId !== 'all' ? (
               <div className="animate-in fade-in duration-500">
                 <TeamPositionChart />
                 <div className="h-[400px] mt-6">
                    <LiveStandings equipeId={selectedTeamId} />
                 </div>
               </div>
            ) : (
               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
                 <p className="text-gray-300 text-[10px] font-bold">Sélectionnez une équipe spécifique pour voir son classement détaillé.</p>
               </div>
            )}
          </div>

          {/* DROITE : LISTE MATCHS FILTRÉE */}
          <div className="flex-1 w-full order-1 lg:order-2">
            <div className="bg-white p-3 rounded-3xl border border-gray-100 mb-8 shadow-sm">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={22} />
                <input 
                  type="text" 
                  placeholder="RECHERCHER UN ADVERSAIRE..." 
                  className="w-full p-5 pl-16 rounded-2xl bg-gray-50 border-none outline-none font-black text-xs text-black italic uppercase"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-5">
              {filteredMatchs.length === 0 ? (
                  <div className="text-center p-12 bg-white rounded-[3rem] border border-dashed border-gray-200">
                      <p className="text-gray-300 font-bold text-xs">Aucun match trouvé pour cette sélection.</p>
                  </div>
              ) : (
                  filteredMatchs.map((match) => {
                    const presentCount = match.match_participations 
                        ? match.match_participations.filter((p: any) => p.reponse === 'present').length 
                        : 0;

                    return (
                    <div key={match.id} className="group bg-white p-6 rounded-[3rem] border border-gray-100 hover:border-[#ff9d00]/40 transition-all flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm relative overflow-visible animate-in slide-in-from-bottom-2">
                      
                      {/* DATE */}
                      <div className="flex items-center gap-5 min-w-[150px]">
                        <div className="w-20 h-20 rounded-[1.5rem] bg-black text-white flex flex-col items-center justify-center group-hover:bg-[#ff9d00] transition-all duration-500">
                          <span className="text-3xl leading-none">{format(new Date(match.date_heure), 'dd')}</span>
                          <span className="text-[10px] font-black">{format(new Date(match.date_heure), 'MMM', { locale: fr })}</span>
                        </div>
                        <div className="flex flex-col items-start gap-1">
                             <div className="text-[#ff9d00] font-black text-base italic">{format(new Date(match.date_heure), 'HH:mm')}</div>
                             <div className="flex items-center gap-1 bg-green-50 text-green-600 px-2 py-1 rounded-lg">
                                 <UserCheck size={12} />
                                 <span className="text-[10px] font-black">{presentCount} Présents</span>
                             </div>
                        </div>
                      </div>

                      {/* EQUIPES */}
                      <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 z-10 w-full min-w-0 px-2">
                        <span className="flex-1 font-black text-xs md:text-base text-black tracking-tighter text-right break-words leading-tight">
                            {cleanTeamName(match.equipes?.categorie || match.equipes?.nom)}
                        </span>
                        <div className="w-8 h-6 md:w-10 md:h-8 bg-black text-white text-[9px] rounded-lg flex items-center justify-center font-black skew-x-[-10deg] shrink-0 shadow-md">VS</div>
                        <span className="flex-1 font-black text-xs md:text-base text-black tracking-tighter text-left break-words leading-tight">
                            {cleanTeamName(match.adversaire)}
                        </span>
                      </div>

                      {/* BOUTONS ACTIONS */}
                      <div className="flex items-center gap-2 z-20">
                          <Link 
                            href={`/dashboard/matchs/${match.id}/tactique`}
                            className="w-12 h-12 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-colors"
                            title="Voir la composition & Convocations"
                          >
                             <Users size={18} />
                          </Link>

                          <div 
                            onClick={() => openScoreModal(match)}
                            className={`cursor-pointer px-4 md:px-6 py-4 rounded-2xl font-black text-xl min-w-[100px] text-center transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95
                              ${match.statut === 'termine' ? 'bg-gray-100 text-black hover:bg-[#ff9d00] hover:text-white' : 'bg-white text-black border-2 border-gray-100 hover:border-black shadow-sm'}
                            `}
                          >
                            {match.statut === 'termine' ? (
                                <>{match.score_home} - {match.score_away}</>
                            ) : (
                                <Edit2 size={16} className="text-gray-300" />
                            )}
                          </div>

                          <button 
                             onClick={() => handleDeleteMatch(match.id)}
                             className="w-12 h-12 flex items-center justify-center rounded-2xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                             title="Supprimer le match"
                          >
                             <Trash2 size={18} />
                          </button>
                      </div>

                      <Trophy className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-[#ff9d00]/5 transition-all duration-700 pointer-events-none" size={140} />
                    </div>
                  )})
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}