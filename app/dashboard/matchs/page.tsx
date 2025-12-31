"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Plus, Search, MapPin, Clock, Trophy, 
  Trash2, ChevronRight, TrendingUp, ListOrdered, Loader2, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function MatchsPageDynamique() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchs, setMatchs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ standings: [], history: [] });

  useEffect(() => {
    fetchMatchsAndCalculate();
  }, []);

  const fetchMatchsAndCalculate = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // 1. Récupération des matchs
      const { data: matchesData, error } = await supabase
        .from('matchs')
        .select('*, equipes(nom, categorie)')
        .order('date_heure', { ascending: true });

      if (error) throw error;

      // 2. LOGIQUE DYNAMIQUE : Calcul du classement et de l'historique
      const clubsMap: any = {};
      const history: any[] = [];
      let currentPoints = 0;

      matchesData?.forEach((m, index) => {
        if (m.statut === 'termine') {
          const home = m.equipes?.nom || 'GESTEAM';
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

          // Pour le graphique (Historique simplifié de la progression des points)
          if (home === 'GESTEAM' || m.club_id) {
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

        <div className="flex flex-col lg:flex-row gap-10">
          
          {/* --- COLONNE GAUCHE : STATS DYNAMIQUES --- */}
          <div className="w-full lg:w-1/3 space-y-8 order-2 lg:order-1">
            
            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#ff9d00]/10 rounded-lg">
                  <TrendingUp size={20} className="text-[#ff9d00]" />
                </div>
                <h4 className="text-[11px] tracking-widest text-black">Progression Points</h4>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats.history.length > 0 ? stats.history : [{day: 'J0', pts: 0}]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                    <XAxis dataKey="day" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="pts" stroke="#ff9d00" strokeWidth={4} dot={{ r: 6, fill: '#ff9d00', strokeWidth: 3, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-black text-white rounded-lg">
                  <ListOrdered size={20} />
                </div>
                <h4 className="text-[11px] tracking-widest text-black">Classement Dynamique</h4>
              </div>
              <div className="space-y-3">
                {stats.standings.slice(0, 5).map((team: any) => (
                  <div key={team.nom} className={`flex items-center justify-between p-4 rounded-2xl transition-all ${team.nom === 'GESTEAM' || team.nom.includes('AS') ? 'bg-[#ff9d00] text-white shadow-lg' : 'bg-gray-50 text-gray-500'}`}>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black">{team.pos}</span>
                      <span className="text-[10px] tracking-tighter truncate w-32">{team.nom}</span>
                    </div>
                    <span className="text-xs font-black">{team.pts} PTS</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- COLONNE DROITE : LISTE MATCHS --- */}
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