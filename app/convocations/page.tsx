"use client";
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { motion } from 'framer-motion';
import { Users, RotateCcw, MessageCircle, Send, Camera } from 'lucide-react';
import html2canvas from 'html2canvas';

interface PlayerPos {
  id: number; 
  nom: string; 
  prenom: string; 
  poste: string;
  x: number; 
  y: number; 
  isBench: boolean;
}

export default function ConvocationsPage() {
  const [convoques, setConvoques] = useState<PlayerPos[]>([]);
  const terrainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('derniere_convocation');
    if (saved) {
      const parsed = JSON.parse(saved);
      // On initialise tous les joueurs sur le banc par défaut
      setConvoques(parsed.map((p: any) => ({ ...p, x: 0, y: 0, isBench: true })));
    }
  }, []);

  // FONCTION DE FORMATAGE : P. NOM
  const formatNomTactique = (prenom: string, nom: string) => {
    if (!prenom || !nom) return "";
    const initiale = prenom.charAt(0).toUpperCase();
    return `${initiale}. ${nom.toUpperCase()}`;
  };

  const exportAsImage = async () => {
    if (terrainRef.current) {
      const canvas = await html2canvas(terrainRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = `tactique-match-${new Date().toLocaleDateString()}.png`;
      link.click();
    }
  };

  const handleReset = () => setConvoques(convoques.map(p => ({ ...p, isBench: true })));

  return (
    <DashboardLayout>
      <div className="italic h-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">Match <span className="text-[#ff9d00]">Board</span></h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em]">Composition Tactique</p>
          </div>
          <div className="flex gap-3">
            <button onClick={exportAsImage} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">
              <Camera size={16} className="text-[#ff9d00]" /> Capturer
            </button>
            <button onClick={handleReset} className="bg-white border-2 border-gray-100 p-4 rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase hover:bg-gray-50 transition-all shadow-sm">
              <RotateCcw size={16} /> Reset
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-[800px]">
          {/* TERRAIN AVEC MARQUAGES PROFESSIONNELS */}
          <div 
            ref={terrainRef}
            className="flex-[2] bg-[#1a1a1a] rounded-[3rem] relative overflow-hidden shadow-2xl border-8 border-[#252525] p-12"
          >
            {/* Tracés du terrain */}
            <div className="absolute inset-8 border-2 border-white/20 rounded-sm">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white/20 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 w-48 h-48 border-2 border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2" />
              
              {/* Surfaces de réparation */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 border-2 border-white/20 border-t-0" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-40 border-2 border-white/20 border-b-0" />
              
              {/* Buts */}
              <div className="absolute -top-[4px] left-1/2 -translate-x-1/2 w-24 h-1 bg-white border-x-4 border-b-2" />
              <div className="absolute -bottom-[4px] left-1/2 -translate-x-1/2 w-24 h-1 bg-white border-x-4 border-t-2" />
            </div>

            {/* Joueurs Titulaires (Drag & Drop) */}
            {convoques.filter(p => !p.isBench).map((p) => (
              <motion.div
                key={p.id}
                drag
                dragMomentum={false}
                className="absolute z-20 cursor-grab active:cursor-grabbing text-center"
                style={{ left: '46%', top: '45%' }}
              >
                {/* Pion Orange */}
                <div className="w-14 h-14 bg-[#ff9d00] rounded-full border-4 border-white shadow-lg flex items-center justify-center font-black text-xs text-[#1a1a1a] mb-1">
                  {p.nom[0]}
                </div>
                {/* ÉTIQUETTE NOM : P. NOM */}
                <div className="bg-[#1a1a1a]/90 backdrop-blur-md px-3 py-1 rounded-md text-[9px] font-black text-white uppercase border border-white/20 shadow-xl whitespace-nowrap">
                  {formatNomTactique(p.prenom, p.nom)}
                </div>
              </motion.div>
            ))}

            <div className="absolute bottom-12 right-12 opacity-5 font-black text-6xl text-white select-none italic">
              SKRINERLAB
            </div>
          </div>

          {/* SIDEBAR : LISTE DES CONVOQUÉS (REMPLAÇANTS) */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex-1 flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#ff9d00] rounded-xl flex items-center justify-center text-[#1a1a1a] shadow-lg shadow-[#ff9d00]/20">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-black uppercase italic">Le <span className="text-[#ff9d00]">Groupe</span></h2>
              </div>

              <div className="space-y-3 overflow-y-auto flex-1 pr-2 max-h-[550px]">
                {convoques.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-[#ff9d00] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#1a1a1a] text-white rounded-lg flex items-center justify-center text-[10px] font-black italic">{p.nom[0]}</div>
                      <div>
                        <p className="text-[11px] font-black uppercase italic text-[#1a1a1a] leading-none">{p.prenom} {p.nom}</p>
                        <p className="text-[8px] font-bold text-[#ff9d00] mt-1 uppercase italic">{p.poste}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setConvoques(convoques.map(player => player.id === p.id ? { ...player, isBench: !player.isBench } : player))}
                      className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase italic transition-all ${p.isBench ? 'bg-gray-200 text-gray-400 hover:bg-[#ff9d00] hover:text-white' : 'bg-[#ff9d00] text-white'}`}
                    >
                      {p.isBench ? "Titulariser" : "Banc"}
                    </button>
                  </div>
                ))}
                {convoques.length === 0 && (
                  <div className="text-center py-10 text-gray-300 font-bold uppercase text-[10px] italic">
                    Aucun joueur sélectionné
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 p-4 bg-[#25D366] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-transform">
                  <MessageCircle size={16} /> WhatsApp
                </button>
                <button className="flex items-center justify-center gap-2 p-4 bg-[#0088cc] text-white rounded-2xl font-black text-[10px] uppercase shadow-xl hover:scale-105 transition-transform">
                  <Send size={16} /> Telegram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}