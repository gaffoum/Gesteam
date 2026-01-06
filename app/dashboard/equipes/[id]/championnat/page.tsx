"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { logActivity } from '@/lib/logger';
import { 
  Loader2, Save, ArrowLeft, Globe, 
  Trophy, Trash2, ExternalLink,
  Link as LinkIcon, Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function ChampionshipConfigPage() {
  const { id: equipeId } = useParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [equipe, setEquipe] = useState<any>(null);
  const [adversaires, setAdversaires] = useState<any[]>([]);
  
  // États pour l'import
  const [fffUrl, setFffUrl] = useState("");
  const [parsedTeams, setParsedTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, [equipeId]);

  const fetchData = async () => {
    try {
      const { data: eqData } = await supabase.from('equipes').select('*').eq('id', equipeId).single();
      setEquipe(eqData);

      const { data: advData } = await supabase
        .from('adversaires')
        .select('*')
        .eq('mon_equipe_id', equipeId)
        .order('nom', { ascending: true });

      if (advData) setAdversaires(advData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIQUE DE SCRAPPING AUTOMATIQUE (CORRIGÉE) ---
  const handleAutoScrape = async () => {
    if (!fffUrl) return;
    setAnalyzing(true);
    setParsedTeams([]); // Reset

    try {
      // Appel à notre API interne
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: fffUrl }),
      });

      const jsonResponse = await response.json();

      if (!response.ok) throw new Error(jsonResponse.error || "Erreur inconnue");

      // CORRECTION ICI : On lit 'data' et on extrait 'nom_equipe'
      if (jsonResponse.data && jsonResponse.data.length > 0) {
        // On extrait juste les noms pour cette page d'import simple
        const teamNames = jsonResponse.data.map((item: any) => item.nom_equipe);
        // On dédoublonne au cas où
        const uniqueNames = Array.from(new Set(teamNames)) as string[];
        
        setParsedTeams(uniqueNames);
      } else {
        alert("Aucune équipe trouvée. Vérifiez que le lien pointe bien vers un CLASSEMENT ou un CALENDRIER FFF.");
      }

    } catch (error) {
      console.error("Erreur scrape:", error);
      alert("Impossible de récupérer les équipes. Le site FFF est peut-être protégé ou le lien est invalide.");
    } finally {
      setAnalyzing(false);
    }
  };

  const removeParsedTeam = (index: number) => {
    setParsedTeams(prev => prev.filter((_, i) => i !== index));
  };

  // --- SAUVEGARDE EN BASE ---
  const handleSaveImport = async () => {
    if (parsedTeams.length === 0) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const toInsert = parsedTeams.map(name => ({
        club_id: equipe.club_id,
        mon_equipe_id: equipeId,
        nom: name.toUpperCase(),
        lien_fff: fffUrl || null
      }));

      const { error } = await supabase.from('adversaires').insert(toInsert);

      if (error) throw error;

      // On sauvegarde aussi le lien FFF dans l'équipe pour plus tard
      if (fffUrl) {
        await supabase.from('equipes').update({ lien_fff: fffUrl }).eq('id', equipeId);
      }

      await logActivity(supabase, equipe.club_id, user!.id, 'EQUIPE', `Import auto de ${parsedTeams.length} adversaires pour ${equipe.categorie}`);

      setFffUrl("");
      setParsedTeams([]);
      fetchData();
      alert(`${parsedTeams.length} équipes ajoutées !`);

    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAdversaire = async (id: string) => {
    if (!confirm("Supprimer cet adversaire ?")) return;
    await supabase.from('adversaires').delete().eq('id', id);
    fetchData();
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#ff9d00]"/></div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans italic text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard/equipes" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00]"><ArrowLeft size={20}/></Link>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">CONFIGURATION <span className="text-[#ff9d00]">POULE</span></h1>
            <p className="text-sm font-bold text-gray-400 not-italic">
              Championnat pour {equipe?.categorie} - {equipe?.nom}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* ZONE D'IMPORT (GAUCHE) */}
          <div className="space-y-6">
            
            {/* ETAPE 1 : BOUTON FFF SIMPLE */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase flex items-center gap-2">
                  <Globe size={16} className="text-[#ff9d00]"/> 1. Trouver la poule
                </h3>
                <p className="text-[10px] text-gray-400 font-bold mt-1 not-italic">Ouvrir le site officiel</p>
              </div>
              <a href="https://epreuves.fff.fr/" target="_blank" rel="noopener noreferrer" 
                 className="bg-black text-white px-4 py-3 rounded-xl hover:bg-[#ff9d00] transition-colors text-[10px] font-black uppercase flex items-center gap-2">
                SITE FFF <ExternalLink size={12}/>
              </a>
            </div>

            {/* ETAPE 2 : URL + SCRAPE */}
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
              <h3 className="text-lg font-black uppercase mb-4 flex items-center gap-2">
                <LinkIcon size={18} className="text-[#ff9d00]"/> 2. Import Automatique
              </h3>
              <p className="text-xs text-gray-400 font-bold mb-4 not-italic">
                Copiez l'URL de la page du classement/calendrier et collez-la ici.
              </p>
              
              <div className="space-y-3">
                <input 
                  type="url"
                  className="w-full bg-gray-50 p-4 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-[#ff9d00]"
                  placeholder="https://epreuves.fff.fr/competitions/..."
                  value={fffUrl}
                  onChange={(e) => setFffUrl(e.target.value)}
                />

                <button 
                  onClick={handleAutoScrape}
                  disabled={!fffUrl || analyzing}
                  className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {analyzing ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                  {analyzing ? "ANALYSE DU SITE..." : "RÉCUPÉRER LES ÉQUIPES"}
                </button>
              </div>
            </div>

            {/* ETAPE 3 : VALIDER */}
            {parsedTeams.length > 0 && (
              <div className="bg-[#fff4e0] p-8 rounded-[2rem] border border-[#ff9d00]/20 animate-in slide-in-from-top-4">
                <h3 className="text-lg font-black uppercase mb-4 text-[#ff9d00]">
                  {parsedTeams.length} Équipes détectées
                </h3>
                <div className="space-y-2 mb-6 max-h-48 overflow-y-auto pr-2">
                  {parsedTeams.map((team, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#ff9d00]/10 shadow-sm">
                      <span className="text-xs font-bold uppercase">{team}</span>
                      <button onClick={() => removeParsedTeam(idx)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={handleSaveImport}
                  disabled={saving}
                  className="w-full bg-[#ff9d00] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex justify-center gap-2 shadow-lg active:scale-95"
                >
                  {saving ? <Loader2 className="animate-spin"/> : <Save size={16}/>} CONFIRMER L'IMPORT
                </button>
              </div>
            )}
          </div>

          {/* LISTE DES ADVERSAIRES ACTUELS (DROITE) */}
          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-fit">
            <h3 className="text-xl font-black uppercase mb-6 flex items-center gap-2">
              <Trophy size={20} className="text-[#ff9d00]"/> POULE ACTUELLE
            </h3>

            {adversaires.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-300 font-black text-xs">AUCUNE ÉQUIPE</p>
                <p className="text-gray-300 text-[10px] not-italic mt-1">Collez le lien FFF à gauche pour commencer.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {adversaires.map((adv) => (
                  <div key={adv.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-black shrink-0">
                         {adv.nom.substring(0,2)}
                       </div>
                       <span className="font-bold text-xs uppercase">{adv.nom}</span>
                    </div>
                    <button 
                      onClick={() => handleDeleteAdversaire(adv.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}