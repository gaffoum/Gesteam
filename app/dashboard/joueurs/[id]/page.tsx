"use client";

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  Award, 
  Activity, 
  Camera, 
  Loader2, 
  Edit2, 
  Save, 
  X,
  ArrowUp,
  ArrowDown,
  AlignCenter,
  Check,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- TYPE DÉFINITION (Optionnel mais propre) ---
type JoueurData = {
  id: string;
  club_id: string;
  nom: string;
  prenom: string;
  poste: string;
  maillot: string;
  email: string;
  telephone: string;
  adresse: string;
  code_postal: string;
  ville: string;
  date_naissance: string;
  licence: string;
  type_licence: string;
  categorie: string;
  photo_url: string;
  photo_pos: string;
};

export default function JoueurDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  // ==================================================================================
  // 1. ÉTATS ET VARIABLES
  // ==================================================================================
  
  // États de chargement et d'interface
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Données du joueur et du club
  const [joueur, setJoueur] = useState<any>(null);
  const [clubName, setClubName] = useState("");
  const [teams, setTeams] = useState<any[]>([]); // Liste des équipes pour le menu déroulant
  
  // Données du formulaire d'édition
  const [formData, setFormData] = useState<any>({});
  
  // Position de la photo (top, center, bottom)
  const [photoPos, setPhotoPos] = useState<string>('center');

  // État de la Modale Personnalisée
  const [modal, setModal] = useState<{ 
    show: boolean; 
    type: 'success' | 'error'; 
    title: string; 
    message: string 
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Référence pour l'input file (upload photo)
  const fileInputRef = useRef<HTMLInputElement>(null);


  // ==================================================================================
  // 2. CHARGEMENT DES DONNÉES
  // ==================================================================================

  useEffect(() => {
    fetchJoueurDetails();
  }, [params.id]);

  const fetchJoueurDetails = async () => {
    try {
      setLoading(true);

      // A. Récupération des infos du joueur
      const { data: player, error } = await supabase
        .from('joueurs')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;

      // Initialisation des états
      setJoueur(player);
      setFormData(player);
      setPhotoPos(player.photo_pos || 'center');

      // B. Récupération des infos liées au club (si le joueur a un club)
      if (player.club_id) {
        
        // 1. Nom du Club
        const { data: club } = await supabase
          .from('clubs')
          .select('nom, nom_usage')
          .eq('id', player.club_id)
          .single();
        
        if (club) {
          setClubName(club.nom_usage || club.nom || "Club Inconnu");
        }

        // 2. Liste des Équipes (pour le menu déroulant Catégorie)
        const { data: teamsData, error: teamsError } = await supabase
          .from('equipes')
          .select('id, nom')
          .eq('club_id', player.club_id)
          .order('nom', { ascending: true });
        
        if (teamsError) {
            console.error("Erreur chargement équipes:", teamsError);
        } else {
            setTeams(teamsData || []);
        }
      }

    } catch (err) {
      console.error("Erreur générale lors du chargement:", err);
    } finally {
      setLoading(false);
    }
  };


  // ==================================================================================
  // 3. LOGIQUE MÉTIER (API, UPLOAD, SAVE)
  // ==================================================================================

  // --- API GOUV : Auto-complétion Ville / CP ---
  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const code = e.target.value;
    
    // Mise à jour immédiate du champ code postal dans le formulaire
    setFormData({ ...formData, code_postal: code });

    // Si on a exactement 5 chiffres, on appelle l'API
    if (code.length === 5 && /^\d+$/.test(code)) {
      try {
        const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${code}&fields=nom&format=json&geometry=centre`);
        const data = await response.json();
        
        if (data && data.length > 0) {
          // On remplit automatiquement la ville avec le premier résultat trouvé
          setFormData((prev: any) => ({ 
            ...prev, 
            ville: data[0].nom, 
            code_postal: code 
          }));
        }
      } catch (err) {
        console.error("Erreur API Geo:", err);
      }
    }
  };

  // --- UPLOAD PHOTO ---
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Génération d'un nom de fichier unique
      const fileExt = file.name.split('.').pop();
      const fileName = `${params.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const BUCKET_NAME = 'photos-joueurs'; // Le nom exact du bucket

      // 1. Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Récupération de l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // 3. Mise à jour de la base de données
      const { error: updateError } = await supabase
        .from('joueurs')
        .update({ photo_url: publicUrl })
        .eq('id', params.id);

      if (updateError) throw updateError;

      // 4. Mise à jour de l'affichage local
      const updatedData = { ...joueur, photo_url: publicUrl };
      setJoueur(updatedData);
      setFormData({ ...formData, photo_url: publicUrl });
      
      // Notification Succès
      setModal({
        show: true,
        type: 'success',
        title: 'PHOTO MISE À JOUR',
        message: 'La nouvelle photo de profil a bien été téléchargée.'
      });

    } catch (error: any) {
      console.error("Erreur upload:", error);
      // Notification Erreur
      setModal({
        show: true,
        type: 'error',
        title: 'ÉCHEC UPLOAD',
        message: error.message || "Vérifiez que le bucket 'photos-joueurs' existe et est public."
      });
    } finally {
      setUploading(false);
    }
  };

  // --- SAUVEGARDE DES MODIFICATIONS ---
  const handleSave = async () => {
    setSaving(true);
    try {
      // Préparation de l'objet de mise à jour
      const updates = {
          nom: formData.nom,
          prenom: formData.prenom,
          poste: formData.poste,
          maillot: formData.maillot,
          email: formData.email,
          telephone: formData.telephone,
          adresse: formData.adresse,
          ville: formData.ville,
          code_postal: formData.code_postal,
          date_naissance: formData.date_naissance,
          licence: formData.licence,
          type_licence: formData.type_licence,
          categorie: formData.categorie,
          photo_pos: photoPos // On n'oublie pas de sauvegarder la position de la photo
      };

      const { error } = await supabase
        .from('joueurs')
        .update(updates)
        .eq('id', params.id);

      if (error) throw error;

      // Mise à jour de l'état local "lecture seule"
      setJoueur({ ...formData, photo_pos: photoPos });
      setIsEditing(false);
      
      // Affichage Modale Succès
      setModal({
        show: true,
        type: 'success',
        title: 'MODIFICATIONS ENREGISTRÉES',
        message: 'La fiche du joueur a été mise à jour avec succès.'
      });

    } catch (error: any) {
      console.error("Erreur sauvegarde:", error);
      // Affichage Modale Erreur
      setModal({
        show: true,
        type: 'error',
        title: 'ERREUR SAUVEGARDE',
        message: error.message || "Une erreur est survenue lors de l'enregistrement."
      });
    } finally {
      setSaving(false);
    }
  };

  // --- ANNULATION ---
  const handleCancel = () => {
    setFormData(joueur); // Restaure les données originales
    setPhotoPos(joueur.photo_pos || 'center'); // Restaure la position originale
    setIsEditing(false); // Quitte le mode édition
  };


  // ==================================================================================
  // 4. RENDU VISUEL (JSX)
  // ==================================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  if (!joueur) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl font-black italic">JOUEUR INTROUVABLE</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      
      {/* ------------------------------------------------ */}
      {/* MODALE PERSONNALISÉE (GesteamPro Light)          */}
      {/* ------------------------------------------------ */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-gray-100 transform scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Icône animée */}
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${modal.type === 'success' ? 'bg-[#ff9d00]/10 text-[#ff9d00]' : 'bg-red-50 text-red-500'}`}>
              {modal.type === 'success' ? <Check size={32} strokeWidth={3} /> : <AlertTriangle size={32} strokeWidth={3} />}
            </div>
            
            {/* Titre et Message */}
            <h3 className="text-xl font-black italic uppercase text-black mb-2 leading-none">
              {modal.title}
            </h3>
            <p className="text-gray-500 text-xs font-bold mb-8 uppercase tracking-wide">
              {modal.message}
            </p>
            
            {/* Bouton Fermer */}
            <button 
              onClick={() => setModal({ ...modal, show: false })}
              className="w-full py-4 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] transition-colors shadow-lg active:scale-95"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        
        {/* ------------------------------------------------ */}
        {/* BARRE DE NAVIGATION & BOUTONS D'ACTION           */}
        {/* ------------------------------------------------ */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            
            {/* Bouton Retour */}
            <Link 
              href="/dashboard/joueurs" 
              className="inline-flex items-center gap-2 px-4 py-3 bg-white rounded-xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-colors font-black text-xs uppercase tracking-widest"
            >
              <ArrowLeft size={16} /> Retour effectif
            </Link>

            {/* Boutons Édition / Sauvegarde */}
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <button 
                          onClick={handleCancel} 
                          className="px-6 py-3 bg-white text-gray-400 rounded-xl font-black text-xs uppercase tracking-widest hover:text-red-500 shadow-sm transition-colors flex items-center gap-2"
                        >
                            <X size={16}/> Annuler
                        </button>
                        <button 
                          onClick={handleSave} 
                          disabled={saving} 
                          className="px-6 py-3 bg-[#ff9d00] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-black shadow-lg transition-colors flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Enregistrer
                        </button>
                    </>
                ) : (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="px-6 py-3 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#ff9d00] shadow-lg transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16}/> Modifier Fiche
                    </button>
                )}
            </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* CARTE PRINCIPALE NOIRE (Info Header)             */}
        {/* ------------------------------------------------ */}
        <div className="bg-[#1a1a1a] text-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-800 relative overflow-hidden mb-8">
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            
            {/* --- 1. ZONE PHOTO (AVEC OUTILS D'ALIGNEMENT) --- */}
            <div className="flex flex-col items-center gap-3">
              
              {/* Conteneur relatif pour positionner le bouton caméra */}
              <div className="relative group shrink-0">
                  <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-[6px] border-[#ff9d00] shadow-2xl overflow-hidden bg-gray-800 flex items-center justify-center relative z-10">
                    {joueur.photo_url ? (
                      <img 
                        src={joueur.photo_url} 
                        alt="Profil" 
                        className="w-full h-full object-cover transition-all duration-300"
                        style={{ objectPosition: photoPos }} // Application du positionnement
                      />
                    ) : (
                      <User size={64} className="text-gray-500" />
                    )}
                    
                    {/* Loader upload */}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <Loader2 className="animate-spin text-white" size={32} />
                      </div>
                    )}
                  </div>

                  {/* Bouton Caméra (Upload) : Positionné en bas à droite du cercle */}
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={uploading} 
                    className="absolute bottom-2 right-2 p-3 bg-white text-black rounded-full hover:bg-[#ff9d00] hover:text-white transition-all shadow-lg active:scale-95 z-30 group-hover:scale-110 border-2 border-[#1a1a1a]"
                    title="Changer la photo"
                  >
                    <Camera size={20} />
                  </button>
              </div>
              
              {/* Outils Alignement (Visibles uniquement en mode édition) */}
              {isEditing && (
                  <div className="flex gap-2 bg-white/10 p-1.5 rounded-full backdrop-blur-sm border border-white/10">
                      <button 
                        onClick={() => setPhotoPos('top')} 
                        className={`p-2 rounded-full transition-colors ${photoPos === 'top' ? 'bg-[#ff9d00] text-black' : 'hover:bg-white/20 text-white'}`} 
                        title="Aligner en haut"
                      >
                          <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => setPhotoPos('center')} 
                        className={`p-2 rounded-full transition-colors ${photoPos === 'center' ? 'bg-[#ff9d00] text-black' : 'hover:bg-white/20 text-white'}`} 
                        title="Centrer"
                      >
                          <AlignCenter size={14} />
                      </button>
                      <button 
                        onClick={() => setPhotoPos('bottom')} 
                        className={`p-2 rounded-full transition-colors ${photoPos === 'bottom' ? 'bg-[#ff9d00] text-black' : 'hover:bg-white/20 text-white'}`} 
                        title="Aligner en bas"
                      >
                          <ArrowDown size={14} />
                      </button>
                  </div>
              )}
              
              {/* Input fichier caché */}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handlePhotoUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            {/* --- 2. INFORMATIONS PRINCIPALES --- */}
            <div className="text-center md:text-left flex-1 w-full space-y-2">
              
              {/* NOM / PRÉNOM */}
              <div className="mb-2">
                 {isEditing ? (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="flex flex-col text-left">
                            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1">Prénom</label>
                            <input 
                                type="text" 
                                value={formData.prenom || ''} 
                                onChange={e => setFormData({...formData, prenom: e.target.value})}
                                className="w-full bg-white/10 border border-white/20 text-white font-bold p-3 rounded-xl focus:border-[#ff9d00] outline-none text-lg placeholder-white/30"
                                placeholder="PRÉNOM"
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1">Nom</label>
                            <input 
                                type="text" 
                                value={formData.nom || ''} 
                                onChange={e => setFormData({...formData, nom: e.target.value.toUpperCase()})}
                                className="w-full bg-white/10 border border-white/20 text-white font-black uppercase p-3 rounded-xl focus:border-[#ff9d00] outline-none text-lg placeholder-white/30"
                                placeholder="NOM"
                            />
                        </div>
                    </div>
                 ) : (
                    <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                        {joueur.prenom} <span className="text-[#ff9d00]">{joueur.nom}</span>
                    </h1>
                 )}
              </div>

              {/* CATÉGORIE (MENU DÉROULANT) & CLUB */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  
                  {/* Menu Déroulant Catégorie */}
                  {isEditing ? (
                      <div className="flex-1 max-w-xs text-left">
                          <label className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Catégorie (Équipe)</label>
                          <select 
                            value={formData.categorie || ''} 
                            onChange={e => setFormData({...formData, categorie: e.target.value})}
                            className="bg-white/10 border border-white/20 text-white text-sm font-bold uppercase w-full rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#ff9d00] outline-none cursor-pointer appearance-none"
                            style={{ backgroundImage: 'none' }} 
                          >
                            <option value="" className="text-black">-- Choisir une équipe --</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.nom} className="text-black">
                                {team.nom}
                              </option>
                            ))}
                            {/* Option de secours si la valeur actuelle n'est pas dans la liste */}
                            {formData.categorie && !teams.some(t => t.nom === formData.categorie) && (
                                <option value={formData.categorie} className="text-black">{formData.categorie} (Actuel)</option>
                            )}
                          </select>
                      </div>
                  ) : (
                    <h2 className="text-2xl md:text-3xl font-black uppercase text-gray-400 tracking-tight">
                        {joueur.categorie || 'SANS CATÉGORIE'}
                    </h2>
                  )}

                  {/* Badge Club */}
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/10 rounded-full h-fit self-end mb-1">
                    <Shield size={12} className="text-[#ff9d00]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                      {clubName}
                    </span>
                  </div>
              </div>

              {/* POSTE & MAILLOT */}
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                 {isEditing ? (
                    <>
                        <div className="flex flex-col text-left">
                            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1">Poste</label>
                            <input 
                                type="text" 
                                value={formData.poste || ''} 
                                onChange={e => setFormData({...formData, poste: e.target.value.toUpperCase()})}
                                className="bg-white/10 border border-white/20 text-white text-xs font-bold uppercase px-3 py-2 rounded-lg w-32 focus:border-[#ff9d00] outline-none"
                                placeholder="POSTE"
                            />
                        </div>
                        <div className="flex flex-col text-left">
                            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1">N° Maillot</label>
                            <input 
                                type="number" 
                                value={formData.maillot || ''} 
                                onChange={e => setFormData({...formData, maillot: e.target.value})}
                                className="bg-white/10 border border-white/20 text-white text-xs font-bold px-3 py-2 rounded-lg w-20 focus:border-[#ff9d00] outline-none"
                                placeholder="10"
                            />
                        </div>
                    </>
                 ) : (
                    <>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                            <Activity size={14} className="text-[#ff9d00]" /> 
                            {joueur.poste || 'POSTE NON DÉFINI'}
                        </div>
                        {joueur.maillot && (
                            <div className="flex items-center gap-2 text-[10px] font-black text-black uppercase bg-white px-4 py-3 rounded-xl shadow-md">
                                N° {joueur.maillot}
                            </div>
                        )}
                    </>
                 )}
              </div>
            </div>

            {/* --- 3. BADGE STATUT LICENCE (DROITE) --- */}
            <div className="hidden md:flex flex-col items-center justify-center w-32 h-32 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
               <span className="text-[9px] font-black text-gray-500 uppercase mb-2 tracking-widest">LICENCE</span>
               <span className={`text-xl font-black italic ${joueur.licence ? 'text-green-400' : 'text-red-400'}`}>
                 {joueur.licence ? 'ACTIVE' : 'INACTIVE'}
               </span>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------ */}
        {/* GRILLE DÉTAILS INFÉRIEURE (Blanche)              */}
        {/* ------------------------------------------------ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* --- BLOC 1 : COORDONNÉES --- */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#ff9d00]/30 transition-colors">
            <h3 className="text-lg font-black uppercase italic mb-8 flex items-center gap-3">
              <span className="w-3 h-3 bg-[#ff9d00] rounded-full"></span> Coordonnées
            </h3>
            
            <div className="space-y-6">
              {/* EMAIL */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                  <Mail size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Email</p>
                  {isEditing ? (
                      <input 
                        type="email" 
                        value={formData.email || ''} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-[#ff9d00] outline-none"
                      />
                  ) : (
                      <p className="text-sm font-bold text-black truncate">{joueur.email || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              {/* TÉLÉPHONE */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                  <Phone size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Téléphone</p>
                  {isEditing ? (
                      <input 
                        type="tel" 
                        value={formData.telephone || ''} 
                        onChange={e => setFormData({...formData, telephone: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold focus:ring-2 focus:ring-[#ff9d00] outline-none"
                      />
                  ) : (
                      <p className="text-sm font-bold text-black">{joueur.telephone || 'Non renseigné'}</p>
                  )}
                </div>
              </div>

              {/* ADRESSE (AVEC AUTO-COMPLÉTION) */}
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0 mt-1">
                  <MapPin size={20} />
                </div>
                <div className="flex-1 space-y-3">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Adresse</p>
                  {isEditing ? (
                      <>
                        <input 
                            type="text" 
                            placeholder="Rue" 
                            value={formData.adresse || ''} 
                            onChange={e => setFormData({...formData, adresse: e.target.value})}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold mb-2 outline-none focus:border-[#ff9d00]"
                        />
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="CP" 
                                value={formData.code_postal || ''} 
                                onChange={handleZipCodeChange} 
                                className="w-1/3 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#ff9d00]"
                            />
                            <input 
                                type="text" 
                                placeholder="Ville" 
                                value={formData.ville || ''} 
                                onChange={e => setFormData({...formData, ville: e.target.value})}
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:border-[#ff9d00]"
                            />
                        </div>
                      </>
                  ) : (
                      <p className="text-sm font-bold text-black uppercase leading-tight">
                        {joueur.adresse ? `${joueur.adresse}, ${joueur.code_postal} ${joueur.ville}` : 'Non renseignée'}
                      </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* --- BLOC 2 : INFOS ATHLÈTE --- */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-black/30 transition-colors">
            <h3 className="text-lg font-black uppercase italic mb-8 flex items-center gap-3">
              <span className="w-3 h-3 bg-black rounded-full"></span> Infos Athlète
            </h3>

            <div className="space-y-6">
              {/* DATE DE NAISSANCE */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                  <Calendar size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Date de naissance</p>
                  {isEditing ? (
                      <input 
                        type="date" 
                        value={formData.date_naissance || ''} 
                        onChange={e => setFormData({...formData, date_naissance: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]"
                      />
                  ) : (
                      <p className="text-sm font-bold text-black">
                        {joueur.date_naissance ? format(new Date(joueur.date_naissance), 'dd MMMM yyyy', { locale: fr }) : 'Inconnue'}
                      </p>
                  )}
                </div>
              </div>

              {/* LICENCE NUMÉRO */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                  <Award size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Numéro Licence</p>
                  {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.licence || ''} 
                        onChange={e => setFormData({...formData, licence: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]"
                      />
                  ) : (
                      <p className="text-sm font-bold text-black">{joueur.licence || 'Non renseignée'}</p>
                  )}
                </div>
              </div>
              
              {/* TYPE LICENCE */}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0">
                  <Shield size={20} />
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Type Licence</p>
                  {isEditing ? (
                      <select 
                        value={formData.type_licence || 'Libre'} 
                        onChange={e => setFormData({...formData, type_licence: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]"
                      >
                          <option value="Libre">Libre</option>
                          <option value="Mutation">Mutation</option>
                          <option value="Détection">Détection</option>
                      </select>
                  ) : (
                      <p className="text-sm font-bold text-black uppercase">{joueur.type_licence || 'Standard'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}