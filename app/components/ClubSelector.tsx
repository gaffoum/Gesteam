"use client";
import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Search, Loader2, MapPin } from 'lucide-react';

interface Club {
  id: string;
  nom: string;
  ville: string;
  cp: string;
}

interface ClubSelectorProps {
  onSelect: (club: Club) => void;
  defaultValue?: string;
}

export default function ClubSelector({ onSelect, defaultValue }: ClubSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [clubsList, setClubsList] = useState<Club[]>([]);
  const [loading, setLoading] = useState(false);

  // Charge le fichier JSON uniquement au premier clic
  const loadClubs = async () => {
    if (clubsList.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/clubs_fff.json');
      const data = await res.json();
      // Tri par nom pour être propre
      setClubsList(data.sort((a: Club, b: Club) => a.nom.localeCompare(b.nom)));
    } catch (e) {
      console.error("Erreur chargement clubs", e);
    } finally {
      setLoading(false);
    }
  };

  const filteredClubs = useMemo(() => {
    if (!search) return clubsList.slice(0, 10); // Affiche 10 par défaut

    // Recherche insensible à la casse et aux accents
    const term = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return clubsList.filter(c => {
      const nom = c.nom?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      const ville = c.ville?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") || "";
      return nom.includes(term) || ville.includes(term);
    }).slice(0, 50); // Limite à 50 résultats
  }, [search, clubsList]);

  return (
    <div className="relative font-sans not-italic">
      <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest italic">
        Club Officiel
      </label>
      
      {/* Bouton déclencheur */}
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open) loadClubs(); }}
        className="w-full p-4 flex items-center justify-between bg-white border border-gray-100 rounded-2xl text-sm font-bold text-left hover:border-[#ff9d00] transition-all shadow-sm"
      >
        <span className={selectedClub ? "text-[#1a1a1a]" : "text-gray-400"}>
          {selectedClub ? selectedClub.nom : (defaultValue || "Rechercher votre club...")}
        </span>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Liste déroulante */}
      {open && (
        <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Champ de recherche interne */}
          <div className="p-3 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50">
             <Search size={16} className="text-[#ff9d00]" />
             <input
               autoFocus
               className="w-full bg-transparent outline-none text-sm font-bold text-[#1a1a1a] placeholder:font-normal placeholder:text-gray-400"
               placeholder="Tapez le nom ou la ville..."
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>

          <div className="max-h-60 overflow-y-auto p-1">
            {loading ? (
              <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-[#ff9d00]" />
                <span className="text-[10px] font-black uppercase tracking-widest">Chargement de la base FFF...</span>
              </div>
            ) : filteredClubs.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-bold">Aucun club trouvé</div>
            ) : (
              filteredClubs.map((club) => (
                <div
                  key={club.id}
                  onClick={() => {
                    setSelectedClub(club);
                    onSelect(club);
                    setOpen(false);
                  }}
                  className="p-3 rounded-xl hover:bg-[#1a1a1a] hover:text-white cursor-pointer flex justify-between items-center group transition-colors mb-1"
                >
                  <div>
                    <div className="text-xs font-black uppercase tracking-tight">{club.nom}</div>
                    <div className="text-[9px] font-bold text-gray-400 group-hover:text-white/60 flex items-center gap-1 mt-0.5">
                      <MapPin size={8} /> {club.ville} ({club.cp})
                    </div>
                  </div>
                  {selectedClub?.id === club.id && <Check size={14} className="text-[#ff9d00]" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}