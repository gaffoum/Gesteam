"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Loader2, User, MapPin, Phone, Shield, 
  CheckCircle2, AlertTriangle, Check, Lock, 
  Trophy, Mail 
} from 'lucide-react';

export default function RegisterCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // --- ÉTATS ---
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [availableTeams, setAvailableTeams] = useState<any[]>([]);
  
  // Champs du formulaire
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Infos personnelles
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    ville: '',
    code_postal: '',
    telephone: ''
  });
  
  // Sélection multiple des équipes (Tableau d'IDs pour les coachs)
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  // --- 1. DÉCODAGE DU TOKEN & CHARGEMENT ---
  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Décodage du token (Base64) envoyé depuis la page Staff
        const jsonPayload = atob(token);
        const data = JSON.parse(jsonPayload);
        setInviteData(data);

        // Si c'est un coach (superuser), on charge les équipes du club pour le choix multiple
        if (data.role === 'superuser' && data.clubId) {
          const { data: teams } = await supabase
            .from('equipes')
            .select('id, categorie, nom')
            .eq('club_id', data.clubId)
            .order('categorie', { ascending: true });
            
          if (teams) setAvailableTeams(teams);
        }
      } catch (err) {
        console.error("Token invalide", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [token]);

  // --- GESTION DE LA SÉLECTION D'ÉQUIPES ---
  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId) // On retire si déjà présent
        : [...prev, teamId] // On ajoute sinon
    );
  };

  // --- SOUMISSION DU FORMULAIRE ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!inviteData?.clubId) throw new Error("Données du club manquantes dans l'invitation.");

      // 1. Création du compte Auth (Supabase Auth)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: formData.nom,
            prenom: formData.prenom,
            role: inviteData.role, // 'superuser' (Coach) ou 'player' (Joueur)
          }
        }
      });

      if (authError) throw authError;
      
      // Si l'inscription Auth a fonctionné
      if (authData.user) {
          
          // 2. CRÉATION DU PROFIL (Table 'profiles')
          // Utilisation de upsert pour éviter les conflits si le trigger a déjà créé une ligne vide
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              email: email,
              nom: formData.nom,
              prenom: formData.prenom,
              adresse: formData.adresse,
              ville: formData.ville,
              code_postal: formData.code_postal,
              telephone: formData.telephone,
              role: inviteData.role,
              club_id: inviteData.clubId
            });

          if (profileError) {
             console.error("Erreur Profil:", profileError);
             throw new Error(`Erreur lors de la création du profil : ${profileError.message}`);
          }

          // 3. LOGIQUE SPÉCIFIQUE : JOUEUR
          if (inviteData.role === 'player') {
             // On crée la fiche dans la table 'joueurs'
             const { error: playerError } = await supabase
               .from('joueurs')
               .insert({
                 user_id: authData.user.id,
                 club_id: inviteData.clubId,
                 nom: formData.nom,
                 prenom: formData.prenom,
                 email: email,
                 telephone: formData.telephone,
                 adresse: formData.adresse,
                 ville: formData.ville,
                 code_postal: formData.code_postal
               });
             
             if (playerError) console.error("Attention: Erreur création fiche joueur", playerError);
          }

          // 4. LOGIQUE SPÉCIFIQUE : COACH (SUPERUSER)
          if (inviteData.role === 'superuser' && selectedTeams.length > 0) {
            const teamInserts = selectedTeams.map(teamId => ({
              coach_id: authData.user!.id,
              equipe_id: teamId
            }));

            const { error: teamError } = await supabase
              .from('coach_teams')
              .insert(teamInserts);

            if (teamError) {
               console.error("Erreur Equipes:", teamError);
               // On ne bloque pas l'inscription pour ça, mais on log l'erreur
            }
          }

          // 5. Succès -> Redirection
          alert(`Compte ${inviteData.role === 'superuser' ? 'COACH' : 'JOUEUR'} créé avec succès ! Bienvenue.`);
          router.push('/dashboard');
      } else {
          // Cas rare où 'Confirm Email' est activé sur Supabase
          alert("Compte créé ! Veuillez vérifier vos emails pour valider l'inscription.");
      }

    } catch (error: any) {
      console.error(error);
      alert(error.message || "Une erreur technique est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  // --- RENDU : CHARGEMENT ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  // --- RENDU : ERREUR TOKEN ---
  if (!inviteData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] text-center p-6">
        <AlertTriangle size={64} className="text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase">Lien Invalide</h1>
        <p className="text-gray-500 mt-2">Ce lien d'invitation est invalide ou a expiré.</p>
      </div>
    );
  }

  // --- RENDU : FORMULAIRE PRINCIPAL ---
  return (
    <div className="min-h-screen bg-[#f9fafb] py-12 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
      <div className="w-full max-w-3xl bg-white rounded-[3rem] p-8 md:p-12 shadow-xl border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* EN-TÊTE */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tighter text-black leading-none">
            FINALISER L'<span className="text-[#ff9d00]">INSCRIPTION</span>
          </h2>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">RÔLE ATTRIBUÉ :</span>
            <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1
              ${inviteData.role === 'superuser' ? 'text-[#ff9d00]' : 'text-black'}
            `}>
              {inviteData.role === 'superuser' ? <Shield size={12}/> : <User size={12}/>}
              {inviteData.role === 'superuser' ? 'COACH (ADMIN)' : 'JOUEUR'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          
          {/* SECTION 1 : IDENTIFIANTS */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-gray-300 tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
              <Lock size={14}/> 1. Connexion
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Email</label>
                <div className="relative">
                   <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} 
                     className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-[#ff9d00] focus:border-[#ff9d00] outline-none transition-all" placeholder="votre@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Mot de passe</label>
                <div className="relative">
                   <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                   <input required type="password" value={password} onChange={e => setPassword(e.target.value)} 
                     className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold focus:ring-2 focus:ring-[#ff9d00] focus:border-[#ff9d00] outline-none transition-all" placeholder="••••••••" />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2 : INFORMATIONS PERSONNELLES */}
          <div className="space-y-6">
            <h3 className="text-xs font-black uppercase text-gray-300 tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
              <User size={14}/> 2. Informations Personnelles
            </h3>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Nom</label>
                <input required type="text" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00]" placeholder="DURAND" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Prénom</label>
                <input required type="text" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00]" placeholder="Pierre" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Adresse</label>
              <div className="relative">
                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input required type="text" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]" placeholder="123 Rue du Stade" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Ville</label>
                <input required type="text" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00]" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Code Postal</label>
                <input required type="text" value={formData.code_postal} onChange={e => setFormData({...formData, code_postal: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Téléphone</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
                <input required type="tel" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} 
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]" placeholder="06 12 34 56 78" />
              </div>
            </div>
          </div>

          {/* SECTION 3 : ÉQUIPES (UNIQUEMENT SI COACH) */}
          {inviteData.role === 'superuser' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-xs font-black uppercase text-gray-300 tracking-[0.2em] border-b border-gray-100 pb-2 flex items-center gap-2">
                <Trophy size={14}/> 3. Équipes entraînées (Choix Multiple)
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableTeams.length > 0 ? availableTeams.map((team) => {
                  const isSelected = selectedTeams.includes(team.id);
                  return (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => toggleTeam(team.id)}
                      className={`
                        relative p-4 rounded-2xl border-2 text-left transition-all group
                        ${isSelected 
                          ? 'border-[#ff9d00] bg-[#ff9d00] text-white shadow-lg scale-[1.02]' 
                          : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'}
                      `}
                    >
                      <div className={`text-xs font-black uppercase ${isSelected ? 'text-white' : 'text-black'}`}>{team.categorie}</div>
                      <div className={`text-[9px] font-bold truncate ${isSelected ? 'text-white/80' : 'text-gray-300'}`}>{team.nom}</div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 text-white">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                    </button>
                  );
                }) : (
                  <p className="col-span-3 text-xs text-gray-400 italic">Aucune équipe disponible dans ce club.</p>
                )}
              </div>
              <p className="text-[10px] text-gray-400 italic font-bold ml-1">* Sélectionnez toutes les équipes dont vous aurez la charge.</p>
            </div>
          )}

          {/* BOUTON VALIDATION */}
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-black text-white py-6 rounded-2xl font-black text-xs tracking-[0.2em] shadow-xl hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-2 uppercase disabled:opacity-50 mt-8 group"
          >
            {submitting ? <Loader2 className="animate-spin" /> : <Check size={18} className="group-hover:scale-110 transition-transform"/>}
            {submitting ? "Création du compte..." : "Confirmer mon inscription"}
          </button>

        </form>
      </div>
    </div>
  );
}