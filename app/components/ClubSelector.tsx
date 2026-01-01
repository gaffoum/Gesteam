"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, ChevronDown, Loader2 } from 'lucide-react';

export default function ClubSelector({ onSelect }: { onSelect: (club: any) => void }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClubs, setFilteredClubs] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fonction de recherche côté serveur
  const searchClubs = async (term: string) => {
    if (term.length < 2) {
      setFilteredClubs([]);
      return;
    }

    setLoading(true);
    // On recherche dans le nom officiel, le nom court ET la ville
    const { data, error } = await supabase
      .from('clubs')
      .select('id, name, nom_usage, ville')
      .or(`name.ilike.%${term}%,nom_usage.ilike.%${term}%,ville.ilike.%${term}%`)
      .limit(30); // On limite à 30 pour l'affichage

    if (error) {
      console.error("Erreur de recherche:", error.message);
    } else {
      setFilteredClubs(data || []);
    }
    setLoading(false);
  };

  // Déclenche la recherche quand on tape (avec un petit délai pour ne pas saturer)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (isOpen) searchClubs(searchTerm);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, isOpen]);

  return (
    <div className="relative w-full italic font-black uppercase" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-100 p-6 rounded-3xl shadow-sm flex items-center justify-between hover:border-[#ff9d00]/30 transition-all"
      >
        {selectedClub ? (
          <div className="text-left">
            <span className="block text-black text-sm">{selectedClub.nom_usage || selectedClub.name}</span>
            <span className="text-gray-400 text-[10px] font-bold not-italic">{selectedClub.ville}</span>
          </div>
        ) : (
          <span className="text-gray-300 text-sm italic">RECHERCHER VOTRE VILLE OU CLUB...</span>
        )}
        <ChevronDown size={20} className={`text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-3 bg-white rounded-[2rem] shadow-2xl border border-gray-50 overflow-hidden animate-in fade-in zoom-in duration-200">
          <div className="p-4 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                autoFocus
                className="w-full p-4 pl-12 rounded-2xl bg-white border-none outline-none text-[10px] font-black italic shadow-inner"
                placeholder="TAPEZ LE NOM DE VOTRE VILLE "
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-[#ff9d00]" size={32} /></div>
            ) : filteredClubs.length > 0 ? (
              filteredClubs.map((club) => (
                <button
                  key={club.id}
                  type="button"
                  onClick={() => {
                    setSelectedClub(club);
                    setIsOpen(false);
                    onSelect(club);
                  }}
                  className="w-full text-left p-5 hover:bg-gray-50 flex flex-col border-b border-gray-50 last:border-none group transition-colors"
                >
                  <span className="text-black text-sm font-black group-hover:text-[#ff9d00]">
                    {club.nom_usage || club.name}
                  </span>
                  <span className="text-gray-400 text-[10px] font-bold not-italic lowercase tracking-widest mt-1">
                    {club.ville}
                  </span>
                </button>
              ))
            ) : (
              <div className="p-10 text-center text-gray-300 text-[10px]">
                {searchTerm.length < 2 ? "TAPEZ AU MOINS 2 CARACTÈRES" : "AUCUN CLUB TROUVÉ"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}