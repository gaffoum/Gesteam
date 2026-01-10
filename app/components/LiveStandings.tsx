"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCw, Save, ExternalLink, AlertCircle } from 'lucide-react';

export default function LiveStandings({ equipeId }: { equipeId: string }) {
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [fffUrl, setFffUrl] = useState('');
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  // --- RECHARGEMENT AUTO AU CHANGEMENT D'ÉQUIPE ---
  useEffect(() => {
    if (equipeId) {
      loadTeamData();
    }
  }, [equipeId]);

  const loadTeamData = async () => {
    setLoading(true);
    setStandings([]); // Reset visuel
    setFffUrl('');
    setIsUrlSaved(false);

    try {
      // On récupère le lien ET les données stockées
      const { data, error } = await supabase
        .from('equipes')
        .select('lien_fff, classement_data')
        .eq('id', equipeId)
        .single();

      if (error) throw error;

      if (data) {
        // 1. AFFICHER LE LIEN
        if (data.lien_fff) {
            setFffUrl(data.lien_fff);
            setIsUrlSaved(true);
        }

        // 2. AFFICHER LES DONNÉES (Priorité absolue à la BDD pour la vitesse)
        if (data.classement_data && Array.isArray(data.classement_data) && data.classement_data.length > 0) {
            setStandings(data.classement_data);
        } 
        // 3. SINON, SI ON A UN LIEN MAIS PAS DE DONNÉES, ON SCRAPE AUTO
        else if (data.lien_fff) {
            await scrapeAndSave(data.lien_fff);
        }
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeAndSave = async (urlToScrape: string) => {
    if (!urlToScrape) return;
    setLoading(true);

    try {
      // 1. SCRAPING
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScrape }),
      });
      
      const json = await response.json();
      
      if (json.data && json.data.length > 0) {
        // 2. MISE À JOUR VISUELLE
        setStandings(json.data);
        setIsUrlSaved(true);

        // 3. SAUVEGARDE EN BASE (C'est ici que ça doit marcher)
        const { error } = await supabase
            .from('equipes')
            .update({ 
                lien_fff: urlToScrape,
                classement_data: json.data, // Stockage du JSON
                classement_updated_at: new Date().toISOString()
            })
            .eq('id', equipeId);

        if (error) {
            console.error("Erreur Sauvegarde BDD:", error);
            alert("Attention : Le classement s'affiche mais la sauvegarde a échoué. Vérifiez que la colonne 'classement_data' existe bien dans Supabase.");
        }
      } else {
        alert("Le lien fonctionne mais aucun tableau n'a été trouvé.");
      }
    } catch (err) {
      console.error("Erreur technique:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBtn = async () => {
      await scrapeAndSave(fffUrl);
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full min-h-[400px]">
      
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black uppercase italic text-sm flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#ff9d00]"></span> Classement Live
        </h3>
        {/* BOUTON REFRESH (Seulement si URL présente) */}
        {isUrlSaved && (
          <button 
            onClick={() => scrapeAndSave(fffUrl)} 
            disabled={loading} 
            title="Actualiser les données"
            className="text-gray-300 hover:text-[#ff9d00] transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
          </button>
        )}
      </div>

      {/* CONTENU */}
      {standings.length === 0 && !loading ? (
        // --- ÉTAT VIDE (FORMULAIRE) ---
        <div className="flex flex-col items-center justify-center h-full gap-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <AlertCircle className="text-gray-300" size={32} />
          <div className="text-center">
            <p className="text-xs font-black text-gray-400 uppercase">Aucun classement</p>
            <p className="text-[10px] text-gray-300">Entrez le lien FFF pour cette équipe</p>
          </div>
          
          <div className="w-full space-y-2">
            <input 
                type="url" 
                placeholder="https://epreuves.fff.fr/..."
                value={fffUrl}
                onChange={(e) => setFffUrl(e.target.value)}
                className="w-full bg-white p-3 rounded-lg text-xs font-bold border border-gray-100 outline-none focus:border-[#ff9d00]"
            />
            <button 
                onClick={handleSaveBtn}
                disabled={!fffUrl}
                className="w-full bg-black text-white py-3 rounded-lg text-[10px] font-black uppercase hover:bg-[#ff9d00] transition-colors flex justify-center gap-2 items-center"
            >
                <Save size={14}/> Enregistrer & Charger
            </button>
          </div>
        </div>
      ) : (
         // --- TABLEAU DES RÉSULTATS ---
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {loading && standings.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
               <Loader2 className="animate-spin" size={24}/>
               <span className="text-[10px] font-bold">Chargement...</span>
             </div>
           ) : (
             <table className="w-full text-left text-[10px] font-bold">
               <thead className="text-gray-400 border-b border-gray-100 sticky top-0 bg-white z-10">
                 <tr>
                   <th className="py-2 pl-2 w-6">#</th>
                   <th className="py-2 flex-1">ÉQUIPE</th>
                   <th className="py-2 text-center w-8 text-black">PTS</th>
                   <th className="py-2 text-center w-6">J</th>
                   <th className="py-2 text-center w-6 text-green-500/70">V</th>
                   <th className="py-2 text-center w-6 text-gray-400">N</th>
                   <th className="py-2 text-center w-6 text-red-400/70">D</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                 {standings.map((team: any, i) => (
                   <tr key={i} className={`hover:bg-gray-50 transition-colors ${i < 3 ? 'text-black' : 'text-gray-500'}`}>
                     <td className="py-3 pl-2">
                        <span className={`flex items-center justify-center w-5 h-5 rounded-full ${i===0 ? 'bg-[#ff9d00] text-white' : ''}`}>
                            {team.position || i + 1}
                        </span>
                     </td>
                     
                     <td className="py-3 pr-2">
                       <div className="uppercase truncate max-w-[110px]" title={team.nom || team.nom_equipe}>
                         {team.nom || team.nom_equipe}
                       </div>
                     </td>
                     
                     <td className="py-3 text-center font-black bg-gray-50/50 rounded-lg">{team.pts || team.points}</td>
                     <td className="py-3 text-center text-gray-400">{team.j || team.joues}</td>
                     <td className="py-3 text-center font-bold text-green-600">{team.g || team.gagnes}</td>
                     <td className="py-3 text-center text-gray-400">{team.n || team.nuls}</td>
                     <td className="py-3 text-center text-red-400">{team.p || team.perdus}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           )}
         </div>
      )}
      
      {/* FOOTER LIEN */}
      {isUrlSaved && fffUrl && !loading && (
        <a href={fffUrl} target="_blank" className="mt-4 text-[9px] font-bold text-center text-gray-300 hover:text-[#ff9d00] flex items-center justify-center gap-1 transition-colors">
          VOIR SUR FFF.FR <ExternalLink size={10}/>
        </a>
      )}
    </div>
  );
}