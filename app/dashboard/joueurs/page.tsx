"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Papa from 'papaparse';
import { 
  Users, Plus, Search, ArrowLeft, Loader2, Trash2, Edit2,
  User, Download, Upload, List, LayoutGrid, Camera, ChevronDown, Filter
} from 'lucide-react';
import Link from 'next/link';

export default function PlayersListPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoste, setSelectedPoste] = useState('');
  const [clubId, setClubId] = useState<string | null>(null);
  
  // États pour la vue et l'upload
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploadingPhotoId, setUploadingPhotoId] = useState<string | null>(null);

  useEffect(() => {
    fetchJoueurs();
  }, []);

  const fetchJoueurs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }

      const { data: profile } = await supabase
        .from('profiles').select('club_id').eq('id', session.user.id).single();

      if (profile?.club_id) {
        setClubId(profile.club_id);
        const { data, error } = await supabase
          .from('joueurs')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('nom', { ascending: true });
        if (error) throw error;
        setJoueurs(data || []);
      }
    } catch (err) {
      console.error("Erreur chargement joueurs:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTION UPLOAD PHOTO (Bucket: joueurs_photos) ---
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, joueurId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhotoId(joueurId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${joueurId}-${Date.now()}.${fileExt}`;
      const filePath = `photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('joueurs_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('joueurs_photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('joueurs')
        .update({ photo_url: publicUrl })
        .eq('id', joueurId);

      if (updateError) throw updateError;
      
      fetchJoueurs();
    } catch (err: any) {
      alert("Erreur photo : " + err.message);
    } finally {
      setUploadingPhotoId(null);
    }
  };

  // --- LOGIQUE IMPORT CSV ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clubId) return;
    setImporting(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const formattedData = (results.data as any[]).map(row => ({
          nom: row.nom || 'Inconnu',
          prenom: row.prenom || '',
          poste: row.poste || '',
          maillot: row.maillot ? parseInt(row.maillot) : null,
          licence: row.licence || '',
          categorie: row.categorie || '',
          equipe_concernee: row.equipe_concernee || '',
          club_id: clubId
        }));
        
        const { error } = await supabase.from('joueurs').insert(formattedData);
        if (error) alert("Erreur import : " + error.message);
        else { alert("Importation réussie !"); fetchJoueurs(); }
        setImporting(false);
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "nom,prenom,poste,maillot,telephone,categorie,licence,email,date_naissance,equipe_concernee\nDOE,John,Attaquant,9,0600000000,U19,12345,john@test.com,2005-01-01,Equipe A";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "modele_joueurs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteJoueur = async (id: string) => {
    if (confirm("Supprimer ce joueur ?")) {
      await supabase.from('joueurs').delete().eq('id', id);
      fetchJoueurs();
    }
  };

  const filteredJoueurs = joueurs.filter(j => {
    const matchesName = `${j.prenom} ${j.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPoste = selectedPoste === '' || j.poste === selectedPoste;
    return matchesName && matchesPoste;
  });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-6xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/dashboard" className="text-gray-400 hover:text-[#ff9d00] transition-colors">
                <ArrowLeft size={24} />
              </Link>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
                Effectif <span className="text-[#ff9d00]">Joueurs</span>
              </h1>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-10 italic">
              Gestion des licences & profils
            </p>
          </div>
          <Link href="/dashboard/joueurs/nouveau" className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-xl">
            <Plus size={18} /> Ajouter un joueur
          </Link>
        </div>

        {/* BOUTONS IMPORT (CONSERVÉS) */}
        <div className="flex flex-wrap gap-4 mb-8 ml-10 not-italic">
          <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-[#ff9d00] shadow-sm transition-all">
            <Download size={14} /> Modèle CSV
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:text-[#ff9d00] shadow-sm transition-all">
            {importing ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
            Charger Fichier
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
        </div>

        {/* RECHERCHE + POSTE + TOGGLE */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center not-italic">
          <div className="relative flex-[2] w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" placeholder="Rechercher..." 
              className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/10 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative flex-1 w-full">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <select 
              className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none cursor-pointer"
              onChange={(e) => setSelectedPoste(e.target.value)}
            >
              <option value="">Tous les postes</option>
              <option value="Gardien">Gardien</option><option value="Défenseur">Défenseur</option><option value="Milieu">Milieu</option><option value="Attaquant">Attaquant</option>
            </select>
          </div>

          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#ff9d00] shadow-sm' : 'text-gray-300'}`}><LayoutGrid size={20} /></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-[#ff9d00] shadow-sm' : 'text-gray-300'}`}><List size={20} /></button>
          </div>
        </div>

        {/* LISTE DES JOUEURS */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-italic">
            {filteredJoueurs.map((joueur) => (
              <div key={joueur.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#ff9d00] transition-all group relative">
                <div className="flex items-center gap-5 mb-6">
                  <div className="relative w-20 h-20 flex-shrink-0 group/photo">
                    <div className="w-full h-full bg-gray-50 rounded-[1.8rem] flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#ff9d00] transition-all">
                      {joueur.photo_url ? <img src={joueur.photo_url} className="w-full h-full object-cover" /> : <User size={30} className="text-gray-200" />}
                    </div>
                    <label className="absolute -bottom-1 -right-1 p-2 bg-[#1a1a1a] text-white rounded-xl cursor-pointer hover:bg-[#ff9d00] shadow-lg border-2 border-white transition-all">
                      {uploadingPhotoId === joueur.id ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, joueur.id)} />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm leading-tight">{joueur.prenom} <br/> {joueur.nom}</h3>
                    <span className="text-[9px] font-black uppercase text-[#ff9d00] italic">{joueur.poste || 'SANS POSTE'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-[2] p-4 bg-gray-50 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#1a1a1a] hover:text-white transition-all">Modifier</button>
                  <button onClick={() => deleteJoueur(joueur.id)} className="flex-1 p-4 bg-gray-50 rounded-2xl text-gray-300 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden not-italic">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black uppercase text-gray-400">Joueur</th>
                  <th className="p-6 text-[10px] font-black uppercase text-gray-400">Poste</th>
                  <th className="p-6 text-[10px] font-black uppercase text-gray-400">N°</th>
                  <th className="p-6 text-[10px] font-black uppercase text-gray-400">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredJoueurs.map((joueur) => (
                  <tr key={joueur.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {joueur.photo_url ? <img src={joueur.photo_url} className="w-full h-full object-cover" /> : <User size={18} className="text-gray-200 mx-auto mt-2" />}
                      </div>
                      <span className="font-bold text-sm uppercase">{joueur.prenom} {joueur.nom}</span>
                    </td>
                    <td className="p-4"><span className="px-3 py-1 bg-[#1a1a1a] text-white text-[9px] font-black rounded-lg uppercase">{joueur.poste}</span></td>
                    <td className="p-4 font-black text-[#ff9d00]">#{joueur.maillot || '--'}</td>
                    <td className="p-4 flex gap-2">
                      <button className="p-2 text-gray-300 hover:text-[#1a1a1a]"><Edit2 size={16}/></button>
                      <button onClick={() => deleteJoueur(joueur.id)} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}