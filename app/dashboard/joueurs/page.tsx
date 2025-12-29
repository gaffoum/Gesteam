"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Search, 
  ArrowLeft, 
  Loader2, 
  Trash2, 
  Edit2,
  Filter,
  User,
  Download,
  Upload,
  ChevronDown
} from 'lucide-react';
import Link from 'next/link';

export default function PlayersListPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [joueurs, setJoueurs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPoste, setSelectedPoste] = useState('');

  useEffect(() => {
    fetchJoueurs();
  }, []);

  const fetchJoueurs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
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

  const deleteJoueur = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce joueur ?")) return;
    
    const { error } = await supabase.from('joueurs').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchJoueurs();
  };

  // Logique pour télécharger le modèle CSV
  const downloadTemplate = () => {
    const csvContent = "nom,prenom,poste,maillot,telephone,categorie,licence,email,date_naissance,equipe_concernee\nDOE,John,Attaquant,9,0601020304,U19,12345678,john@example.com,2005-01-01,Equipe A";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modele_import_joueurs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // Logique de filtrage combinée
  const filteredJoueurs = joueurs.filter(j => {
    const matchesName = `${j.prenom} ${j.nom}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPoste = selectedPoste === '' || j.poste === selectedPoste;
    return matchesName && matchesPoste;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
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
            <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em] ml-10">Gestion des licences et profils</p>
          </div>

          <Link 
            href="/dashboard/joueurs/nouveau"
            className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <Plus size={18} /> Ajouter un joueur
          </Link>
        </div>

        {/* SECTION AJOUTÉE : BOUTONS IMPORT/EXPORT */}
        <div className="flex flex-wrap gap-4 mb-8 ml-10 not-italic">
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:border-[#ff9d00] hover:text-[#ff9d00] transition-all shadow-sm"
          >
            <Download size={14} /> Télécharger Modèle d'import
          </button>
          
          <button 
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase text-gray-500 hover:border-[#ff9d00] hover:text-[#ff9d00] transition-all shadow-sm"
          >
            <Upload size={14} /> Importer fichier de joueurs
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv" 
            onChange={(e) => alert('Fichier prêt pour le traitement.')}
          />
        </div>

        {/* Barre de recherche et Filtre par Poste */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 not-italic">
          <div className="relative flex-[2]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher par nom ou prénom..." 
              className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/20 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative flex-1">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <select 
              className="w-full p-4 pl-12 rounded-xl bg-gray-50 border-none outline-none font-bold text-sm appearance-none cursor-pointer focus:ring-2 ring-[#ff9d00]/20 transition-all"
              onChange={(e) => setSelectedPoste(e.target.value)}
              value={selectedPoste}
            >
              <option value="">Tous les postes</option>
              <option value="Gardien">Gardiens</option>
              <option value="Défenseur">Défenseurs</option>
              <option value="Milieu">Milieux</option>
              <option value="Attaquant">Attaquants</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Liste des joueurs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 not-italic">
          {filteredJoueurs.map((joueur) => (
            <div key={joueur.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#ff9d00] transition-all group relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-[1.5rem] flex items-center justify-center text-gray-300 group-hover:bg-[#ff9d00]/10 group-hover:text-[#ff9d00] transition-all">
                  {joueur.photo_url ? (
                    <img src={joueur.photo_url} alt="" className="w-full h-full object-cover rounded-[1.5rem]" />
                  ) : (
                    <User size={30} />
                  )}
                </div>
                <div>
                  <h3 className="font-black uppercase text-sm text-[#1a1a1a] leading-tight">
                    {joueur.prenom} <br /> {joueur.nom}
                  </h3>
                  <span className="inline-block mt-1 px-3 py-1 bg-[#1a1a1a] rounded-full text-[9px] font-black uppercase text-white italic">
                    {joueur.poste || 'Non défini'}
                  </span>
                </div>
                {joueur.maillot && (
                  <div className="absolute top-6 right-6 text-4xl font-black text-gray-50 opacity-10 group-hover:opacity-100 group-hover:text-[#ff9d00]/20 transition-all">
                    #{joueur.maillot}
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">Catégorie</span>
                  <span className="text-[#1a1a1a]">{joueur.categorie || '-'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">Licence</span>
                  <span className="text-[#1a1a1a]">{joueur.licence || '-'}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-gray-400">Équipe</span>
                  <span className="text-[#ff9d00]">{joueur.equipe_concernee || '-'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-all">
                  <Edit2 size={16} className="mx-auto" />
                </button>
                <button 
                  onClick={() => deleteJoueur(joueur.id)}
                  className="flex-1 p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                >
                  <Trash2 size={16} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredJoueurs.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-gray-200">
            <Users size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-black uppercase text-xs tracking-widest">
              Aucun joueur ne correspond à votre recherche
            </p>
          </div>
        )}
      </div>
    </div>
  );
}