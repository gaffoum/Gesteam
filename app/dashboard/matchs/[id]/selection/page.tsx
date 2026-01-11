"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Users, 
  ChevronRight, 
  Loader2,
  Search,
  UserCheck,
  Shield
} from 'lucide-react';
import Link from 'next/link';

// Ordre d'affichage souhaité des postes
const POSTE_ORDER = ['GARDIEN', 'DÉFENSEUR', 'MILIEU', 'ATTAQUANT'];

export default function MatchSelectionPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // --- ÉTATS ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [match, setMatch] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- CHARGEMENT ---
  useEffect(() => {
    fetchData();
  }, [params.id]);

  const fetchData = async () => {
    try {
      // 1. Infos du Match
      const { data: matchData, error: matchError } = await supabase
        .from('matchs')
        .select('*, equipes(nom, categorie)')
        .eq('id', params.id)
        .single();

      if (matchError) throw matchError;
      setMatch(matchData);

      // 2. Joueurs de l'équipe
      const { data: playersData, error: playersError } = await supabase
        .from('joueurs')
        .select('*')
        .eq('equipe_id', matchData.equipe_id)
        .order('nom', { ascending: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // 3. Récupérer sélection existante (si on revient éditer)
      const { data: existingParts } = await supabase
        .from('match_participations')
        .select('joueur_id')
        .eq('match_id', params.id);

      if (existingParts && existingParts.length > 0) {
        setSelectedPlayers(existingParts.map(p => p.joueur_id));
      }

    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTION SÉLECTION ---
  const togglePlayer = (id: string) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(prev => prev.filter(pId => pId !== id));
    } else {
      setSelectedPlayers(prev => [...prev, id]);
    }
  };

  const toggleAll = () => {
    // Si tout le monde est sélectionné, on vide. Sinon on remplit tout.
    // On se base sur les joueurs affichés (filtrés) pour le "Tout sélectionner"
    const visibleIds = filteredPlayers.map(p => p.id);
    const allSelected = visibleIds.every(id => selectedPlayers.includes(id));

    if (allSelected) {
        // On retire ceux qui sont visibles
        setSelectedPlayers(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
        // On ajoute ceux qui manquent
        const newSelection = new Set([...selectedPlayers, ...visibleIds]);
        setSelectedPlayers(Array.from(newSelection));
    }
  };

  // --- VALIDATION ---
  const handleValidate = async () => {
    if (selectedPlayers.length === 0) return;
    setSubmitting(true);

    try {
      // Nettoyage préalable
      await supabase.from('match_participations').delete().eq('match_id', params.id);

      // Insertion
      const records = selectedPlayers.map(playerId => ({
        match_id: params.id,
        joueur_id: playerId,
        est_titulaire: false, // Sera défini à l'étape suivante
        position_x: null,
        position_y: null
      }));

      const { error } = await supabase.from('match_participations').insert(records);
      if (error) throw error;

      router.push(`/dashboard/matchs/${params.id}/tactique`);

    } catch (err) {
      console.error("Erreur sauvegarde:", err);
      alert("Erreur lors de la validation.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- FILTRAGE & REGROUPEMENT ---
  
  // 1. Filtre recherche
  const filteredPlayers = players.filter(p => 
    `${p.nom} ${p.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. Groupement par Poste
  const groupedPlayers = filteredPlayers.reduce((groups: any, player) => {
    // Normalisation du poste (ex: "Gardien de but" -> "GARDIEN")
    let posteKey = (player.poste || "AUTRES").toUpperCase().trim();
    
    // Petite normalisation pour grouper les variantes (optionnel)
    if (posteKey.includes("GARDIEN")) posteKey = "GARDIEN";
    else if (posteKey.includes("DÉFENSEUR") || posteKey.includes("DEFENSEUR")) posteKey = "DÉFENSEUR";
    else if (posteKey.includes("MILIEU")) posteKey = "MILIEU";
    else if (posteKey.includes("ATTAQUANT")) posteKey = "ATTAQUANT";
    else posteKey = "AUTRES";

    if (!groups[posteKey]) groups[posteKey] = [];
    groups[posteKey].push(player);
    return groups;
  }, {});

  // 3. Tri des clés de groupe selon l'ordre défini
  const sortedGroupKeys = Object.keys(groupedPlayers).sort((a, b) => {
    const indexA = POSTE_ORDER.indexOf(a);
    const indexB = POSTE_ORDER.indexOf(b);
    // Si les deux sont dans la liste, on trie selon l'ordre
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    // Si l'un est dans la liste, il passe devant
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    // Sinon alphabétique
    return a.localeCompare(b);
  });


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
             <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors">
               <ArrowLeft size={20} />
             </Link>
             <div>
                <h1 className="text-3xl font-black italic uppercase tracking-tighter">CONVOCATION</h1>
                <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                   Étape 2/3 : Sélectionner l'effectif
                </p>
             </div>
          </div>
          
          <div className="bg-white px-5 py-3 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
             <div className="text-right">
                <span className="block text-[10px] font-black text-gray-400 uppercase">Sélectionnés</span>
                <span className="block text-xl font-black italic text-[#ff9d00] leading-none">{selectedPlayers.length}</span>
             </div>
             <UserCheck size={24} className="text-gray-200" />
          </div>
        </div>

        {/* BARRE OUTILS */}
        <div className="flex gap-4 mb-8 sticky top-6 z-20">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher un joueur..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white p-4 pl-12 rounded-2xl text-sm font-bold border border-gray-100 outline-none focus:border-[#ff9d00] shadow-sm transition-all"
              />
           </div>
           <button 
             onClick={toggleAll}
             className="bg-white px-6 rounded-2xl text-[10px] font-black uppercase border border-gray-100 hover:bg-black hover:text-white transition-colors whitespace-nowrap shadow-sm"
           >
             Tout cocher
           </button>
        </div>

        {/* LISTE GROUPÉE PAR POSTE */}
        <div className="space-y-8 mb-32">
           {sortedGroupKeys.length > 0 ? (
             sortedGroupKeys.map((poste) => (
                <div key={poste} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* TITRE DU GROUPE */}
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <span className="bg-black text-white text-[9px] font-black uppercase px-3 py-1 rounded-lg tracking-widest">
                            {poste}
                        </span>
                        <div className="h-px bg-gray-200 flex-1"></div>
                        <span className="text-[10px] font-bold text-gray-400">
                            {groupedPlayers[poste].length} Joueurs
                        </span>
                    </div>

                    {/* GRILLE DES JOUEURS DU GROUPE */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        {groupedPlayers[poste].map((joueur: any) => {
                            const isSelected = selectedPlayers.includes(joueur.id);
                            return (
                                <div 
                                    key={joueur.id} 
                                    onClick={() => togglePlayer(joueur.id)}
                                    className={`flex items-center justify-between p-5 cursor-pointer transition-all hover:bg-gray-50 group ${isSelected ? 'bg-[#ff9d00]/5' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Avatar (Initiale) */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black italic shadow-sm transition-colors ${isSelected ? 'bg-[#ff9d00] text-white shadow-[#ff9d00]/30' : 'bg-gray-100 text-gray-400'}`}>
                                            {joueur.nom.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className={`text-sm font-black uppercase transition-colors ${isSelected ? 'text-black' : 'text-gray-500'}`}>
                                                {joueur.nom} {joueur.prenom}
                                            </h3>
                                            {/* Badge spécifique */}
                                            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${poste === 'GARDIEN' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400'}`}>
                                                {joueur.poste || 'Joueur'}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Checkbox Stylisée */}
                                    <div className={`transition-all duration-300 transform ${isSelected ? 'text-[#ff9d00] scale-110' : 'text-gray-200 group-hover:scale-105'}`}>
                                        {isSelected ? (
                                            <CheckCircle2 size={28} fill="currentColor" className="text-white bg-[#ff9d00] rounded-full"/>
                                        ) : (
                                            <Circle size={28} />
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
             ))
           ) : (
             <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] bg-white/50">
               <Users className="mx-auto text-gray-200 mb-4" size={48} />
               <p className="text-gray-400 font-bold text-xs uppercase">Aucun joueur trouvé</p>
             </div>
           )}
        </div>

        {/* BOUTON FLOTTANT VALIDATION */}
        <div className="fixed bottom-6 left-0 right-0 px-6 md:px-0 flex justify-center z-50 pointer-events-none">
           <button 
             onClick={handleValidate}
             disabled={submitting || selectedPlayers.length === 0}
             className="pointer-events-auto bg-[#ff9d00] text-white px-10 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-black transition-all shadow-2xl hover:shadow-[#ff9d00]/50 active:scale-95 flex items-center gap-3 disabled:opacity-0 disabled:translate-y-10 transform duration-300"
           >
              {submitting ? <Loader2 className="animate-spin" /> : "Valider & Placer sur le terrain"} 
              {!submitting && <ChevronRight size={16} />}
           </button>
        </div>

      </div>
    </div>
  );
}