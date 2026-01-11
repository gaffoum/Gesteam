"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Users, Save, Share2, Loader2, AlertCircle,
  Check, AlertTriangle, Copy, MessageCircle, X, ThumbsUp, ThumbsDown
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function TactiquePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // --- ÉTATS ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [match, setMatch] = useState<any>(null);
  
  // Liste de tous les joueurs participants (titulaires + remplaçants)
  const [players, setPlayers] = useState<any[]>([]);
  
  // État pour le Drag & Drop
  const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);

  // --- MODALE GENERIQUE (Succès/Erreur) ---
  const [modal, setModal] = useState<{ 
    show: boolean; 
    type: 'success' | 'error' | 'info'; 
    title: string; 
    message: string 
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // --- ÉTATS MODALE WHATSAPP ---
  const [showWhatsappModal, setShowWhatsappModal] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");

  // --- CHARGEMENT ---
  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // 1. Infos Match
      const { data: matchData } = await supabase
        .from('matchs')
        .select('*, equipes(nom)')
        .eq('id', params.id)
        .single();
      setMatch(matchData);

      // 2. Récupérer les participants
      const { data: participations, error } = await supabase
        .from('match_participations')
        .select('*, joueurs(id, nom, prenom, poste, telephone)')
        .eq('match_id', params.id);

      if (error) throw error;

      // Formatage des données
      const formattedPlayers = participations?.map((p: any) => ({
        id: p.joueur_id,
        participation_id: p.id,
        nom: p.joueurs.nom,
        prenom: p.joueurs.prenom, 
        poste: p.joueurs.poste,
        telephone: p.joueurs.telephone,
        reponse: p.reponse || 'attente', // 'present', 'absent', 'attente'
        est_titulaire: p.est_titulaire || false,
        x: p.position_x || 50,
        y: p.position_y || 50
      })) || [];

      setPlayers(formattedPlayers);

    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE DRAG & DROP ---

  const handleDragStart = (e: React.DragEvent, playerId: string) => {
    setDraggedPlayerId(playerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 1. DROP SUR LE TERRAIN
  const handleDropOnField = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPlayerId || !fieldRef.current) return;

    const fieldRect = fieldRef.current.getBoundingClientRect();
    const x = ((e.clientX - fieldRect.left) / fieldRect.width) * 100;
    const y = ((e.clientY - fieldRect.top) / fieldRect.height) * 100;

    setPlayers(prev => prev.map(p => {
      if (p.id === draggedPlayerId) {
        return { ...p, est_titulaire: true, x, y };
      }
      return p;
    }));
    setDraggedPlayerId(null);
  };

  // 2. DROP SUR LE BANC
  const handleDropOnBench = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedPlayerId) return;

    setPlayers(prev => prev.map(p => {
      if (p.id === draggedPlayerId) {
        return { ...p, est_titulaire: false, x: null, y: null };
      }
      return p;
    }));
    setDraggedPlayerId(null);
  };

  // --- SAUVEGARDE ---
  const handleSaveComposition = async () => {
    setSaving(true);
    try {
      const updates = players.map(p => ({
        id: p.participation_id,
        match_id: params.id,
        joueur_id: p.id,
        est_titulaire: p.est_titulaire,
        position_x: p.est_titulaire ? p.x : null,
        position_y: p.est_titulaire ? p.y : null,
        reponse: p.reponse, // On sauvegarde aussi le statut de réponse
        updated_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('match_participations')
        .upsert(updates);

      if (error) throw error;

      // SUCCESS MODAL
      setModal({
        show: true,
        type: 'success',
        title: 'SAUVEGARDE RÉUSSIE',
        message: 'La composition et les statuts de présence ont été enregistrés.'
      });
      
    } catch (err: any) {
      console.error("Erreur sauvegarde:", err);
      // ERROR MODAL
      setModal({
        show: true,
        type: 'error',
        title: 'ÉCHEC SAUVEGARDE',
        message: err.message || "Une erreur technique est survenue."
      });
    } finally {
      setSaving(false);
    }
  };

  // --- GESTION PRÉSENCE (Mise à jour directe) ---
  const updatePresence = async (playerId: string, status: 'present' | 'absent' | 'attente') => {
    // 1. Mise à jour Optimiste (Interface)
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, reponse: status } : p));

    // 2. Mise à jour BDD
    try {
        const player = players.find(p => p.id === playerId);
        if (player && player.participation_id) {
            await supabase
                .from('match_participations')
                .update({ reponse: status, updated_at: new Date().toISOString() })
                .eq('id', player.participation_id);
        }
    } catch (err) {
        console.error("Erreur update presence", err);
    }
  };

  // --- LOGIQUE WHATSAPP AVEC LIEN RSVP ---
  const prepareWhatsapp = () => {
    if (!match) return;
    
    const dateStr = format(new Date(match.date_heure), 'dd/MM/yyyy', { locale: fr });
    const timeStr = format(new Date(match.date_heure), 'HH:mm');
    
    // Message de base (sans lien spécifique, car le lien est unique par joueur)
    const msg = `⚽ *CONVOCATION MATCH* ⚽\n\n` +
                `🆚 *Match :* ${match.equipes?.nom} vs ${match.adversaire}\n` +
                `📅 *Date :* ${dateStr}\n` +
                `🕒 *Heure :* ${timeStr}\n` +
                `📍 *Lieu :* ${match.lieu} (${match.lieu === 'Domicile' ? 'A la maison' : 'Extérieur'})\n\n` +
                `Tu as été sélectionné(e) pour ce match !`;

    setGeneratedMessage(msg);
    setShowWhatsappModal(true);
  };

  const copyToClipboard = () => {
    // Pour le groupe, on ne peut pas mettre de lien unique RSVP
    const groupMsg = generatedMessage + `\nMerci de confirmer ta présence en répondant à ce message. 💪`;
    navigator.clipboard.writeText(groupMsg);
    setModal({
        show: true,
        type: 'info',
        title: 'COPIÉ !',
        message: 'Le message pour le groupe est copié dans le presse-papier.'
    });
  };

  const sendIndividualMessage = (player: any) => {
    const phone = player.telephone ? player.telephone.replace(/\s/g, '').replace(/^0/, '33') : ''; 
    
    // --- GÉNÉRATION DU LIEN RSVP UNIQUE ---
    const origin = window.location.origin; 
    const rsvpLink = `${origin}/rsvp/${player.participation_id}`;
    
    const individualMsg = `${generatedMessage}\n\n👉 *CLIQUE ICI POUR CONFIRMER TA PRÉSENCE :*\n${rsvpLink}`;
    
    // Utilisation de api.whatsapp.com pour un meilleur support des émojis et liens
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(individualMsg)}`;
    window.open(url, '_blank');
  };

  // --- GESTION CLIC MODALE ---
  const handleModalClose = () => {
    setModal({ ...modal, show: false });
    if (modal.type === 'success') {
        router.push('/dashboard/matchs');
    }
  };

  // Calculs Compteurs
  const countPresent = players.filter(p => p.reponse === 'present').length;
  const countAbsent = players.filter(p => p.reponse === 'absent').length;
  const countAttente = players.filter(p => p.reponse === 'attente').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  const titulaires = players.filter(p => p.est_titulaire);
  const remplacants = players.filter(p => !p.est_titulaire);

  return (
    <div className="min-h-screen bg-[#f9fafb] p-4 md:p-8 font-sans text-[#1a1a1a] flex flex-col h-screen overflow-hidden">
      
      {/* --- MODALE WHATSAPP & GESTION PRÉSENCE --- */}
      {showWhatsappModal && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100">
               
               {/* Header Modale */}
               <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
                  <div>
                    <h3 className="text-xl font-black italic uppercase text-black">GESTION CONVOCATIONS</h3>
                    <p className="text-gray-400 text-xs font-bold uppercase">Envoi messages & Suivi présences</p>
                  </div>
                  <button onClick={() => setShowWhatsappModal(false)} className="p-2 hover:bg-white rounded-full transition-colors"><X size={20}/></button>
               </div>

               {/* Résumé Compteurs */}
               <div className="flex justify-around p-4 bg-white border-b border-gray-100 shadow-sm z-10">
                  <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-green-500">{countPresent}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-400">Présents</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-red-500">{countAbsent}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-400">Absents</span>
                  </div>
                  <div className="flex flex-col items-center">
                      <span className="text-xl font-black text-[#ff9d00]">{countAttente}</span>
                      <span className="text-[9px] font-bold uppercase text-gray-400">En attente</span>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-[#f9fafb]">
                  
                  {/* Option 1 : Message Groupe */}
                  <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between items-start mb-4">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                            <Share2 size={12}/> Message Groupe (Générique)
                        </label>
                        <button onClick={copyToClipboard} className="text-[#ff9d00] text-[10px] font-black uppercase flex items-center gap-2 hover:underline">
                           <Copy size={12}/> Copier le texte
                        </button>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs md:text-sm whitespace-pre-line text-gray-600 font-medium select-all">
                        {generatedMessage + `\nMerci de confirmer ta présence en répondant à ce message.`}
                     </div>
                  </div>

                  {/* Option 2 : Liste Individuelle + Actions */}
                  <div>
                     <h4 className="text-sm font-black italic uppercase mb-4 flex items-center gap-2 px-2">
                        <Users size={16} className="text-[#ff9d00]"/> Envoi Individuel & Suivi ({players.length})
                     </h4>
                     <div className="grid grid-cols-1 gap-3">
                        {players.map(p => (
                           <div 
                             key={p.id} 
                             className={`flex flex-col md:flex-row md:items-center justify-between p-3 bg-white border rounded-xl shadow-sm transition-all
                                ${p.reponse === 'present' ? 'border-green-200 bg-green-50/30' : 
                                  p.reponse === 'absent' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}
                             `}
                           >
                              {/* Info Joueur */}
                              <div className="flex items-center gap-3 mb-3 md:mb-0">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white ${p.est_titulaire ? 'bg-[#ff9d00]' : 'bg-gray-300'}`}>
                                    {p.nom.charAt(0)}
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase leading-none text-black">{p.prenom} {p.nom}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-gray-400 font-bold uppercase">{p.est_titulaire ? 'Titulaire' : 'Remplaçant'}</span>
                                        {/* Badge Statut */}
                                        {p.reponse === 'present' && <span className="text-[8px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded font-black uppercase">Présent</span>}
                                        {p.reponse === 'absent' && <span className="text-[8px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-black uppercase">Absent</span>}
                                    </div>
                                 </div>
                              </div>

                              {/* Actions Boutons */}
                              <div className="flex items-center gap-2 self-end md:self-auto">
                                  {/* Bouton Envoi Lien RSVP */}
                                  <button 
                                    onClick={() => sendIndividualMessage(p)}
                                    className="h-8 px-3 flex items-center gap-2 bg-black text-white rounded-lg hover:bg-[#25D366] transition-all mr-2 shadow-sm text-[9px] font-black uppercase"
                                    title="Envoyer convocation avec lien"
                                  >
                                     <MessageCircle size={14} /> Envoyer Lien
                                  </button>

                                  <div className="h-6 w-px bg-gray-200 mx-1"></div>

                                  {/* Boutons Manuels */}
                                  <button 
                                    onClick={() => updatePresence(p.id, 'present')}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all
                                        ${p.reponse === 'present' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-green-100 hover:text-green-600'}
                                    `}
                                  >
                                    <ThumbsUp size={12} />
                                  </button>

                                  <button 
                                    onClick={() => updatePresence(p.id, 'absent')}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all
                                        ${p.reponse === 'absent' ? 'bg-red-500 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-red-100 hover:text-red-600'}
                                    `}
                                  >
                                    <ThumbsDown size={12} />
                                  </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
               
               {/* Footer Modale */}
               <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-[2rem] flex justify-end">
                   <button 
                     onClick={() => { setShowWhatsappModal(false); handleSaveComposition(); }}
                     className="bg-black text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-all shadow-lg"
                   >
                     Fermer & Actualiser
                   </button>
               </div>
            </div>
         </div>
      )}

      {/* --- MODALE GESTEAM PRO LIGHT --- */}
      {modal.show && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
                modal.type === 'success' ? 'bg-[#ff9d00]/10 text-[#ff9d00]' : 
                modal.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'
            }`}>
              {modal.type === 'success' && <Check size={32} strokeWidth={3} />}
              {modal.type === 'error' && <AlertTriangle size={32} strokeWidth={3} />}
              {modal.type === 'info' && <Share2 size={32} strokeWidth={3} />}
            </div>
            
            <h3 className="text-xl font-black italic uppercase text-black mb-2 leading-none">{modal.title}</h3>
            <p className="text-gray-500 text-xs font-bold mb-8 uppercase tracking-wide leading-relaxed">{modal.message}</p>
            
            <button 
              onClick={handleModalClose}
              className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-colors shadow-lg active:scale-95 outline-none"
            >
              {modal.type === 'success' ? 'RETOUR AUX MATCHS' : "C'est noté"}
            </button>
          </div>
        </div>
      )}

      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-4">
           <Link href={`/dashboard/matchs/${params.id}/selection`} className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors">
             <ArrowLeft size={20} />
           </Link>
           <div>
              <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">TACTIQUE</h1>
              <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">
                 {match?.equipes?.nom} vs {match?.adversaire}
              </p>
           </div>
        </div>
        
        <div className="flex gap-2">
           <button 
             onClick={prepareWhatsapp}
             className="bg-green-500 text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-green-600 transition-all shadow-lg flex items-center gap-2"
           >
              <Share2 size={16}/> Convoquer
           </button>
           <button 
             onClick={handleSaveComposition}
             disabled={saving}
             className="bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] tracking-widest uppercase hover:bg-[#ff9d00] transition-all shadow-lg flex items-center gap-2"
           >
              {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>}
              Sauvegarder
           </button>
        </div>
      </div>

      {/* CONTENU PRINCIPAL */}
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        
        {/* --- ZONE TERRAIN (GAUCHE) --- */}
        <div className="flex-1 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col relative overflow-hidden">
           <div className="flex justify-between items-center mb-2 px-2">
              <span className="text-xs font-black uppercase text-gray-400">Terrain</span>
              <span className="text-xs font-black bg-[#ff9d00] text-white px-2 py-1 rounded">
                {titulaires.length} Titulaires
              </span>
           </div>

           {/* CONTENEUR DU TERRAIN */}
           <div className="flex-1 w-full max-w-[600px] mx-auto relative h-full"> 
               <div 
                 ref={fieldRef}
                 onDragOver={handleDragOver}
                 onDrop={handleDropOnField}
                 className="w-full h-full bg-green-500 rounded-xl relative border-4 border-white shadow-inner overflow-hidden select-none"
                 style={{ 
                   backgroundImage: `
                     repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.05) 10%, rgba(0,0,0,0.05) 20%),
                     radial-gradient(circle at 50% 50%, transparent 0, transparent 2px, rgba(255,255,255,0.3) 3px, transparent 4px)
                   `
                 }}
               >
                  {/* Lignes du terrain */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/60 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/60 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="absolute top-0 left-1/2 w-48 h-24 border-2 border-t-0 border-white/60 -translate-x-1/2 bg-white/5"></div>
                  <div className="absolute top-0 left-1/2 w-20 h-8 border-2 border-t-0 border-white/60 -translate-x-1/2 bg-white/10"></div>
                  
                  <div className="absolute bottom-0 left-1/2 w-48 h-24 border-2 border-b-0 border-white/60 -translate-x-1/2 bg-white/5"></div>
                  <div className="absolute bottom-0 left-1/2 w-20 h-8 border-2 border-b-0 border-white/60 -translate-x-1/2 bg-white/10"></div>

                  {/* JOUEURS SUR LE TERRAIN */}
                  {titulaires.map((player) => (
                    <div
                      key={player.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, player.id)}
                      className="absolute flex flex-col items-center justify-center w-24 cursor-move hover:scale-110 transition-transform z-10 active:cursor-grabbing"
                      style={{
                        left: `${player.x}%`,
                        top: `${player.y}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                       {/* PION AVEC COULEUR STATUT */}
                       <div className={`w-10 h-10 rounded-full border-2 border-black flex items-center justify-center shadow-lg font-black text-xs text-black mb-1
                          ${player.reponse === 'present' ? 'bg-green-100' : player.reponse === 'absent' ? 'bg-red-100' : 'bg-white'}
                       `}>
                          {player.nom.charAt(0)}{player.prenom?.charAt(0)}
                       </div>
                       
                       {/* ETIQUETTE NOM */}
                       <span className={`text-[9px] font-bold text-white px-2 py-1 rounded shadow-sm whitespace-nowrap uppercase backdrop-blur-sm
                          ${player.reponse === 'present' ? 'bg-green-600' : player.reponse === 'absent' ? 'bg-red-600' : 'bg-black/60'}
                       `}>
                          {player.prenom} {player.nom}
                       </span>
                    </div>
                  ))}
               </div>
           </div>
           
           <p className="text-center text-[9px] text-gray-300 mt-2 italic">
             Glissez les joueurs sur le terrain pour les titulariser.
           </p>
        </div>

        {/* --- ZONE BANC (DROITE) --- */}
        <div 
          className="w-full lg:w-80 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col"
          onDragOver={handleDragOver}
          onDrop={handleDropOnBench}
        >
           <div className="flex justify-between items-center mb-4 px-2">
              <span className="text-xs font-black uppercase text-gray-400">Remplaçants</span>
              <span className="text-xs font-black bg-gray-100 text-gray-500 px-2 py-1 rounded">
                {remplacants.length}
              </span>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              {remplacants.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                   <AlertCircle size={24} className="mb-2"/>
                   <p className="text-[10px] text-center">Tous les joueurs sont sur le terrain</p>
                </div>
              ) : (
                remplacants.map((player) => (
                  <div
                    key={player.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, player.id)}
                    className={`p-3 rounded-xl border shadow-sm flex items-center gap-3 cursor-grab active:cursor-grabbing transition-colors group
                       ${player.reponse === 'present' ? 'bg-green-50 border-green-200' : 
                         player.reponse === 'absent' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100 hover:border-[#ff9d00]'}
                    `}
                  >
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-colors
                        ${player.reponse === 'present' ? 'bg-green-500 text-white' : 
                          player.reponse === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-[#ff9d00] group-hover:text-white'}
                     `}>
                        {player.nom.charAt(0)}
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-black uppercase text-black leading-none mb-1">
                          {player.prenom} {player.nom}
                        </p>
                        <p className="text-[9px] text-gray-400 font-bold uppercase">
                          {player.poste || 'Joueur'}
                        </p>
                     </div>
                  </div>
                ))
              )}
           </div>
           
           <p className="text-center text-[9px] text-gray-300 mt-4 italic">
             Glissez ici pour retirer du terrain.
           </p>
        </div>

      </div>
    </div>
  );
}