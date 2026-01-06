"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, RefreshCw, Link as LinkIcon, AlertCircle, Save } from 'lucide-react';

export default function LiveStandings({ equipeId }: { equipeId: string }) {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [standings, setStandings] = useState<any[]>([]);
  const [fffUrl, setFffUrl] = useState<string>("");
  const [isUrlSaved, setIsUrlSaved] = useState(false);

  useEffect(() => {
    fetchData();
  }, [equipeId]);

  const fetchData = async () => {
    setLoading(true);
    // 1. Récupérer URL
    const { data: eq } = await supabase.from('equipes').select('lien_fff').eq('id', equipeId).single();
    if (eq?.lien_fff) {
      setFffUrl(eq.lien_fff);
      setIsUrlSaved(true);
    }

    // 2. Récupérer Classement
    const { data: list } = await supabase
      .from('classements')
      .select('*')
      .eq('equipe_id', equipeId)
      .order('position', { ascending: true });
    
    if (list) setStandings(list);
    setLoading(false);
  };

  const handleRefresh = async () => {
    if (!fffUrl) return;
    setRefreshing(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fffUrl })
      });
      const { data, error } = await res.json();
      
      if (error || !data || data.length === 0) throw new Error("Erreur lecture classement");

      if (!isUrlSaved) {
        await supabase.from('equipes').update({ lien_fff: fffUrl }).eq('id', equipeId);
        setIsUrlSaved(true);
      }

      await supabase.from('classements').delete().eq('equipe_id', equipeId);
      const toInsert = data.map((row: any) => ({ equipe_id: equipeId, ...row }));
      await supabase.from('classements').insert(toInsert);

      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erreur mise à jour. Vérifiez le lien.");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm h-full flex flex-col">
      {/* EN-TÊTE COMPACT */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
        <h3 className="font-black uppercase italic text-lg flex items-center gap-2">
          <span className="bg-[#ff9d00] text-white p-1.5 rounded-lg"><LinkIcon size={12}/></span>
          CLASSEMENT
        </h3>
        
        <div className="flex w-full sm:w-auto gap-2">
          {!isUrlSaved ? (
             <div className="flex flex-1 gap-2">
               <input 
                 type="url" 
                 placeholder="Lien FFF..." 
                 className="bg-gray-50 px-3 py-2 rounded-xl text-[10px] font-bold outline-none w-full"
                 value={fffUrl}
                 onChange={(e) => setFffUrl(e.target.value)}
               />
               <button onClick={handleRefresh} disabled={refreshing || !fffUrl} className="bg-black text-white p-2 rounded-xl hover:bg-[#ff9d00] transition-colors">
                 {refreshing ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>}
               </button>
             </div>
          ) : (
             <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-1 bg-gray-50 text-gray-500 px-3 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all">
               {refreshing ? <Loader2 className="animate-spin" size={12}/> : <RefreshCw size={12}/>}
               MAJ
             </button>
          )}
        </div>
      </div>

      {/* TABLEAU FORMATÉ (Nom | xPts | xV | xD) */}
      {loading ? (
        <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-[#ff9d00]"/></div>
      ) : standings.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-[10px] text-gray-400 font-bold uppercase">Aucun classement</p>
        </div>
      ) : (
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs uppercase whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-400 border-b border-gray-100 text-[10px]">
              <tr>
                <th className="p-2 pl-3">Équipe</th>
                <th className="p-2 text-center text-black font-black">PTS</th>
                <th className="p-2 text-center text-green-500">V</th>
                <th className="p-2 text-center text-red-500">D</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[11px] font-bold">
              {standings.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                  {/* NOM */}
                  <td className="p-2 pl-3 flex items-center gap-2">
                    <span className={`w-5 h-5 flex items-center justify-center rounded-md text-[9px] font-black shrink-0
                      ${row.position <= 3 ? 'bg-[#ff9d00] text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {row.position}
                    </span>
                    <span className="truncate max-w-[120px] md:max-w-[150px]" title={row.nom_equipe}>
                      {row.nom_equipe}
                    </span>
                  </td>
                  
                  {/* POINTS (Format xPts) */}
                  <td className="p-2 text-center font-black text-black">
                    {row.points} <span className="text-[9px] text-gray-400 font-normal">Pts</span>
                  </td>
                  
                  {/* VICTOIRES (Format xV) */}
                  <td className="p-2 text-center text-green-600">
                    {row.gagnes} <span className="text-[9px] text-green-400/70 font-normal">V</span>
                  </td>
                  
                  {/* DÉFAITES (Format xD) */}
                  <td className="p-2 text-center text-red-600">
                    {row.perdus} <span className="text-[9px] text-red-400/70 font-normal">D</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}