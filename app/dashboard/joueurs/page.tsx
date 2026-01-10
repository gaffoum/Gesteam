"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { supabase } from '@/lib/supabase'; 
import { 
  Plus, 
  Search, 
  User as UserIcon, 
  ArrowLeft, 
  Loader2, 
  LayoutGrid, 
  List, 
  Share2, 
  ChevronRight,
  Download, 
  Upload,
  Trash2,
  CheckSquare,
  Square,
  Check,
  AlertTriangle,
  Shield
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function JoueursContent() {
  // ==================================================================================
  // 1. ÉTATS ET VARIABLES
  // ==================================================================================

  // États de base
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]); // Liste des équipes existantes
  const [clubName, setClubName] = useState<string>(""); 
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  // États de sélection (Suppression de masse)
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  
  // États pour l'Import Intelligent (Création d'équipe)
  const [missingTeams, setMissingTeams] = useState<string[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  
  // Formulaire création équipe rapide (dans la modale)
  const [newTeamGender, setNewTeamGender] = useState<string>("M");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // État de la Modale Gesteam Pro
  const [modal, setModal] = useState<{ 
    show: boolean; 
    type: 'success' | 'error' | 'warning' | 'import_creation'; 
    title: string; 
    message: string; 
    action?: () => void 
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Gestion du lien retour (filtrage)
  const searchParams = useSearchParams();
  const filterTeam = searchParams.get('cat'); 
  const backLink = filterTeam ? "/dashboard/equipes" : "/dashboard";

  // ==================================================================================
  // 2. CHARGEMENT DES DONNÉES
  // ==================================================================================

  useEffect(() => {
    fetchData();
  }, [filterTeam]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();
        
      setCurrentProfile(profile);

      if (profile?.club_id) {
        // 1. Récupérer le Club
        const { data: club } = await supabase
          .from('clubs')
          .select('nom, nom_usage')
          .eq('id', profile.club_id)
          .single();
        if (club) setClubName(club.nom_usage || club.nom || "");

        // 2. Récupérer les Équipes (Pour matcher l'import)
        const { data: teamList } = await supabase
          .from('equipes')
          .select('id, nom, categorie')
          .eq('club_id', profile.club_id);
        setTeams(teamList || []);

        // 3. Récupérer les Joueurs
        const { data: players, error } = await supabase
          .from('joueurs')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('nom', { ascending: true });

        if (error) throw error;
        setJoueurs(players || []);
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  // ==================================================================================
  // 3. GESTION DE LA SÉLECTION (CHECKBOX)
  // ==================================================================================

  const handleSelectAll = () => {
    if (selectedPlayers.length === filteredJoueurs.length) {
      setSelectedPlayers([]); // Tout désélectionner
    } else {
      setSelectedPlayers(filteredJoueurs.map(j => j.id)); // Tout sélectionner
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedPlayers.includes(id)) {
      setSelectedPlayers(selectedPlayers.filter(pId => pId !== id));
    } else {
      setSelectedPlayers([...selectedPlayers, id]);
    }
  };

  // ==================================================================================
  // 4. SUPPRESSION DE MASSE
  // ==================================================================================

  const confirmMassDelete = () => {
    if (selectedPlayers.length === 0) return;
    
    setModal({
      show: true,
      type: 'warning',
      title: 'SUPPRESSION GLOBALE',
      message: `Êtes-vous sûr de vouloir supprimer définitivement ${selectedPlayers.length} joueurs ?`,
      action: executeMassDelete
    });
  };

  const executeMassDelete = async () => {
    try {
      const { error } = await supabase
        .from('joueurs')
        .delete()
        .in('id', selectedPlayers);

      if (error) throw error;

      setJoueurs(joueurs.filter(j => !selectedPlayers.includes(j.id)));
      setSelectedPlayers([]);
      setModal({ show: true, type: 'success', title: 'SUPPRESSION RÉUSSIE', message: 'Les joueurs ont été supprimés.' });
    } catch (error) {
      console.error(error);
      setModal({ show: true, type: 'error', title: 'ERREUR', message: "Impossible de supprimer les joueurs." });
    }
  };

  const generateInviteLink = (id: string) => {
    const token = btoa(`player-${id}`); 
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    setModal({ show: true, type: 'success', title: 'LIEN COPIÉ', message: "Le lien d'invitation est dans votre presse-papier." });
  };

  // ==================================================================================
  // 5. IMPORT CSV & CRÉATION ÉQUIPE AUTOMATIQUE
  // ==================================================================================

  const handleDownloadTemplate = () => {
    const headers = "Type licence;Nom, prénom;Né(e) le;Sous catégorie;Validité Certif Médic N+1";
    const example = "Libre;MBAPPE Kylian;20/12/1998;Senior M;Valide";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "modele_joueurs_fff.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const rows = text.split('\n');
      const parsedPlayers: any[] = [];
      const categoriesFound = new Set<string>();

      // Parsing du CSV
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(';');
        if (rowData.length < 3) continue;

        const fullName = rowData[1]?.trim();
        if (!fullName) continue;

        const nameParts = fullName.split(' ');
        const nom = nameParts[0] || "Inconnu";
        const prenom = nameParts.slice(1).join(' ') || "";

        const rawDate = rowData[2]?.trim();
        let date_naissance = null;
        if (rawDate && rawDate.includes('/')) {
            const [d, m, y] = rawDate.split('/');
            if (d && m && y && y.length === 4) date_naissance = `${y}-${m}-${d}`;
        }

        const catCSV = rowData[3]?.trim() || "SANS CATÉGORIE";
        categoriesFound.add(catCSV);

        const type_licence = rowData[0]?.trim() || null;

        parsedPlayers.push({
          nom: nom.toUpperCase(),
          prenom: prenom,
          date_naissance: date_naissance,
          categorie_csv: catCSV, // On garde le nom CSV pour l'instant
          type_licence: type_licence
        });
      }

      // Vérification des équipes existantes
      const missingCats: string[] = [];
      
      Array.from(categoriesFound).forEach(cat => {
        // On cherche si une équipe a ce nom OU cette catégorie
        const exists = teams.find(t => t.nom.toUpperCase() === cat.toUpperCase() || t.categorie?.toUpperCase() === cat.toUpperCase());
        if (!exists && cat !== "SANS CATÉGORIE") {
          missingCats.push(cat);
        }
      });

      // Stockage temporaire
      setPendingPlayers(parsedPlayers);

      if (missingCats.length > 0) {
        // SCÉNARIO B : Équipes manquantes -> On ouvre la modale de création
        setMissingTeams(missingCats);
        setModal({
          show: true,
          type: 'import_creation',
          title: 'ÉQUIPES MANQUANTES',
          message: `Le fichier contient des catégories qui n'existent pas encore : ${missingCats[0]}. Voulez-vous créer cette équipe ?`
        });
        setImporting(false); // On met en pause l'import visuel
      } else {
        // SCÉNARIO A : Tout existe, on insère direct
        finalizeImport(parsedPlayers, teams);
      }
      
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    reader.readAsText(file, 'ISO-8859-1'); 
  };

  // --- CRÉATION D'ÉQUIPE (LOGIQUE CORRIGÉE) ---
  const handleCreateMissingTeam = async () => {
    if (missingTeams.length === 0) return;

    const teamName = missingTeams[0]; // On traite la première manquante
    
    try {
      // Création de l'équipe
      const { data: newTeam, error } = await supabase
        .from('equipes')
        .insert({
          club_id: currentProfile.club_id,
          nom: teamName,
          categorie: teamName, // Utilisation du nom comme catégorie
          genre: newTeamGender // M, F ou Mixte
        })
        .select()
        .single();

      if (error) throw error;

      // Mise à jour de la liste locale des équipes
      const updatedTeams = [...teams, newTeam];
      setTeams(updatedTeams);

      // On retire l'équipe traitée de la liste des manquantes
      const remainingMissing = missingTeams.slice(1);
      setMissingTeams(remainingMissing);

      if (remainingMissing.length > 0) {
        // S'il en reste, on met à jour la modale pour la suivante
        setModal({
          ...modal,
          message: `Équipe créée ! Catégorie suivante manquante : ${remainingMissing[0]}.`
        });
      } else {
        // Si fini, on lance l'import final
        setModal({ show: false } as any); // Fermer modale création
        finalizeImport(pendingPlayers, updatedTeams);
      }

    } catch (err: any) {
      console.error(err);
      // Affichage propre de l'erreur dans la modale
      setModal({ 
        show: true, 
        type: 'error', 
        title: 'ÉCHEC CRÉATION ÉQUIPE', 
        message: err.message || "Vérifiez vos permissions (Policies RLS) ou les colonnes 'genre'/'categorie' dans la table 'equipes'." 
      });
    }
  };

  // --- FINALISATION IMPORT ---
  const finalizeImport = async (playersToInsert: any[], currentTeamsList: any[]) => {
    setImporting(true);
    
    const finalData = playersToInsert.map(p => {
      // On cherche l'ID de l'équipe correspondante
      const team = currentTeamsList.find(t => t.nom.toUpperCase() === p.categorie_csv.toUpperCase() || t.categorie?.toUpperCase() === p.categorie_csv.toUpperCase());
      
      return {
        club_id: currentProfile.club_id,
        nom: p.nom,
        prenom: p.prenom,
        date_naissance: p.date_naissance,
        categorie: p.categorie_csv, // On garde le texte pour l'affichage
        equipe_id: team ? team.id : null, // On lie l'ID si trouvé
        type_licence: p.type_licence
      };
    });

    const { error } = await supabase.from('joueurs').insert(finalData);
    
    setImporting(false);
    
    if (!error) {
      setModal({ show: true, type: 'success', title: 'IMPORT TERMINÉ', message: `${finalData.length} joueurs ont été ajoutés et liés aux équipes !` });
      fetchData();
    } else {
      console.error(error);
      setModal({ show: true, type: 'error', title: 'ERREUR IMPORT', message: "Problème lors de l'enregistrement des joueurs." });
    }
  };

  // ==================================================================================
  // 6. FILTRAGE ET RENDU
  // ==================================================================================

  const filteredJoueurs = joueurs.filter(j => 
    `${j.prenom} ${j.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (j.categorie && j.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase text-[#1a1a1a]">
      
      {/* ------------------------------------------------ */}
      {/* MODALE GESTEAM PRO LIGHT                         */}
      {/* ------------------------------------------------ */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Cas Spécial : Création d'équipe (Import) */}
            {modal.type === 'import_creation' ? (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-50 text-blue-500">
                  <Shield size={32} strokeWidth={3} />
                </div>
                <h3 className="text-xl font-black italic text-black mb-2 leading-none">{modal.title}</h3>
                <p className="text-gray-500 text-xs font-bold mb-6 normal-case">{modal.message}</p>
                
                <div className="text-left mb-6 bg-gray-50 p-4 rounded-xl">
                  <label className="text-[10px] text-gray-400 font-black mb-1 block">Genre de l'équipe</label>
                  <select 
                    value={newTeamGender} 
                    onChange={(e) => setNewTeamGender(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#ff9d00]"
                  >
                    <option value="M">Masculin (M)</option>
                    <option value="F">Féminin (F)</option>
                    <option value="Mixte">Mixte</option>
                  </select>
                </div>

                <button onClick={handleCreateMissingTeam} className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-colors shadow-lg mb-2">
                  Créer l'équipe & Continuer
                </button>
              </>
            ) : (
              // Cas Standard : Succès / Erreur / Warning
              <>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-[#ff9d00]/10 text-[#ff9d00]' : modal.type === 'warning' ? 'bg-red-50 text-red-500' : 'bg-red-50 text-red-500'}`}>
                  {modal.type === 'success' ? <Check size={32} strokeWidth={3} /> : <AlertTriangle size={32} strokeWidth={3} />}
                </div>
                <h3 className="text-xl font-black italic text-black mb-2 leading-none">{modal.title}</h3>
                <p className="text-gray-500 text-xs font-bold mb-8 uppercase tracking-wide">{modal.message}</p>
                
                <div className="flex gap-2">
                  {modal.type === 'warning' && (
                    <button onClick={() => setModal({ ...modal, show: false })} className="flex-1 py-4 bg-white text-gray-400 border border-gray-100 rounded-xl font-black text-xs hover:bg-gray-50 transition-colors">
                      Annuler
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (modal.action) modal.action();
                      setModal({ ...modal, show: false });
                    }}
                    className="flex-1 py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-colors shadow-lg"
                  >
                    {modal.type === 'warning' ? 'Confirmer' : 'Fermer'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
          
          <div className="flex items-center gap-5">
            <Link href={backLink} className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl tracking-tighter text-black italic leading-none">
                EFFECTIF <span className="text-[#ff9d00]">CLUB</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Bouton Suppression de Masse (Visible si sélection) */}
            {selectedPlayers.length > 0 && (
               <button 
                 onClick={confirmMassDelete}
                 className="bg-red-500 text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg animate-in fade-in zoom-in"
               >
                 <Trash2 size={16} /> SUPPRIMER ({selectedPlayers.length})
               </button>
            )}

            <button 
              onClick={handleDownloadTemplate} 
              className="bg-white text-black border border-gray-200 px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:border-[#ff9d00] hover:text-[#ff9d00] transition-all flex items-center gap-2 shadow-sm"
            >
              <Download size={16} /> <span className="hidden lg:inline">MODÈLE CSV</span>
            </button>

            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importing} 
              className="bg-black text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} 
              <span className="hidden lg:inline">{importing ? "IMPORT..." : "IMPORTER FFF"}</span>
            </button>

            <Link href="/dashboard/joueurs/nouveau" className="bg-[#ff9d00] text-white px-6 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-black transition-all flex items-center gap-2 shadow-lg active:scale-95">
              <Plus size={16} /> AJOUTER
            </Link>
          </div>
        </div>

        {/* --- BARRE DE RECHERCHE --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="RECHERCHER (NOM, PRÉNOM, CATÉGORIE...)" 
              className="w-full bg-white border border-gray-100 rounded-[2rem] py-5 pl-14 pr-6 text-xs font-black italic outline-none focus:ring-2 focus:ring-[#ff9d00]/20 transition-all shadow-sm placeholder:text-gray-300 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-1">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
              <List size={20} />
            </button>
          </div>
        </div>

        {/* --- VUE LISTE AVEC CHECKBOX --- */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left italic">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] tracking-widest">
                  <tr>
                    <th className="px-6 py-6 font-black w-16 text-center">
                        <button onClick={handleSelectAll} className="text-gray-400 hover:text-[#ff9d00]">
                            {selectedPlayers.length === filteredJoueurs.length && filteredJoueurs.length > 0 ? <CheckSquare size={20}/> : <Square size={20}/>}
                        </button>
                    </th>
                    <th className="px-4 py-6 font-black">JOUEUR</th>
                    <th className="px-4 py-6 font-black">CATÉGORIE</th>
                    <th className="px-4 py-6 font-black">NAISSANCE</th>
                    <th className="px-4 py-6 font-black text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJoueurs.map((joueur) => (
                    <tr key={joueur.id} className={`transition-colors group ${selectedPlayers.includes(joueur.id) ? 'bg-[#ff9d00]/5' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-6 py-6 text-center">
                          <button onClick={() => handleSelectOne(joueur.id)} className={selectedPlayers.includes(joueur.id) ? "text-[#ff9d00]" : "text-gray-300 hover:text-gray-400"}>
                            {selectedPlayers.includes(joueur.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                          </button>
                      </td>
                      <td className="px-4 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-black text-[#ff9d00] rounded-xl flex items-center justify-center text-xs font-black italic shadow-md">
                            {joueur.nom.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-black font-black text-sm uppercase">{joueur.nom}</span>
                            <span className="text-gray-400 text-[10px] font-bold">{joueur.prenom}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-6">
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                            {joueur.categorie || '-'}
                          </span>
                      </td>
                      <td className="px-4 py-6 text-gray-400 text-[10px] font-black">
                        {joueur.date_naissance ? joueur.date_naissance.split('-').reverse().join('/') : 'N/A'}
                      </td>
                      <td className="px-4 py-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => generateInviteLink(joueur.id)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-[#ff9d00] hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
                            <Share2 size={16} />
                          </button>
                          <Link href={`/dashboard/joueurs/${joueur.id}`} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-black hover:bg-white border border-transparent hover:border-gray-100 transition-all shadow-sm">
                            <ChevronRight size={16} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
            // --- VUE GRID (INCHANGÉE MAIS AVEC LE BOUTON SELECT) ---
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJoueurs.map((joueur) => (
              <div key={joueur.id} className={`bg-white p-8 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all group relative overflow-hidden ${selectedPlayers.includes(joueur.id) ? 'border-[#ff9d00] ring-1 ring-[#ff9d00]' : 'border-gray-100 hover:border-[#ff9d00]'}`}>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <button onClick={() => handleSelectOne(joueur.id)} className={selectedPlayers.includes(joueur.id) ? "text-[#ff9d00]" : "text-gray-300 hover:text-gray-400"}>
                        {selectedPlayers.includes(joueur.id) ? <CheckSquare size={20}/> : <Square size={20}/>}
                    </button>
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase">
                      {joueur.categorie || 'SANS CAT.'}
                    </div>
                  </div>
                  <h3 className="text-2xl text-black tracking-tighter mb-1 italic">{joueur.prenom} {joueur.nom}</h3>
                  <div className="flex items-center gap-2 mt-4">
                      <Link href={`/dashboard/joueurs/${joueur.id}`} className="bg-[#ff9d00]/10 text-[#ff9d00] px-4 py-3 rounded-xl text-[9px] font-black hover:bg-[#ff9d00] hover:text-white transition-all flex items-center gap-2">
                        VOIR FICHE <ChevronRight size={12} />
                      </Link>
                  </div>
                </div>
                <UserIcon className="absolute -right-8 -bottom-8 text-gray-50/80 group-hover:text-[#ff9d00]/5 transition-all duration-500 transform group-hover:scale-110" size={160} />
              </div>
            ))}
          </div>
        )}

        {filteredJoueurs.length === 0 && !loading && (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] mt-8 bg-white/50">
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic">AUCUN JOUEUR TROUVÉ</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function JoueursPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    }>
      <JoueursContent />
    </Suspense>
  );
}