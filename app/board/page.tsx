"use client";
import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Save, Trash2, Users, ChevronDown, Layout, X, Loader2, Camera, RefreshCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import html2canvas from 'html2canvas';

interface PlayerPos {
  id: string | number;
  nom: string;
  x: number;
  y: number;
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-black uppercase italic">Chargement du terrain...</div>}>
      <BoardContent />
    </Suspense>
  );
}

function BoardContent() {
  const searchParams = useSearchParams();
  const matchIdFromUrl = searchParams.get('matchId');
  const terrainRef = useRef<HTMLDivElement>(null);

  const [matchs, setMatchs] = useState<any[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matchIdFromUrl || "");
  const [convoques, setConvoques] = useState<any[]>([]);
  const [positions, setPositions] = useState<PlayerPos[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedMatchId) {
      fetchMatchTactique(selectedMatchId);
      fetchConvoques(selectedMatchId);
    }
  }, [selectedMatchId]);

  const fetchInitialData = async () => {
    const { data } = await supabase.from('matchs').select('*').order('date_match', { ascending: true });
    if (data) setMatchs(data);
  };

  const fetchConvoques = async (mId: string) => {
    const { data } = await supabase
      .from('convocations')
      .select('joueur_id, joueurs(id, nom, prenom, poste)')
      .eq('match_id', mId);
    if (data) setConvoques(data.map((c: any) => c.joueurs).filter(j => j !== null));
  };

  const fetchMatchTactique = async (mId: string) => {
    const { data } = await supabase.from('tactiques').select('*').eq('match_id', mId).single();
    if (data && data.layout_json) setPositions(data.layout_json);
    else setPositions([]);
  };

  const saveTactique = async () => {
    if (!selectedMatchId) return alert("Sélectionnez un match.");
    setIsSaving(true);
    const { error } = await supabase.from('tactiques').upsert({
      match_id: selectedMatchId,
      layout_json: positions,
      updated_at: new Date()
    }, { onConflict: 'match_id' });

    if (error) alert("Erreur : " + error.message);
    else alert("✅ Tactique validée !");
    setIsSaving(false);
  };

  const handleReset = () => {
    if (positions.length === 0) return;
    if (window.confirm("Voulez-vous vraiment vider le terrain ?")) {
      setPositions([]);
    }
  };

  const exportAsImage = async () => {
    if (!terrainRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(terrainRef.current, {
        backgroundColor: '#1a1a1a',
        scale: 2,
        useCORS: true,
        logging: false
      });
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      const matchName = matchs.find(m => m.id === selectedMatchId)?.adversaire || "tactique";
      link.href = image;
      link.download = `Compo-vs-${matchName}.png`;
      link.click();
    } catch (err) {
      console.error("Erreur export:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerData = JSON.parse(e.dataTransfer.getData("player"));
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPos: PlayerPos = { 
      id: playerData.id, 
      nom: `${playerData.prenom[0]}. ${playerData.nom.toUpperCase()}`, 
      x, y 
    };

    setPositions(prev => {
      const existing = prev.find(p => String(p.id) === String(playerData.id));
      if (existing) return prev.map(p => String(p.id) === String(playerData.id) ? newPos : p);
      return [...prev, newPos];
    });
  };

  return (
    <DashboardLayout>
      <div className="italic">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#1a1a1a]">Match <span className="text-[#ff9d00]">Board</span></h1>
            <div className="mt-2 relative not-italic">
              <select 
                value={selectedMatchId}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="bg-white border-2 border-gray-100 p-4 pr-12 rounded-2xl font-black text-[10px] uppercase appearance-none outline-none focus:border-[#ff9d00] transition-all shadow-sm"
              >
                <option value="">Sélectionner un match</option>
                {matchs.map(m => (
                  <option key={m.id} value={m.id}>VS {m.adversaire} — {new Date(m.date_match).toLocaleDateString()}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={handleReset}
              title="Vider le terrain"
              className="bg-white border-2 border-gray-100 text-red-500 p-5 rounded-2xl hover:bg-red-50 transition-all shadow-sm disabled:opacity-30"
              disabled={positions.length === 0}
            >
              <RefreshCcw size={16} />
            </button>
            <button 
              onClick={exportAsImage}
              disabled={isExporting || !selectedMatchId}
              className="bg-white border-2 border-gray-100 text-[#1a1a1a] px-6 py-5 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-30"
            >
              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} className="text-[#ff9d00]" />} 
              Exporter
            </button>
            <button 
              onClick={saveTactique}
              disabled={isSaving || !selectedMatchId}
              className="bg-[#1a1a1a] text-white px-8 py-5 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff9d00] transition-all shadow-xl disabled:opacity-30"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Valider
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 h-[75vh] not-italic">
          {/* LISTE DES CONVOQUÉS */}
          <div className="w-full lg:w-72 bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col">
            <h3 className="font-black uppercase italic text-xs mb-6 flex items-center gap-2">
              <Users size={18} className="text-[#ff9d00]" /> Groupe retenu
            </h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2">
              {convoques.map(joueur => (
                <div 
                  key={joueur.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("player", JSON.stringify(joueur))}
                  className="p-4 bg-gray-50 rounded-2xl font-black uppercase text-[10px] cursor-grab active:cursor-grabbing hover:bg-orange-50 hover:text-[#ff9d00] transition-all border-2 border-transparent hover:border-[#ff9d00]"
                >
                  {joueur.nom}
                </div>
              ))}
            </div>
          </div>

          {/* TERRAIN */}
          <div 
            ref={terrainRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex-1 bg-[#1a1a1a] rounded-[3rem] relative overflow-hidden shadow-2xl border-[12px] border-[#252525]"
          >
            {/* TRACÉS DU TERRAIN */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-white -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-32 border-2 border-white border-t-0" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white border-t-0" />
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-2 bg-white rounded-b-md" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 border-2 border-white border-b-0" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-12 border-2 border-white border-b-0" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-2 bg-white rounded-t-md" />
            </div>

            {/* Joueurs placés */}
            {positions.map(p => (
              <div 
                key={p.id}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group z-20"
              >
                <div className="w-12 h-12 bg-[#ff9d00] rounded-full flex items-center justify-center text-[#1a1a1a] font-black shadow-2xl border-4 border-white cursor-move">
                  {p.nom.substring(0, 1)}
                </div>
                <div className="mt-2 bg-[#1a1a1a]/90 backdrop-blur-sm text-white text-[8px] px-3 py-1 rounded-lg font-black uppercase whitespace-nowrap border border-white/10 shadow-xl text-center">
                  {p.nom}
                </div>
                <button 
                  onClick={() => setPositions(prev => prev.filter(pos => pos.id !== p.id))}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            
            <div className="absolute bottom-8 right-8 opacity-10 font-black text-4xl text-white select-none italic">
              SKRINERLAB
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}