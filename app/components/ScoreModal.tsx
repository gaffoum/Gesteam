"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Save, Trophy, Loader2 } from 'lucide-react';

interface ScoreModalProps {
  match: any;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export default function ScoreModal({ match, isOpen, onClose, onUpdate }: ScoreModalProps) {
  const [loading, setLoading] = useState(false);
  const [scoreHome, setScoreHome] = useState(match?.score_home || 0);
  const [scoreAway, setScoreAway] = useState(match?.score_away || 0);

  // Mise à jour si on change de match
  React.useEffect(() => {
    if (match) {
        setScoreHome(match.score_home || 0);
        setScoreAway(match.score_away || 0);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const handleValidate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('matchs')
        .update({
          score_home: scoreHome,
          score_away: scoreAway,
          statut: 'termine'
        })
        .eq('id', match.id);

      if (error) throw error;
      onUpdate(); // C'est ici que la magie opère pour rafraîchir le calendrier !
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erreur validation score.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-black">
          <X size={20}/>
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#ff9d00]/10 text-[#ff9d00] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trophy size={32} />
          </div>
          <h3 className="text-2xl font-black uppercase italic tracking-tighter">Saisir le Score</h3>
        </div>

        <div className="flex items-center justify-center gap-6 mb-10">
           <div className="flex flex-col items-center gap-2">
             <span className="text-[10px] font-black uppercase text-gray-400 max-w-[80px] truncate">{match.equipes?.nom || 'NOUS'}</span>
             <input type="number" min="0" value={scoreHome} onChange={(e) => setScoreHome(parseInt(e.target.value) || 0)} className="w-20 h-20 bg-gray-50 rounded-2xl text-center text-3xl font-black outline-none focus:ring-2 focus:ring-[#ff9d00]" />
           </div>
           <span className="text-2xl font-black text-gray-300">-</span>
           <div className="flex flex-col items-center gap-2">
             <span className="text-[10px] font-black uppercase text-gray-400 max-w-[80px] truncate">{match.adversaire}</span>
             <input type="number" min="0" value={scoreAway} onChange={(e) => setScoreAway(parseInt(e.target.value) || 0)} className="w-20 h-20 bg-gray-50 rounded-2xl text-center text-3xl font-black outline-none focus:ring-2 focus:ring-[#ff9d00]" />
           </div>
        </div>

        <button onClick={handleValidate} disabled={loading} className="w-full bg-black text-white py-5 rounded-xl font-black text-xs tracking-[0.2em] uppercase hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-2 shadow-xl">
          {loading ? <Loader2 className="animate-spin"/> : <Save size={18}/>}
          {loading ? 'Validation...' : 'VALIDER'}
        </button>
      </div>
    </div>
  );
}