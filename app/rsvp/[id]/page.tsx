"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, MapPin, Calendar, Clock, Loader2, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RsvpPage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState<'attente' | 'present' | 'absent'>('attente');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchParticipation();
  }, [params.id]);

  const fetchParticipation = async () => {
    // On récupère les infos du match via l'ID de participation
    const { data: participation, error } = await supabase
      .from('match_participations')
      .select('*, matchs(*, equipes(nom)), joueurs(prenom, nom)')
      .eq('id', params.id)
      .single();

    if (!error && participation) {
      setData(participation);
      setStatus(participation.reponse || 'attente');
    }
    setLoading(false);
  };

  const handleResponse = async (newStatus: 'present' | 'absent') => {
    setIsUpdating(true);
    try {
      // Appel de la fonction sécurisée SQL qu'on a créée
      const { error } = await supabase.rpc('update_player_presence', {
        participation_id: params.id,
        new_status: newStatus
      });

      if (error) throw error;
      setStatus(newStatus);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-[#ff9d00]" /></div>;
  if (!data) return <div className="min-h-screen flex items-center justify-center font-bold text-xl">Lien invalide ou expiré.</div>;

  const match = data.matchs;
  const joueur = data.joueurs;

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans text-[#1a1a1a] flex flex-col items-center justify-center p-6">
      
      {/* LOGO / HEADER */}
      <div className="mb-8 text-center">
        <Shield size={48} className="mx-auto text-black mb-2" />
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">CONVOCATION</h1>
        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Gesteam Pro</p>
      </div>

      {/* CARTE MATCH */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-gray-100 w-full max-w-md text-center mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#ff9d00]"></div>
        
        <h2 className="text-xs font-black uppercase text-gray-400 mb-6">Bonjour {joueur.prenom}, confirme ta présence :</h2>
        
        <div className="mb-8">
            <div className="text-3xl font-black italic uppercase leading-none mb-2">{match.equipes.nom}</div>
            <div className="inline-block bg-black text-white text-[10px] font-black px-2 py-1 rounded skew-x-[-10deg] mb-2">VS</div>
            <div className="text-3xl font-black italic uppercase leading-none text-[#ff9d00]">{match.adversaire}</div>
        </div>

        <div className="flex justify-center gap-6 text-xs font-bold uppercase text-gray-500 mb-2">
            <div className="flex flex-col items-center gap-1">
                <Calendar size={18} className="text-black"/>
                {format(new Date(match.date_heure), 'dd MMM', { locale: fr })}
            </div>
            <div className="flex flex-col items-center gap-1">
                <Clock size={18} className="text-black"/>
                {format(new Date(match.date_heure), 'HH:mm')}
            </div>
            <div className="flex flex-col items-center gap-1">
                <MapPin size={18} className="text-black"/>
                {match.lieu}
            </div>
        </div>
      </div>

      {/* BOUTONS ACTIONS */}
      <div className="w-full max-w-md grid grid-cols-2 gap-4">
         <button 
           onClick={() => handleResponse('present')}
           disabled={isUpdating}
           className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95
             ${status === 'present' 
               ? 'bg-green-500 border-green-500 text-white shadow-lg scale-105 ring-4 ring-green-100' 
               : 'bg-white border-green-100 text-green-600 hover:bg-green-50'}
           `}
         >
            {isUpdating && status !== 'present' ? <Loader2 className="animate-spin"/> : <Check size={32} strokeWidth={4} />}
            <span className="font-black uppercase text-sm tracking-widest">Présent</span>
         </button>

         <button 
           onClick={() => handleResponse('absent')}
           disabled={isUpdating}
           className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95
             ${status === 'absent' 
               ? 'bg-red-500 border-red-500 text-white shadow-lg scale-105 ring-4 ring-red-100' 
               : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}
           `}
         >
            {isUpdating && status !== 'absent' ? <Loader2 className="animate-spin"/> : <X size={32} strokeWidth={4} />}
            <span className="font-black uppercase text-sm tracking-widest">Absent</span>
         </button>
      </div>

      {status !== 'attente' && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4">
              <p className="text-gray-400 text-xs font-bold uppercase">
                  Réponse enregistrée : <span className={status === 'present' ? 'text-green-500' : 'text-red-500'}>
                      {status === 'present' ? 'PRÉSENT ✅' : 'ABSENT ❌'}
                  </span>
              </p>
              <p className="text-[10px] text-gray-300 mt-1">Tu peux changer ton choix en cliquant sur l'autre bouton.</p>
          </div>
      )}

    </div>
  );
}