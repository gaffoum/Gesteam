"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { logActivity } from '@/lib/logger';
import { Loader2, Save, ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function ConvocationPage() {
  const { id: matchId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [match, setMatch] = useState<any>(null);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [selectedJoueurs, setSelectedJoueurs] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [matchId]);

  const fetchData = async () => {
    try {
      // 1. Infos du match
      const { data: matchData } = await supabase.from('matchs').select('*, equipes(*)').eq('id', matchId).single();
      
      if (matchData) {
        setMatch(matchData);
        
        // 2. Joueurs du club
        const { data: joueursData } = await supabase
          .from('joueurs')
          .select('*')
          .eq('club_id', matchData.club_id)
          .order('nom', { ascending: true });
          
        if (joueursData) setJoueurs(joueursData);

        // 3. Convocations existantes
        const { data: convocData } = await supabase
          .from('convocations')
          .select('joueur_id')
          .eq('match_id', matchId)
          .eq('present', true); // On regarde seulement ceux qui sont marqués présents

        if (convocData) {
          setSelectedJoueurs(convocData.map(c => c.joueur_id));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleJoueur = (joueurId: string) => {
    setSelectedJoueurs(prev => 
      prev.includes(joueurId) ? prev.filter(id => id !== joueurId) : [...prev, joueurId]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Suppression des anciennes convocations pour ce match
      await supabase.from('convocations').delete().eq('match_id', matchId);

      // 2. Insertion des nouvelles (Selon votre schéma : present = true)
      if (selectedJoueurs.length > 0) {
        const toInsert = selectedJoueurs.map(jid => ({
          match_id: matchId,
          joueur_id: jid,
          present: true // Booléen
        }));
        
        await supabase.from('convocations').insert(toInsert);
      }

      // 3. Historique
      const { data: { user } } = await supabase.auth.getUser();
      if (user && match) {
        await logActivity(supabase, match.club_id, user.id, 'CONVOCATION', `Mise à jour convocation (${selectedJoueurs.length} joueurs) vs ${match.adversaire}`);
      }

      alert("Convocation enregistrée !");
      router.push('/dashboard/matchs');
      
    } catch (error) {
      console.error(error);
      alert("Erreur sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#ff9d00]"/></div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans italic text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00]"><ArrowLeft size={20}/></Link>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Convocations</h1>
              <p className="text-sm font-bold text-gray-400 not-italic">
                {match?.equipes?.nom} vs <span className="text-[#ff9d00]">{match?.adversaire}</span>
              </p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-black text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2">
            {saving ? <Loader2 className="animate-spin"/> : <Save size={18}/>} VALIDER ({selectedJoueurs.length})
          </button>
        </div>

        {/* LISTE DES JOUEURS A COCHER */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {joueurs.map((joueur) => {
            const isSelected = selectedJoueurs.includes(joueur.id);
            return (
              <div 
                key={joueur.id} 
                onClick={() => toggleJoueur(joueur.id)}
                className={`
                  p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group
                  ${isSelected ? 'bg-[#ff9d00] border-[#ff9d00] text-white shadow-lg' : 'bg-white border-gray-100 hover:border-gray-200'}
                `}
              >
                <div>
                  <p className="font-black uppercase text-sm">{joueur.nom} {joueur.prenom}</p>
                  <p className={`text-[10px] font-bold not-italic ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                    {joueur.poste || 'Poste non défini'}
                  </p>
                </div>
                <div>
                  {isSelected 
                    ? <CheckCircle2 size={24} className="text-white" /> 
                    : <Circle size={24} className="text-gray-200 group-hover:text-gray-300" />
                  }
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}