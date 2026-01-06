"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, Trophy, 
  ArrowLeft, Loader2, ChevronDown
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- IMPORTS DES NOUVEAUX COMPOSANTS ---
import LiveStandings from '@/app/components/LiveStandings';
import TeamPositionChart from '../../components/TeamPositionChart';

export default function MatchsPageDynamique() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // Données existantes
  const [matchs, setMatchs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // NOUVEAUX ÉTATS POUR LE CLASSEMENT FFF
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    fetchMatchsAndCalculate();
  }, []);

  const fetchMatchsAndCalculate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // 0. Récupérer le club_id du profil connecté
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        
        // --- NOUVEAU : Récupérer les ÉQUIPES pour le sélecteur ---
        const { data: teamsData } = await supabase
          .from('equipes')
          .select('id, nom, categorie')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });

        if (teamsData && teamsData.length > 0) {
          setTeams(teamsData);
          // Sélectionner la première équipe par défaut pour afficher son classement
          setSelectedTeamId(teamsData[0].id);
        }

        // 1. Récupération des matchs (Votre logique existante)
        const { data: matchesData, error } = await supabase
          .from('matchs')
          .select('*, equipes(nom, categorie)')
          .eq('club_id', profile.club_id) // Sécurité : on filtre par club
          .order('date_heure', { ascending: true });

        if (error) throw error;

        // (Votre logique de calcul local est conservée ici si besoin pour d'autres stats, 
        // mais l'affichage principal gauche utilisera désormais les données FFF)
        setMatchs(matchesData || []);
      }

    } catch (err) {
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatchs = matchs.filter(m => 
    (m.adversaire?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.equipes?.nom?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER AVEC FLÈCHE RETOUR */}
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
          
          {/* --- COLONNE GAUCHE (1/3) : CLASSEMENT + GRAPHIQUE --- */}
          {/* C'est ici qu'on a intégré les modifications demandées */}
          <div className="w-full lg:w-1/3 space-y-6 sticky top-6 z-10 order-2 lg:order-1">
            
            {/* 1. SÉLECTEUR D'ÉQUIPE */}
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
                 {/* 2. GRAPHIQUE DE POSITION */}
                 <TeamPositionChart />
                 
                 {/* 3. CLASSEMENT LIVE FFF */}
                 <div className="h-fit">
                    <LiveStandings equipeId={selectedTeamId} />
                 </div>
               </>
            ) : (
               <div className="bg-white p-8 rounded-[2rem] border border-gray-100 text-center">
                 <p className="text-gray-300 text-[10px] font-bold">Sélectionnez une équipe pour voir son classement.</p>
               </div>
            )}
          </div>

          {/* --- COLONNE DROITE (2/3) : LISTE MATCHS --- */}
          {/* Cette partie reste identique à votre code original */}
          <div className="flex-1 order-1 lg:order-2">
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
                <div key={match.id} className="group bg-white p-6 rounded-[3rem] border border-gray-100 hover:border-[#ff9d00]/40 transition-all flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-6 min-w-[170px]">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-gray-100 text-black flex flex-col items-center justify-center group-hover:bg-black group-hover:text-white transition-all duration-500">
                      <span className="text-3xl leading-none">{format(new Date(match.date_heure), 'dd')}</span>
                      <span className="text-[10px] font-black">{format(new Date(match.date_heure), 'MMM', { locale: fr })}</span>
                    </div>
                    <div className="text-[#ff9d00] font-black text-base italic">{format(new Date(match.date_heure), 'HH:mm')}</div>
                  </div>

                  <div className="flex-1 flex items-center justify-center md:justify-start gap-8">
                    <span className="font-black text-xl text-black tracking-tighter">{match.equipes?.nom || 'GESTEAM'}</span>
                    <div className="w-12 h-8 bg-black text-white text-[11px] rounded-lg flex items-center justify-center font-black skew-x-[-15deg]">VS</div>
                    <span className="font-black text-xl text-black tracking-tighter">{match.adversaire}</span>
                  </div>

                  <div className={`px-8 py-4 rounded-2xl font-black text-2xl min-w-[130px] text-center ${match.statut === 'termine' ? 'bg-black text-white' : 'bg-gray-50 text-gray-200'}`}>
                    {match.statut === 'termine' ? `${match.score_home} - ${match.score_away}` : 'FIXÉ'}
                  </div>
                  <Trophy className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-[#ff9d00]/5 transition-all duration-700" size={140} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}