"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronRight, 
  Shield, 
  Users,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function TeamDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // --- ÉTATS ---
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any>(null); 
  const [players, setPlayers] = useState<any[]>([]); 
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  // --- FONCTION DE NORMALISATION (POUR COMPARER LES TEXTES) ---
  // Transforme "Séniors " en "seniors" pour éviter les erreurs d'accents ou d'espaces
  const normalize = (str: string | null) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  };

  // --- CHARGEMENT ---
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        // 1. Récupérer l'ÉQUIPE
        const { data: teamData, error: teamError } = await supabase
          .from('equipes')
          .select('*')
          .eq('id', params.id)
          .single();

        if (teamError) throw teamError;
        setTeam(teamData);

        // 2. Récupérer TOUS les joueurs du club (On filtrera strictement en JS)
        // C'est plus sûr que le SQL pour gérer les accents et les cas "Vétéran" vs "Senior"
        const { data: allPlayers, error: playersError } = await supabase
          .from('joueurs')
          .select('*')
          .eq('club_id', teamData.club_id)
          .order('nom', { ascending: true });

        if (playersError) throw playersError;

        // 3. FILTRE STRICT
        const teamNameNorm = normalize(teamData.nom);
        const teamCatNorm = normalize(teamData.categorie);

        const strictFilteredPlayers = (allPlayers || []).filter((p: any) => {
           // A. Si le joueur est lié techniquement par ID (le plus fiable)
           if (p.equipe_id === params.id) return true;

           // B. Sinon, on compare le texte de la catégorie
           const playerCatNorm = normalize(p.categorie);
           
           // Si le joueur n'a pas de catégorie, on l'exclut
           if (!playerCatNorm) return false;

           // Comparaison stricte : "senior" === "senior" (et non "senior" dans "vétéran senior")
           return playerCatNorm === teamNameNorm || playerCatNorm === teamCatNorm;
        });

        setPlayers(strictFilteredPlayers);

      } catch (err) {
        console.error("Erreur chargement:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [params.id]);

  // --- RECHERCHE LOCALE (Nom/Prénom) ---
  const filteredPlayers = players.filter(p => 
    `${p.nom} ${p.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  if (!team) return <div className="p-10 text-center">Équipe introuvable.</div>;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- EN-TÊTE DÉDIÉ ÉQUIPE --- */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
          <div className="flex items-center gap-5 w-full md:w-auto">
            <Link href="/dashboard/equipes" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">
                Effectif Équipe
              </p>
              {/* NOM DE L'ÉQUIPE (Dynamique) */}
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-black">
                {team.nom}
              </h1>
              <div className="flex items-center gap-3 mt-2">
                 <span className="px-3 py-1 bg-[#ff9d00] text-white rounded-lg text-[10px] font-black uppercase">
                    {players.length} Joueurs
                 </span>
                 <span className="px-3 py-1 bg-white border border-gray-200 text-gray-400 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                    <Shield size={10}/> {team.categorie || 'Saison en cours'}
                 </span>
              </div>
            </div>
          </div>

          {/* RECHERCHE DANS L'ÉQUIPE */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                <input 
                  type="text" 
                  placeholder={`Rechercher dans ${team.nom}...`} 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-[2rem] py-3 pl-12 pr-4 text-xs font-black uppercase outline-none focus:border-[#ff9d00] transition-all"
                />
            </div>
            <div className="bg-white p-1.5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-1">
                <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
                  <LayoutGrid size={18} />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
                  <List size={18} />
                </button>
            </div>
          </div>
        </div>

        {/* --- LISTE DES JOUEURS FILTRÉS --- */}
        {filteredPlayers.length > 0 ? (
          <>
            {viewMode === 'list' ? (
              // VUE LISTE
              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest font-black">
                      <tr>
                        <th className="px-8 py-6">Joueur</th>
                        <th className="px-8 py-6">Poste</th>
                        <th className="px-8 py-6">Naissance</th>
                        <th className="px-8 py-6 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredPlayers.map((joueur) => (
                        <tr key={joueur.id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-black text-[#ff9d00] rounded-xl flex items-center justify-center text-xs font-black italic shadow-md">
                                {joueur.nom.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-black font-black text-sm uppercase">{joueur.nom}</span>
                                <span className="text-gray-400 text-[10px] font-bold uppercase">{joueur.prenom}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-5">
                              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                                {joueur.poste || '-'}
                              </span>
                          </td>
                          <td className="px-8 py-5 text-gray-400 text-[10px] font-black uppercase">
                            {joueur.date_naissance ? new Date(joueur.date_naissance).toLocaleDateString('fr-FR') : '-'}
                          </td>
                          <td className="px-8 py-5 text-right">
                            <Link href={`/dashboard/joueurs/${joueur.id}`} className="inline-flex p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-black hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
                                <ChevronRight size={16} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // VUE GRILLE
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredPlayers.map((joueur) => (
                  <Link key={joueur.id} href={`/dashboard/joueurs/${joueur.id}`} className="group relative block">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#ff9d00] hover:shadow-xl transition-all relative overflow-hidden h-full">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                           <span className="px-3 py-2 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase">
                             {joueur.poste || 'JOUEUR'}
                           </span>
                        </div>
                        <h3 className="text-2xl text-black font-black italic uppercase tracking-tighter mb-1">
                          {joueur.prenom} <br/> {joueur.nom}
                        </h3>
                        <div className="flex items-center gap-2 mt-6">
                            <span className="bg-[#ff9d00]/10 text-[#ff9d00] px-4 py-3 rounded-xl text-[9px] font-black group-hover:bg-[#ff9d00] group-hover:text-white transition-all flex items-center gap-2">
                              VOIR FICHE <ChevronRight size={12} />
                            </span>
                        </div>
                      </div>
                      <User className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-[#ff9d00]/5 transition-all duration-500 transform group-hover:scale-110" size={140} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : (
          // ÉTAT VIDE
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] bg-white/50">
            <Users className="mx-auto text-gray-200 mb-4" size={48} />
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic uppercase">AUCUN JOUEUR DANS CETTE ÉQUIPE</p>
            <p className="text-gray-300 text-[10px] mt-2 max-w-md mx-auto">
                Les joueurs doivent avoir la catégorie exacte <strong>"{team.nom}"</strong> pour apparaître ici.
            </p>
            <Link href="/dashboard/joueurs" className="mt-6 inline-block bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#ff9d00] transition-colors shadow-lg">
              Gérer l'effectif
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}