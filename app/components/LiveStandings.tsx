"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCw, Save, ExternalLink } from 'lucide-react';

export default function LiveStandings({ equipeId }: { equipeId: string }) {
  const [loading, setLoading] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [fffUrl, setFffUrl] = useState('');
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  useEffect(() => {
    if (equipeId) fetchSavedUrlAndScrape();
  }, [equipeId]);

  const fetchSavedUrlAndScrape = async () => {
    setLoading(true);
    setStandings([]); 
    try {
      const { data } = await supabase
        .from('equipes')
        .select('lien_fff')
        .eq('id', equipeId)
        .single();

      if (data?.lien_fff) {
        setFffUrl(data.lien_fff);
        setIsUrlSaved(true);
        await scrapeData(data.lien_fff);
      } else {
        setFffUrl('');
        setIsUrlSaved(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const scrapeData = async (url: string) => {
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json = await response.json();
      if (json.data) {
        setStandings(json.data);
      }
    } catch (err) {
      console.error("Erreur scrape:", err);
    }
  };

  const handleSaveUrl = async () => {
    if (!fffUrl) return;
    setLoading(true);
    try {
      await supabase.from('equipes').update({ lien_fff: fffUrl }).eq('id', equipeId);
      setIsUrlSaved(true);
      await scrapeData(fffUrl);
    } catch (error) {
      alert("Erreur sauvegarde URL");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col h-full min-h-[300px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black uppercase italic text-sm flex items-center gap-2">
           <span className="w-2 h-2 rounded-full bg-[#ff9d00]"></span> Classement Live
        </h3>
        {isUrlSaved && (
          <button onClick={() => scrapeData(fffUrl)} disabled={loading} className="text-gray-300 hover:text-[#ff9d00] transition-colors">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>
          </button>
        )}
      </div>

      {!isUrlSaved ? (
        <div className="flex flex-col gap-3 mb-4 p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Aucun lien FFF associé.</p>
          <input 
            type="url" 
            placeholder="Collez le lien FFF..."
            value={fffUrl}
            onChange={(e) => setFffUrl(e.target.value)}
            className="bg-white p-3 rounded-lg text-xs font-bold border border-gray-100 outline-none focus:border-[#ff9d00]"
          />
          <button 
            onClick={handleSaveUrl}
            disabled={loading || !fffUrl}
            className="bg-black text-white py-3 rounded-lg text-[10px] font-black uppercase hover:bg-[#ff9d00] transition-colors flex justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>}
            Sauvegarder
          </button>
        </div>
      ) : (
         <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
           {loading && standings.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2">
               <Loader2 className="animate-spin" size={24}/>
             </div>
           ) : standings.length > 0 ? (
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
                     <td className={`py-3 pl-2 font-black ${i===0 ? 'text-[#ff9d00]' : ''}`}>{team.position}</td>
                     
                     <td className="py-3 pr-2">
                       <div className="uppercase truncate max-w-[110px]" title={team.nom_equipe}>
                         {team.nom_equipe}
                       </div>
                     </td>
                     
                     <td className="py-3 text-center font-black bg-gray-50/50 rounded-lg">{team.points}</td>
                     <td className="py-3 text-center text-gray-400">{team.joues}</td>
                     <td className="py-3 text-center font-bold text-green-600">{team.gagnes}</td>
                     <td className="py-3 text-center text-gray-400">{team.nuls}</td>
                     <td className="py-3 text-center text-red-400">{team.perdus}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           ) : (
             <div className="text-center py-10 text-gray-300">
               <p className="text-[10px]">Impossible de lire le classement.</p>
               <button onClick={() => setIsUrlSaved(false)} className="text-[9px] underline hover:text-red-500 mt-2">Modifier le lien</button>
             </div>
           )}
         </div>
      )}
      
      {isUrlSaved && (
        <a href={fffUrl} target="_blank" className="mt-4 text-[9px] font-bold text-center text-gray-300 hover:text-[#ff9d00] flex items-center justify-center gap-1">
          VOIR SUR FFF.FR <ExternalLink size={10}/>
        </a>
      )}
    </div>
  );
}