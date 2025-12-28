"use client";

import React, { useState } from 'react';
import { Users, Save, ShieldCheck, ChevronRight, Info } from 'lucide-react';

// Liste des catégories demandées
const categories = [
  { id: 'u7', label: 'U6 - U7', group: 'Animation' },
  { id: 'u9', label: 'U8 - U9', group: 'Animation' },
  { id: 'u11', label: 'U10 - U11', group: 'Animation' },
  { id: 'u13', label: 'U12 - U13', group: 'Pré-formation' },
  { id: 'u15', label: 'U14 - U15', group: 'Pré-formation' },
  { id: 'u17', label: 'U16 - U17', group: 'Formation' },
  { id: 'u19', label: 'U18 - U19', group: 'Formation' },
  { id: 'seniors', label: 'Seniors', group: 'Adultes' },
  { id: 'veterans', label: 'Vétérans', group: 'Adultes' },
];

export default function EquipesPage() {
  const [selectedCoach, setSelectedCoach] = useState('1');
  const [assignments, setAssignments] = useState<Record<string, string[]>>({
    '1': ['u13', 'u15'], // Exemple : Coach 1 gère U13 et U15
  });

  const toggleCategory = (categoryId: string) => {
    const currentMatches = assignments[selectedCoach] || [];
    const newMatches = currentMatches.includes(categoryId)
      ? currentMatches.filter(id => id !== categoryId)
      : [...currentMatches, categoryId];
    
    setAssignments({ ...assignments, [selectedCoach]: newMatches });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-[#1a1a1a]">
            Assignation <span className="text-[#ff9d00]">des Équipes</span>
          </h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Attribuer une ou plusieurs catégories à un entraîneur
          </p>
        </div>
        
        <button className="bg-[#ff9d00] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2">
          <Save size={16} strokeWidth={3} /> Enregistrer les affectations
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLONNE GAUCHE : LISTE DES ENTRAINEURS */}
        <div className="space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest px-2">Sélectionner l'Entraîneur</h3>
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {[
              { id: '1', name: 'Jean-Marc Pivot', teams: 2 },
              { id: '2', name: 'Sarah Benali', teams: 1 },
              { id: '3', name: 'Thomas Muller', teams: 0 },
            ].map((coach) => (
              <button
                key={coach.id}
                onClick={() => setSelectedCoach(coach.id)}
                className={`w-full flex items-center justify-between p-4 border-b border-gray-50 last:border-0 transition-all ${
                  selectedCoach === coach.id ? 'bg-orange-50 border-l-4 border-l-[#ff9d00]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#ff9d00] font-black border border-gray-200">
                    {coach.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black uppercase italic">{coach.name}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">{assignments[coach.id]?.length || 0} équipe(s)</p>
                  </div>
                </div>
                <ChevronRight size={16} className={selectedCoach === coach.id ? 'text-[#ff9d00]' : 'text-gray-300'} />
              </button>
            ))}
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
            <Info className="text-blue-500 shrink-0" size={18} />
            <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed">
              Un entraîneur peut être affecté à plusieurs catégories simultanément pour mutualiser les ressources.
            </p>
          </div>
        </div>

        {/* COLONNE DROITE : GRILLE DES CATÉGORIES */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest px-2">Catégories d'équipes internes</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat) => {
              const isActive = (assignments[selectedCoach] || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`
                    p-5 rounded-2xl border-2 transition-all flex items-center justify-between group
                    ${isActive 
                      ? 'border-[#ff9d00] bg-white shadow-md' 
                      : 'border-gray-100 bg-white hover:border-gray-200'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                      ${isActive ? 'bg-[#ff9d00] text-white' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}
                    `}>
                      <ShieldCheck size={20} />
                    </div>
                    <div className="text-left">
                      <p className={`text-sm font-black uppercase ${isActive ? 'text-[#1a1a1a]' : 'text-gray-500'}`}>
                        {cat.label}
                      </p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{cat.group}</p>
                    </div>
                  </div>
                  
                  <div className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                    ${isActive ? 'bg-[#ff9d00] border-[#ff9d00]' : 'border-gray-200'}
                  `}>
                    {isActive && <div className="w-2 h-2 bg-white rounded-full shadow-sm" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}