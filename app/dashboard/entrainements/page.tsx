"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Plus, Calendar, Clock, ArrowRight, Trash2, Settings, Loader2, 
  LayoutGrid, List 
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EntrainementsPage() {
  const [loading, setLoading] = useState(true);
  const [entrainements, setEntrainements] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  
  // État pour la vue (Carte ou Liste)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', session.user.id).single();
      
      if (profile?.club_id) {
        // Récupérer les équipes
        const { data: teamsData } = await supabase
           .from('equipes')
           .select('*')
           .eq('club_id', profile.club_id)
           .order('categorie');
        setTeams(teamsData || []);
        if (teamsData && teamsData.length > 0) setSelectedTeamId(teamsData[0].id);

        // Récupérer les entraînements
        fetchEntrainements(profile.club_id);
      }
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const fetchEntrainements = async (clubId: string) => {
      const { data } = await supabase
        .from('entrainements')
        .select('*, entrainement_participations(statut)')
        .eq('club_id', clubId)
        .order('date_heure', { ascending: false }); // Plus récents en haut
      setEntrainements(data || []);
  };

  const deleteEntrainement = async (id: string) => {
      if(!confirm("Supprimer cette séance ?")) return;
      await supabase.from('entrainements').delete().eq('id', id);
      setEntrainements(prev => prev.filter(e => e.id !== id));
  };

  // Filtrer par équipe sélectionnée
  const filteredList = selectedTeamId 
    ? entrainements.filter(e => e.equipe_id === selectedTeamId)
    : entrainements;

  // Calcul du taux de présence
  const getPresenceRate = (parts: any[]) => {
      if (!parts || parts.length === 0) return 0;
      const presents = parts.filter(p => p.statut === 'PRESENT' || p.statut === 'RETARD').length;
      return Math.round((presents / parts.length) * 100);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="p-6 md:p-12 font-sans text-[#1a1a1a] min-h-screen bg-[#f9fafb]">
       
       {/* HEADER */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
                Entraînements
            </h1>
            <p className="text-gray-400 font-bold uppercase text-xs tracking-widest mt-1">
                Planification et Présences
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
              {/* BOUTON GESTION THÈMES */}
              <Link href="/dashboard/entrainements/themes" className="bg-white text-black border border-gray-200 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-black transition-all flex items-center gap-2 shadow-sm">
                 <Settings size={18} /> Thèmes
              </Link>

              {/* BOUTON NOUVELLE SÉANCE */}
              <Link href="/dashboard/entrainements/nouveau" className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg">
                 <Plus size={18} /> Nouvelle Séance
              </Link>
          </div>
       </div>

       {/* BARRE DE FILTRES ET TOGGLE */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
           
           {/* FILTRES EQUIPES */}
           <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 no-scrollbar">
              <button 
                onClick={() => setSelectedTeamId("")}
                className={`px-6 py-3 rounded-xl font-black uppercase text-xs whitespace-nowrap transition-all ${selectedTeamId === "" ? 'bg-[#ff9d00] text-black shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
              >
                Toutes
              </button>
              {teams.map(t => (
                 <button 
                   key={t.id} 
                   onClick={() => setSelectedTeamId(t.id)}
                   className={`px-6 py-3 rounded-xl font-black uppercase text-xs whitespace-nowrap transition-all ${selectedTeamId === t.id ? 'bg-black text-white shadow-lg' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                 >
                   {t.categorie} {t.nom !== t.categorie && `- ${t.nom}`}
                 </button>
              ))}
           </div>

           {/* TOGGLE VIEW MODE (Style Orange Appliqué) */}
           <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
               <button 
                  onClick={() => setViewMode('cards')}
                  className={`p-3 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-[#ff9d00] text-black shadow-md' : 'text-gray-300 hover:bg-gray-50 hover:text-black'}`}
                  title="Vue Cartes"
               >
                   <LayoutGrid size={18} />
               </button>
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-black shadow-md' : 'text-gray-300 hover:bg-gray-50 hover:text-black'}`}
                  title="Vue Liste"
               >
                   <List size={18} />
               </button>
           </div>
       </div>

       {/* CONTENU (GRILLE OU LISTE) */}
       {viewMode === 'cards' ? (
           // --- VUE CARTES (GRILLE) ---
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredList.map(session => {
                 const rate = getPresenceRate(session.entrainement_participations);
                 const date = new Date(session.date_heure);
                 const isPast = date < new Date();

                 return (
                   <div key={session.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 hover:border-[#ff9d00] transition-all shadow-sm group relative overflow-hidden">
                      <div className="flex justify-between items-start mb-6 relative z-10">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex flex-col items-center justify-center font-black leading-none group-hover:bg-[#ff9d00] group-hover:text-white transition-colors">
                              <span className="text-xl">{format(date, 'dd')}</span>
                              <span className="text-[10px] uppercase">{format(date, 'MMM', { locale: fr })}</span>
                          </div>
                          <div className="text-right">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>
                                  {isPast ? 'Terminé' : 'À venir'}
                              </span>
                          </div>
                      </div>
                      <div className="mb-6 relative z-10">
                          <h3 className="font-black text-xl italic uppercase mb-1 truncate">{session.theme || 'Entraînement'}</h3>
                          <div className="flex items-center gap-4 text-gray-400 text-xs font-bold uppercase">
                              <span className="flex items-center gap-1"><Clock size={14}/> {format(date, 'HH:mm')}</span>
                              <span className="flex items-center gap-1"><Clock size={14}/> {session.duree_minutes} min</span>
                          </div>
                      </div>
                      <div className="mb-6 relative z-10">
                          <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                              <span className="text-gray-400">Présence</span>
                              <span>{rate}%</span>
                          </div>
                          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-[#ff9d00]" style={{ width: `${rate}%` }}></div>
                          </div>
                      </div>
                      <div className="flex items-center gap-2 relative z-10">
                          <Link href={`/dashboard/entrainements/${session.id}`} className="flex-1 bg-black text-white py-3 rounded-xl font-black uppercase text-[10px] text-center hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                              Faire l'appel <ArrowRight size={14}/>
                          </Link>
                          <button onClick={() => deleteEntrainement(session.id)} className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors">
                              <Trash2 size={16} />
                          </button>
                      </div>
                   </div>
                 )
              })}
           </div>
       ) : (
           // --- VUE LISTE (TABLE COMPACTE) ---
           <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {filteredList.map(session => {
                 const rate = getPresenceRate(session.entrainement_participations);
                 const date = new Date(session.date_heure);
                 const isPast = date < new Date();

                 return (
                    <div key={session.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between shadow-sm hover:border-[#ff9d00] transition-all group gap-4">
                        
                        {/* Date & Info */}
                        <div className="flex items-center gap-4 md:flex-1">
                            <div className="w-14 h-14 bg-black text-white rounded-xl flex flex-col items-center justify-center font-black leading-none shadow-md group-hover:bg-[#ff9d00] transition-colors">
                                <span className="text-lg">{format(date, 'dd')}</span>
                                <span className="text-[9px] uppercase">{format(date, 'MMM', { locale: fr })}</span>
                            </div>
                            <div>
                                <h3 className="font-black text-base italic uppercase text-[#1a1a1a]">{session.theme || 'Entraînement'}</h3>
                                <div className="flex items-center gap-3 text-gray-400 text-[10px] font-bold uppercase mt-1">
                                    <span className="flex items-center gap-1"><Clock size={12}/> {format(date, 'HH:mm')}</span>
                                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                    <span>{session.duree_minutes} min</span>
                                    <span className={`px-2 py-0.5 rounded text-[8px] ${isPast ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-600'}`}>
                                        {isPast ? 'Terminé' : 'À venir'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Presence Bar (Compact) */}
                        <div className="w-full md:w-48">
                            <div className="flex justify-between text-[9px] font-black uppercase mb-1">
                                <span className="text-gray-400">Présence</span>
                                <span>{rate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#ff9d00]" style={{ width: `${rate}%` }}></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Link href={`/dashboard/entrainements/${session.id}`} className="flex-1 md:flex-none bg-gray-50 text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] text-center hover:bg-black hover:text-white transition-colors flex items-center justify-center gap-2 border border-gray-100">
                                Faire l'appel <ArrowRight size={14}/>
                            </Link>
                            <button onClick={() => deleteEntrainement(session.id)} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                 )
              })}
           </div>
       )}

       {/* EMPTY STATE */}
       {filteredList.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 rounded-[2rem] border-2 border-dashed border-gray-200 text-gray-300 mt-6">
              <Calendar size={40} className="mb-4 opacity-50"/>
              <span className="font-black uppercase text-xs">Aucune séance trouvée</span>
          </div>
       )}

    </div>
  );
}