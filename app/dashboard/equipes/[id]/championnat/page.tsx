"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, ExternalLink, Wand2, Trash2, Loader2, Save, Trophy,
  Check, AlertTriangle, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ConfigurationPoulePage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // --- ÉTATS ---
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [teamInfo, setTeamInfo] = useState<any>(null);
  
  // detectedTeams stocke maintenant des OBJETS { nom, pts, j, g, n, p... }
  const [detectedTeams, setDetectedTeams] = useState<any[]>([]);
  const [currentTeams, setCurrentTeams] = useState<any[]>([]);
  
  const [modal, setModal] = useState<{ 
    show: boolean; type: 'success' | 'error'; title: string; message: string 
  }>({
    show: false, type: 'success', title: '', message: ''
  });

  // --- CHARGEMENT INFO ÉQUIPE ---
  useEffect(() => {
    const fetchTeamInfo = async () => {
        const { data } = await supabase.from('equipes').select('nom, categorie').eq('id', params.id).single();
        setTeamInfo(data);
    };
    fetchTeamInfo();
  }, [params.id]);

  // --- APPEL API SCRAPING ---
  const handleFetchTeams = async () => {
    if (!url) {
        setModal({ show: true, type: 'error', title: 'URL MANQUANTE', message: 'Veuillez coller un lien valide.' });
        return;
    }

    setLoading(true);
    setDetectedTeams([]); 

    try {
        const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await response.json();

        if (response.ok && result.data) {
            setDetectedTeams(result.data); // On reçoit le tableau d'objets complets
            if (result.data.length === 0) {
                 setModal({ show: true, type: 'error', title: 'ZÉRO RÉSULTAT', message: "Le lien est valide mais aucune équipe n'a été trouvée." });
            }
        } else {
            throw new Error(result.error || "Erreur inconnue");
        }

    } catch (err: any) {
        console.error(err);
        setModal({ show: true, type: 'error', title: 'ERREUR', message: err.message || "Impossible de lire la page FFF." });
    } finally {
        setLoading(false);
    }
  };

  // --- CONFIRMATION IMPORT ---
  const handleConfirmImport = async () => {
    if (detectedTeams.length === 0) return;
    setLoading(true);
    
    // Simulation Sauvegarde (Adaptez ici avec votre logique Supabase pour insérer les stats)
    setTimeout(() => {
        setLoading(false);
        // On transfère les équipes détectées vers la "Poule Actuelle"
        setCurrentTeams(prev => [...prev, ...detectedTeams]);
        setDetectedTeams([]);
        setUrl(""); 
        setModal({ show: true, type: 'success', title: 'IMPORT RÉUSSI', message: `${detectedTeams.length} équipes ajoutées avec leurs statistiques !` });
    }, 1000);
  };

  const removeDetectedTeam = (index: number) => {
    const newT = [...detectedTeams]; newT.splice(index, 1); setDetectedTeams(newT);
  };
  const removeCurrentTeam = (index: number) => {
    const newT = [...currentTeams]; newT.splice(index, 1); setCurrentTeams(newT);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      {/* MODALE */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-gray-100">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-[#ff9d00]/10 text-[#ff9d00]' : 'bg-red-50 text-red-500'}`}>
              {modal.type === 'success' ? <Check size={32} strokeWidth={3} /> : <AlertTriangle size={32} strokeWidth={3} />}
            </div>
            <h3 className="text-xl font-black italic uppercase text-black mb-2">{modal.title}</h3>
            <p className="text-gray-500 text-xs font-bold mb-8 uppercase">{modal.message}</p>
            <button onClick={() => setModal({ ...modal, show: false })} className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00]">OK, Compris</button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <button onClick={() => window.history.back()} className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00]"><ArrowLeft size={20} /></button>
            <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">CONFIGURATION POULE</h1>
                <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">
                    {teamInfo ? <>Championnat pour {teamInfo.nom} • {teamInfo.categorie}</> : "Chargement..."}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GAUCHE : OUTILS */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black italic uppercase mb-4 text-[#ff9d00]">1. Import Automatique</h3>
                    <div className="flex flex-col gap-3">
                        <div className="relative">
                            <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Lien Classement FFF..." className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-4 text-sm font-bold outline-none focus:border-[#ff9d00]" />
                        </div>
                        <button onClick={handleFetchTeams} disabled={loading} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] flex items-center justify-center gap-2">
                            {loading ? <Loader2 className="animate-spin" size={16}/> : <Wand2 size={16}/>} Analyser le classement
                        </button>
                    </div>
                </div>

                {/* RÉSULTATS SCRAPING (AFFICHAGE COMPLET) */}
                {detectedTeams.length > 0 && (
                    <div className="bg-[#fff4e0] p-6 rounded-[2rem] border border-[#ff9d00]/20 animate-in slide-in-from-bottom-4">
                        <h3 className="text-[#ff9d00] font-black italic uppercase text-lg mb-6">{detectedTeams.length} Équipes Trouvées</h3>
                        
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6 max-h-96 overflow-y-auto custom-scrollbar">
                            {/* En-tête du tableau */}
                            <div className="grid grid-cols-12 gap-2 p-3 bg-gray-50 text-[9px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                <div className="col-span-1 text-center">#</div>
                                <div className="col-span-6">Équipe</div>
                                <div className="col-span-1 text-center">Pts</div>
                                <div className="col-span-1 text-center">J</div>
                                <div className="col-span-1 text-center">G</div>
                                <div className="col-span-1 text-center">N</div>
                                <div className="col-span-1 text-center">P</div>
                            </div>

                            {detectedTeams.map((team, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 text-xs">
                                    <div className="col-span-1 text-center font-black text-gray-300">{index + 1}</div>
                                    <div className="col-span-6 font-bold truncate pr-2">{team.nom}</div>
                                    <div className="col-span-1 text-center font-black">{team.pts}</div>
                                    <div className="col-span-1 text-center text-gray-400">{team.j}</div>
                                    <div className="col-span-1 text-center text-green-500 font-bold">{team.g}</div>
                                    <div className="col-span-1 text-center text-gray-400">{team.n}</div>
                                    <div className="col-span-1 text-center text-red-400">{team.p}</div>
                                    {/* Bouton de suppression caché, visible au survol si besoin */}
                                </div>
                            ))}
                        </div>
                        
                        <button onClick={handleConfirmImport} className="w-full bg-black text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] flex items-center justify-center gap-2">
                           <Save size={16}/> Valider l'import
                        </button>
                    </div>
                )}
            </div>

            {/* DROITE : POULE ACTUELLE */}
            <div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 h-full min-h-[400px]">
                    <h3 className="text-lg font-black italic uppercase flex items-center gap-2 mb-8"><Trophy className="text-[#ff9d00]" size={20}/> Poule Actuelle</h3>
                    
                    {currentTeams.length === 0 ? (
                        <div className="h-64 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-6">
                            <span className="text-gray-300 text-4xl font-black italic opacity-20 mb-2">VIDE</span>
                            <p className="text-gray-400 text-xs font-bold uppercase">Aucune équipe configurée</p>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-in fade-in">
                            {currentTeams.map((team, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-[#ff9d00] shadow-sm">{index + 1}</div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase text-gray-800">{team.nom}</span>
                                            <div className="flex gap-2 text-[9px] font-bold text-gray-400 mt-0.5">
                                                <span>{team.pts} pts</span>
                                                <span>{team.g}V - {team.n}N - {team.p}D</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button onClick={() => removeCurrentTeam(index)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}