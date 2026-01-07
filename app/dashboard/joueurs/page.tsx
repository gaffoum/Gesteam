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
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function JoueursContent() {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [clubName, setClubName] = useState<string>(""); 
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- GESTION DU RETOUR ---
  const searchParams = useSearchParams();
  const filterTeam = searchParams.get('cat'); 
  const backLink = filterTeam ? "/dashboard/equipes" : "/dashboard";

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

      if (profile?.club_id) {
        const { data: club } = await supabase
          .from('clubs')
          .select('nom, nom_usage')
          .eq('id', profile.club_id)
          .single();
        
        if (club) setClubName(club.nom_usage || club.nom || "");

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

  const generateInviteLink = (id: string) => {
    const token = btoa(`player-${id}`); 
    const url = `${window.location.origin}/register?token=${token}`;
    navigator.clipboard.writeText(url);
    alert("LIEN D'INVITATION COPIÉ !");
  };

  // --- FONCTION RESTAURÉE : TÉLÉCHARGER MODÈLE ---
  const handleDownloadTemplate = () => {
    // J'ai mis à jour le modèle pour qu'il ressemble à votre format d'import (point-virgule)
    // Mais vous pouvez remettre l'ancien si vous préférez.
    const headers = "Type licence;Nom, prénom;Né(e) le;Sous catégorie;Validité Certif Médic N+1";
    const example = "Libre;MBAPPE Kylian;20/12/1998;Senior;Valide";
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + example;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "modele_joueurs_fff.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- NOUVEAU HANDLE FILE UPLOAD (Format FFF) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setImporting(false); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (!profile?.club_id) {
        alert("Impossible de récupérer votre club.");
        setImporting(false);
        return;
      }

      // Découpage des lignes
      const rows = text.split('\n');
      const playersToInsert = [];

      // On commence à i=1 pour sauter l'en-tête
      for (let i = 1; i < rows.length; i++) {
        // ATTENTION : On utilise le point-virgule comme séparateur
        const rowData = rows[i].split(';');
        
        // Vérification qu'on a bien assez de données
        if (rowData.length < 3) continue;

        // 1. Gestion NOM PRENOM (Colonne index 1)
        const fullName = rowData[1]?.trim();
        if (!fullName) continue;

        // On sépare au premier espace
        const nameParts = fullName.split(' ');
        const nom = nameParts[0] || "Inconnu";
        const prenom = nameParts.slice(1).join(' ') || "";

        // 2. Gestion DATE (Colonne index 2) - Format DD/MM/YYYY -> YYYY-MM-DD
        const rawDate = rowData[2]?.trim();
        let date_naissance = null;
        if (rawDate && rawDate.includes('/')) {
            const [d, m, y] = rawDate.split('/');
            if (d && m && y && y.length === 4) date_naissance = `${y}-${m}-${d}`;
        }

        // 3. Gestion CATEGORIE (Colonne index 3)
        const categorie = rowData[3]?.trim() || null;

        // 4. Type Licence (Colonne index 0 - Optionnel)
        const type_licence = rowData[0]?.trim() || null;

        playersToInsert.push({
          club_id: profile.club_id,
          nom: nom.toUpperCase(),
          prenom: prenom,
          date_naissance: date_naissance,
          categorie: categorie,
          type_licence: type_licence
        });
      }

      if (playersToInsert.length > 0) {
        const { error } = await supabase.from('joueurs').insert(playersToInsert);
        if (!error) {
          alert(`${playersToInsert.length} joueurs importés avec succès !`);
          fetchData();
        } else {
          console.error(error);
          alert("Erreur lors de l'import base de données.");
        }
      } else {
        alert("Aucun joueur valide trouvé (vérifiez le format : point-virgule requis).");
      }
      
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    // Lecture en ISO-8859-1 pour bien gérer les accents des exports Windows/Excel
    reader.readAsText(file, 'ISO-8859-1'); 
  };

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
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
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
            {/* BOUTON MODÈLE CSV (RESTAURÉ) */}
            <button 
              onClick={handleDownloadTemplate} 
              className="bg-black text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Download size={16} /> <span className="hidden lg:inline">MODÈLE CSV</span>
            </button>

            {/* Input fichier caché */}
            <input 
              type="file" 
              accept=".csv" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />

            <button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={importing} 
              className="bg-black text-white px-5 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              {importing ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} 
              <span className="hidden lg:inline">{importing ? "IMPORT EN COURS..." : "IMPORTER FICHIER FFF"}</span>
            </button>

            <Link href="/dashboard/joueurs/nouveau" className="bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95">
              <Plus size={16} /> AJOUTER UN JOUEUR
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

        {/* --- CONTENU --- */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJoueurs.map((joueur) => (
              <div key={joueur.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#ff9d00] hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div className="px-3 py-2 bg-gray-50 rounded-lg text-[10px] font-black text-gray-400 uppercase">
                      {joueur.categorie || 'SANS CAT.'}
                    </div>
                    <button onClick={() => generateInviteLink(joueur.id)} className="text-gray-300 hover:text-[#ff9d00] transition-colors p-2 bg-gray-50 rounded-full">
                      <Share2 size={16} />
                    </button>
                  </div>
                  <h3 className="text-2xl text-black tracking-tighter mb-1 italic">{joueur.prenom} {joueur.nom}</h3>
                  <p className="text-gray-400 text-[9px] tracking-widest font-black mb-8 italic">
                     {joueur.date_naissance ? `NÉ LE ${joueur.date_naissance.split('-').reverse().join('/')}` : 'DATE INCONNUE'}
                  </p>
                  <div className="flex items-center gap-2">
                     <Link href={`/dashboard/joueurs/${joueur.id}`} className="bg-[#ff9d00]/10 text-[#ff9d00] px-4 py-3 rounded-xl text-[9px] font-black hover:bg-[#ff9d00] hover:text-white transition-all flex items-center gap-2">
                        VOIR FICHE <ChevronRight size={12} />
                     </Link>
                  </div>
                </div>
                <UserIcon className="absolute -right-8 -bottom-8 text-gray-50/80 group-hover:text-[#ff9d00]/5 transition-all duration-500 transform group-hover:scale-110" size={160} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left italic">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] tracking-widest">
                  <tr>
                    <th className="px-10 py-6 font-black">JOUEUR</th>
                    <th className="px-10 py-6 font-black">CATÉGORIE</th>
                    <th className="px-10 py-6 font-black">NAISSANCE</th>
                    <th className="px-10 py-6 font-black text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredJoueurs.map((joueur) => (
                    <tr key={joueur.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-10 py-6">
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
                      <td className="px-10 py-6">
                          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase">
                           {joueur.categorie || '-'}
                          </span>
                      </td>
                      <td className="px-10 py-6 text-gray-400 text-[10px] font-black">
                        {joueur.date_naissance || 'N/A'}
                      </td>
                      <td className="px-10 py-6 text-right">
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
        )}

        {filteredJoueurs.length === 0 && !loading && (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] mt-8 bg-white/50">
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic">AUCUN JOUEUR DANS L'EFFECTIF</p>
            <p className="text-gray-300/50 text-[10px] mt-2 font-bold">Importez votre fichier CSV pour commencer</p>
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