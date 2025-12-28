"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { 
  ChevronLeft, Users, Layout, FileText, MapPin, 
  CheckCircle2, Plus, X, Search, Loader2, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Match {
  id: string;
  date_match: string;
  adversaire: string;
  lieu: string;
  competition: string;
  score_final: string;
  equipe_concernee: string;
}

interface Joueur {
  id: string | number;
  nom: string;
  prenom: string;
  poste: string;
}

export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [match, setMatch] = useState<Match | null>(null);
  const [activeTab, setActiveTab] = useState('convocation');
  const [isLoading, setIsLoading] = useState(true);
  
  const [allJoueurs, setAllJoueurs] = useState<Joueur[]>([]);
  const [convoquesIds, setConvoquesIds] = useState<(string | number)[]>([]);
  const [isAddingJoueur, setIsAddingJoueur] = useState(false);

  useEffect(() => {
    if (params?.id) {
      fetchMatchDetails();
      fetchJoueursAndConvocations();
    }
  }, [params?.id]);

  const fetchMatchDetails = async () => {
    const { data } = await supabase.from('matchs').select('*').eq('id', params.id).single();
    if (data) setMatch(data);
  };

  const fetchJoueursAndConvocations = async () => {
    setIsLoading(true);
    // 1. Récupérer tous les joueurs
    const { data: joueurs, error: errJ } = await supabase.from('joueurs').select('id, nom, prenom, poste');
    // 2. Récupérer les convocations
    const { data: conv, error: errC } = await supabase.from('convocations').select('joueur_id').eq('match_id', params.id);
    
    if (joueurs) setAllJoueurs(joueurs);
    if (conv) {
      // On s'assure que les IDs sont comparables (string ou number)
      setConvoquesIds(conv.map(c => c.joueur_id));
    }
    setIsLoading(false);
  };

  const toggleConvocation = async (joueurId: string | number) => {
    // Vérification si déjà convoqué (comparaison souple)
    const isDejaconvoque = convoquesIds.some(id => String(id) === String(joueurId));

    if (isDejaconvoque) {
      const { error } = await supabase.from('convocations')
        .delete()
        .eq('match_id', params.id)
        .eq('joueur_id', joueurId);
      
      if (!error) {
        setConvoquesIds(prev => prev.filter(id => String(id) !== String(joueurId)));
      }
    } else {
      const { error } = await supabase.from('convocations')
        .insert([{ match_id: params.id, joueur_id: joueurId }]);
      
      if (!error) {
        setConvoquesIds(prev => [...prev, joueurId]);
      } else {
        console.error("Erreur insertion:", error.message);
        alert("Erreur lors de la convocation. Vérifiez les types d'ID dans votre table.");
      }
    }
  };

  if (isLoading && !match) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-[60vh] font-black uppercase italic animate-pulse text-gray-300">
        Chargement du match...
      </div>
    </DashboardLayout>
  );

  if (!match) return <DashboardLayout><div className="p-20 text-center">Match introuvable.</div></DashboardLayout>;

  const joueursConvoques = allJoueurs.filter(j => convoquesIds.some(id => String(id) === String(j.id)));

  return (
    <DashboardLayout>
      <div className="italic pb-20">
        <button onClick={() => router.push('/calendrier')} className="flex items-center gap-2 text-gray-400 hover:text-[#ff9d00] mb-8 font-black uppercase text-[10px] not-italic">
          <ChevronLeft size={16} /> Retour au calendrier
        </button>

        {/* HEADER MATCH */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#ff9d00] text-white px-3 py-1 rounded-full text-[9px] font-black uppercase not-italic">{match.competition}</span>
              <span className="text-gray-400 text-[10px] font-bold uppercase not-italic flex items-center gap-1"><MapPin size={12} /> {match.lieu}</span>
            </div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">VS <span className="text-[#ff9d00]">{match.adversaire}</span></h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em]">{match.equipe_concernee} — {new Date(match.date_match).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <div className="bg-[#1a1a1a] text-white px-10 py-6 rounded-[2rem] shadow-2xl text-center">
            <p className="text-[10px] text-gray-400 uppercase font-black mb-1 not-italic opacity-50">Score Final</p>
            <span className="text-4xl font-black italic tracking-widest">{match.score_final}</span>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-8 bg-white p-2 rounded-3xl shadow-sm inline-flex not-italic border border-gray-100">
          {[
            { id: 'convocation', label: 'Convocation', icon: Users },
            { id: 'tactique', label: 'Tactique', icon: Layout },
            { id: 'resume', label: 'Résumé', icon: FileText },
          ].map((t) => (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)} 
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black uppercase text-[10px] transition-all ${activeTab === t.id ? 'bg-[#1a1a1a] text-white shadow-xl' : 'text-gray-400 hover:bg-gray-50'}`}
            >
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        {/* LISTE DES CONVOQUÉS */}
        <div className="bg-white rounded-[3rem] p-10 shadow-xl min-h-[500px] border border-gray-100">
          {activeTab === 'convocation' && (
            <div className="not-italic">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Le groupe <span className="text-[#ff9d00]">retenu</span> ({joueursConvoques.length})</h3>
                <button 
                  onClick={() => setIsAddingJoueur(true)}
                  className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff9d00] transition-all shadow-xl"
                >
                  <Plus size={16} /> Convoquer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joueursConvoques.length > 0 ? (
                  joueursConvoques.map((joueur) => (
                    <div key={joueur.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border-2 border-transparent hover:border-[#ff9d00] transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1a1a1a] text-white rounded-2xl flex items-center justify-center font-black text-xs italic group-hover:bg-[#ff9d00] transition-colors">
                          {joueur.nom[0]}{joueur.prenom[0]}
                        </div>
                        <div>
                          <p className="font-black uppercase text-sm leading-none">{joueur.nom} {joueur.prenom}</p>
                          <p className="text-[9px] text-[#ff9d00] font-black uppercase mt-1 italic tracking-widest">{joueur.poste}</p>
                        </div>
                      </div>
                      <button onClick={() => toggleConvocation(joueur.id)} className="text-gray-200 hover:text-red-500 transition-colors p-2"><X size={20} /></button>
                    </div>
                  ))
                ) : (
                  <div className="p-20 border-4 border-dashed border-gray-50 rounded-[3rem] text-center col-span-full">
                    <Users size={48} className="mx-auto text-gray-100 mb-4" />
                    <p className="text-gray-300 font-black uppercase italic text-xs tracking-[0.2em]">Aucun joueur sélectionné</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODALE DE SÉLECTION (CORRIGÉE) */}
      {isAddingJoueur && (
        <div className="fixed inset-0 bg-[#1a1a1a]/95 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
            <button onClick={() => setIsAddingJoueur(false)} className="absolute top-8 right-8 text-gray-300 hover:text-[#1a1a1a]"><X size={32} /></button>
            
            <h2 className="text-4xl font-black uppercase italic mb-8 tracking-tighter">Sélectionner <span className="text-[#ff9d00]">Athlètes</span></h2>
            
            <div className="overflow-y-auto pr-2 space-y-3 flex-1 scrollbar-hide">
              {allJoueurs.map((joueur) => {
                const selected = convoquesIds.some(id => String(id) === String(joueur.id));
                return (
                  <div 
                    key={joueur.id}
                    onClick={() => toggleConvocation(joueur.id)}
                    className={`flex items-center justify-between p-6 rounded-[1.5rem] cursor-pointer transition-all border-2 ${selected ? 'bg-orange-50 border-[#ff9d00]' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${selected ? 'bg-[#ff9d00] text-white' : 'bg-gray-200 text-gray-400'}`}>
                        {joueur.nom[0]}
                      </div>
                      <span className={`font-black uppercase text-sm italic ${selected ? 'text-[#1a1a1a]' : 'text-gray-400'}`}>{joueur.prenom} {joueur.nom}</span>
                    </div>
                    {selected ? <CheckCircle2 className="text-[#ff9d00]" size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-gray-100" />}
                  </div>
                );
              })}
            </div>
            
            <button onClick={() => setIsAddingJoueur(false)} className="mt-8 bg-[#1a1a1a] text-white w-full py-6 rounded-2xl font-black uppercase italic tracking-widest hover:bg-[#ff9d00] transition-all shadow-xl">
              Confirmer la liste
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}