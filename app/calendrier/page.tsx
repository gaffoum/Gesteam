"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, RefreshCw, Link as LinkIcon, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ClassementSection({ teamId }: { teamId: string }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Données
  const [url, setUrl] = useState("");
  const [rankingData, setRankingData] = useState<any[]>([]); // Le tableau du classement
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // 1. CHARGEMENT INITIAL (Lecture BDD uniquement)
  useEffect(() => {
    fetchSavedRanking();
  }, [teamId]);

  const fetchSavedRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('equipes')
        .select('classement_url, classement_data, classement_updated_at')
        .eq('id', teamId)
        .single();

      if (error) throw error;

      if (data) {
        setUrl(data.classement_url || "");
        setRankingData(data.classement_data || []); // On charge le cache s'il existe
        setLastUpdate(data.classement_updated_at);
      }
    } catch (err) {
      console.error("Erreur chargement classement:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. FONCTION DE MISE À JOUR (Scraping + Sauvegarde BDD)
  const handleUpdateFromLink = async () => {
    if (!url) return alert("Veuillez entrer une URL valide.");
    
    setUpdating(true);
    try {
      // A. SAUVEGARDE DE L'URL D'ABORD
      await supabase.from('equipes').update({ classement_url: url }).eq('id', teamId);

      // B. SIMULATION DU SCRAPING (ICI VOUS METTEZ VOTRE LOGIQUE DE RÉCUPÉRATION)
      // Remplacez ce bloc par votre appel API réel qui récupère le classement via l'URL
      // const response = await fetch('/api/get-ranking', { method: 'POST', body: JSON.stringify({ url }) });
      // const newData = await response.json();

      // --- Simulation pour l'exemple ---
      const simulatedData = [
        { position: 1, equipe: "FC Gesteam", pts: 42, j: 18, diff: 25 },
        { position: 2, equipe: "Olympique Rival", pts: 38, j: 18, diff: 12 },
        { position: 3, equipe: "US Voisins", pts: 35, j: 17, diff: 8 },
        // ...
      ];
      // -------------------------------

      // C. SAUVEGARDE DES DONNÉES EN BASE (PERSISTANCE)
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('equipes')
        .update({ 
          classement_data: simulatedData, // On stocke le JSON complet
          classement_updated_at: now
        })
        .eq('id', teamId);

      if (error) throw error;

      // Mise à jour locale
      setRankingData(simulatedData);
      setLastUpdate(now);
      alert("Classement mis à jour et sauvegardé !");

    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="p-4"><Loader2 className="animate-spin text-[#ff9d00]" /></div>;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
      
      {/* HEADER AVEC URL ET ACTION */}
      <div className="flex flex-col md:flex-row items-end md:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
        <div className="flex-1 w-full">
            <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1 flex items-center gap-2">
                <LinkIcon size={12}/> Lien du classement (FFF, District...)
            </label>
            <div className="flex gap-2">
                <input 
                    type="url" 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:border-[#ff9d00]"
                />
                {url && (
                    <a href={url} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 rounded-xl text-gray-500 hover:bg-gray-200">
                        <ExternalLink size={20}/>
                    </a>
                )}
            </div>
        </div>
        
        <button 
            onClick={handleUpdateFromLink} 
            disabled={updating}
            className="px-6 py-2.5 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50"
        >
            {updating ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
            {rankingData.length > 0 ? "Mettre à jour" : "Charger"}
        </button>
      </div>

      {/* TABLEAU DE RÉSULTATS (PERSISTANT) */}
      {rankingData.length > 0 ? (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black italic text-xl uppercase">Classement Actuel</h3>
                {lastUpdate && (
                    <span className="text-xs font-bold text-gray-400">
                        MAJ : {format(new Date(lastUpdate), "dd MMM à HH:mm", { locale: fr })}
                    </span>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-[10px] uppercase bg-gray-50 text-gray-500 font-black">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Pos</th>
                            <th className="px-4 py-3">Équipe</th>
                            <th className="px-4 py-3 text-center">Pts</th>
                            <th className="px-4 py-3 text-center">J</th>
                            <th className="px-4 py-3 text-center rounded-r-lg">Diff</th>
                        </tr>
                    </thead>
                    <tbody className="font-bold text-gray-700">
                        {rankingData.map((row: any, i: number) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${i === 0 ? 'bg-[#ff9d00] text-white' : 'bg-gray-200'}`}>
                                        {row.position}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{row.equipe}</td>
                                <td className="px-4 py-3 text-center font-black">{row.pts}</td>
                                <td className="px-4 py-3 text-center text-gray-400">{row.j}</td>
                                <td className="px-4 py-3 text-center text-gray-400">{row.diff}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <AlertCircle className="mx-auto text-gray-300 mb-2" size={32} />
            <p className="text-gray-400 font-bold text-sm">Aucun classement sauvegardé.</p>
            <p className="text-gray-400 text-xs">Entrez le lien ci-dessus et cliquez sur "Charger".</p>
        </div>
      )}
    </div>
  );
}