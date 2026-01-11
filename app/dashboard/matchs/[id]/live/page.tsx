"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Goal, AlertTriangle, XOctagon, Footprints, 
  Trophy, Loader2, Minus, Plus, ShieldAlert, Clock, CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function MatchLivePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('live_match')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'match_participations' }, () => fetchData(false))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matchs' }, () => fetchData(false))
        .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id]);

  const fetchData = async (showLoad = true) => {
    if (showLoad) setLoading(true);
    try {
        const { data: matchData } = await supabase.from('matchs').select('*, equipes(nom)').eq('id', params.id).single();
        setMatch(matchData);

        const { data: parts } = await supabase
            .from('match_participations')
            .select('*, joueurs(nom, prenom, poste)')
            .eq('match_id', params.id)
            .order('est_titulaire', { ascending: false });

        setPlayers(parts || []);
    } catch (e) { console.error(e); } 
    finally { if (showLoad) setLoading(false); }
  };

  // --- GESTION DES PERIODES ---
  const updatePeriod = async (newPeriod: string) => {
      // Optimistic UI
      setMatch({ ...match, current_period: newPeriod });
      
      const updates: any = { current_period: newPeriod };
      
      // Si on termine le match, on met à jour le statut global
      if (newPeriod === 'TERMINE') {
          updates.statut = 'termine';
      }

      await supabase.from('matchs').update(updates).eq('id', params.id);

      if (newPeriod === 'TERMINE') {
          router.push(`/dashboard/matchs/${params.id}/stats`); // Redirection vers les stats
      }
  };

  const handleStatUpdate = async (type: string, delta: number = 1) => {
    if (!selectedPlayer) return;
    const updatedPlayers = players.map(p => p.id === selectedPlayer.id ? { ...p, [type]: (p[type] || 0) + delta } : p);
    setPlayers(updatedPlayers);
    
    await supabase.from('match_participations').update({ [type]: (selectedPlayer[type] || 0) + delta }).eq('id', selectedPlayer.id);

    if (type === 'buts' || type === 'penaltys_reussis') {
        const newScore = (match.score_home || 0) + delta;
        setMatch({ ...match, score_home: newScore });
        await supabase.from('matchs').update({ score_home: newScore }).eq('id', params.id);
    }
    setSelectedPlayer(null);
  };

  const handleOpponentGoal = async (delta: number) => {
      const newScore = Math.max(0, (match.score_away || 0) + delta);
      setMatch({ ...match, score_away: newScore });
      await supabase.from('matchs').update({ score_away: newScore }).eq('id', params.id);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-[#ff9d00]" /></div>;

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white font-sans flex flex-col pb-24"> {/* Padding bottom pour la barre fixe */}
      
      {/* HEADER SCORE */}
      <div className="bg-black p-4 border-b border-gray-800 sticky top-0 z-10 flex items-center justify-between shadow-xl">
          <Link href={`/dashboard/matchs`} className="p-2 bg-gray-800 rounded-xl hover:bg-[#ff9d00] hover:text-black transition-colors"><ArrowLeft size={20}/></Link>
          <div className="flex items-center gap-6">
              <div className="text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase block">{match?.equipes?.nom}</span>
                  <span className="text-4xl font-black text-[#ff9d00]">{match.score_home}</span>
              </div>
              <div className="flex flex-col items-center">
                  <span className="text-gray-600 font-black text-xl">:</span>
                  <span className="text-[10px] font-black uppercase bg-gray-800 px-2 py-0.5 rounded text-white mt-1">
                      {match.current_period === 'MT' ? 'MI-TEMPS' : match.current_period}
                  </span>
              </div>
              <div className="text-center">
                  <span className="text-xs font-bold text-gray-500 uppercase block">{match.adversaire}</span>
                  <div className="flex items-center gap-3">
                      <button onClick={() => handleOpponentGoal(-1)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-500 transition-colors"><Minus size={14}/></button>
                      <span className="text-4xl font-black text-white">{match.score_away}</span>
                      <button onClick={() => handleOpponentGoal(1)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-500 transition-colors"><Plus size={14}/></button>
                  </div>
              </div>
          </div>
          <div className="w-10"></div>
      </div>

      {/* GRILLE JOUEURS */}
      <div className="flex-1 p-4 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {players.map((p) => (
                  <div key={p.id} onClick={() => setSelectedPlayer(p)}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 flex flex-col items-center text-center shadow-lg
                        ${p.est_titulaire ? 'bg-gray-900 border-gray-800 hover:border-[#ff9d00]' : 'bg-gray-900/50 border-dashed border-gray-800 opacity-70 hover:opacity-100'}
                    `}
                  >
                      <span className="absolute top-3 right-3 text-[9px] font-black bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{p.joueurs.poste?.substring(0,3).toUpperCase()}</span>
                      <div className="w-14 h-14 rounded-full bg-gray-800 text-gray-400 flex items-center justify-center font-black text-xl mb-3 border border-gray-700">{p.joueurs.nom.charAt(0)}</div>
                      <h4 className="font-black uppercase text-sm leading-tight mb-3">{p.joueurs.prenom} <br/> {p.joueurs.nom}</h4>
                      <div className="flex flex-wrap justify-center gap-1">
                          {(p.buts > 0 || p.penaltys_reussis > 0) && <span className="bg-green-500 text-black text-[9px] font-bold px-1.5 rounded flex items-center gap-1"><Goal size={8}/> {p.buts + p.penaltys_reussis}</span>}
                          {p.passes_d > 0 && <span className="bg-blue-500 text-white text-[9px] font-bold px-1.5 rounded flex items-center gap-1"><Footprints size={8}/> {p.passes_d}</span>}
                          {p.cartons_jaunes > 0 && <span className="bg-yellow-400 text-black text-[9px] font-bold px-1.5 rounded flex items-center gap-1"><AlertTriangle size={8}/> {p.cartons_jaunes}</span>}
                          {p.cartons_rouges > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 rounded flex items-center gap-1"><XOctagon size={8}/></span>}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* --- BARRE DE CONTRÔLE FIXE (MATCH FLOW) --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-800 p-4 pb-8 z-40">
          <div className="max-w-md mx-auto flex gap-4">
              {match?.current_period === 'P1' && (
                  <button onClick={() => updatePeriod('MT')} className="flex-1 bg-white text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                      <Clock size={20}/> Siffler Mi-Temps
                  </button>
              )}
              {match?.current_period === 'MT' && (
                  <button onClick={() => updatePeriod('P2')} className="flex-1 bg-[#ff9d00] text-black py-4 rounded-xl font-black uppercase tracking-widest hover:bg-orange-500 transition-colors flex items-center justify-center gap-2">
                      <Goal size={20}/> Lancer 2nde Période
                  </button>
              )}
              {(match?.current_period === 'P2' || match?.current_period === 'MT') && (
                  <button onClick={() => { if(confirm('Terminer le match et valider le score ?')) updatePeriod('TERMINE') }} className="flex-1 bg-red-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                      <CheckCircle size={20}/> Fin du Match
                  </button>
              )}
               {match?.current_period === 'TERMINE' && (
                  <button onClick={() => router.push(`/dashboard/matchs/${params.id}/stats`)} className="flex-1 bg-green-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-green-600 transition-colors flex items-center justify-center gap-2">
                      <Trophy size={20}/> Voir les Stats
                  </button>
              )}
          </div>
      </div>

      {/* MODALE ACTIONS JOUEURS (Identique à avant) */}
      {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedPlayer(null)}>
              <div className="bg-[#1a1a1a] w-full max-w-2xl rounded-t-[2.5rem] border-t border-gray-800 p-8 animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                  <div className="text-center mb-8">
                      <h3 className="text-2xl font-black italic uppercase">{selectedPlayer.joueurs.prenom} {selectedPlayer.joueurs.nom}</h3>
                      <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">Sélectionnez un fait de jeu ({match.current_period})</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-8">
                      <button onClick={() => handleStatUpdate('buts')} className="bg-green-500 text-black p-4 rounded-2xl flex flex-col items-center gap-2"><Goal size={32} /><span className="font-black text-xs">But</span></button>
                      <button onClick={() => handleStatUpdate('passes_d')} className="bg-blue-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2"><Footprints size={32} /><span className="font-black text-xs">Passe D.</span></button>
                      <button onClick={() => handleStatUpdate('penaltys_reussis')} className="bg-gray-800 text-white p-4 rounded-2xl flex flex-col items-center gap-2"><Trophy size={32} className="text-[#ff9d00]" /><span className="font-black text-xs">Péno OK</span></button>
                      <button onClick={() => handleStatUpdate('cartons_jaunes')} className="bg-yellow-400 text-black p-4 rounded-2xl flex flex-col items-center gap-2"><AlertTriangle size={32} /><span className="font-black text-xs">Jaune</span></button>
                      <button onClick={() => handleStatUpdate('cartons_rouges')} className="bg-red-500 text-white p-4 rounded-2xl flex flex-col items-center gap-2"><XOctagon size={32} /><span className="font-black text-xs">Rouge</span></button>
                      <button onClick={() => handleStatUpdate('penaltys_rates')} className="bg-gray-800 text-red-400 p-4 rounded-2xl flex flex-col items-center gap-2"><ShieldAlert size={32} /><span className="font-black text-xs">Péno Raté</span></button>
                  </div>
                  <button onClick={() => setSelectedPlayer(null)} className="w-full bg-black text-white p-4 rounded-xl font-bold uppercase text-xs tracking-widest border border-gray-800">Annuler</button>
              </div>
          </div>
      )}
    </div>
  );
}