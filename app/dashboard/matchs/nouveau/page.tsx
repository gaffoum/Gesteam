"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Save, Loader2, Calendar, 
  MapPin, Users, Trophy, ChevronDown, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
// Import de la modale
import AlertModal from '@/app/components/AlertModal';

export default function NewMatchPage() {
  const router = useRouter();
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(true);
  
  // Données
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [adversairesList, setAdversairesList] = useState<any[]>([]);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    equipe_id: '',
    adversaire: '',
    date: '',
    heure: '',
    lieu: 'Domicile',
    type: 'Championnat'
  });

  const [manualInput, setManualInput] = useState(false);

  // --- GESTION DE LA MODALE ---
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: 'error' | 'success';
    title: string;
    message: string;
  }>({ isOpen: false, type: 'success', title: '', message: '' });

  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  // 1. Charger les équipes
  useEffect(() => {
    const fetchMyTeams = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        // IMPORTANT : On récupère aussi le club_id dans l'objet équipe pour l'insertion future
        const { data: teams } = await supabase
          .from('equipes')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('categorie', { ascending: true });
        
        if (teams) {
          setMyTeams(teams);
          if (teams.length > 0) {
            setFormData(prev => ({ ...prev, equipe_id: teams[0].id }));
          }
        }
      }
      setLoadingTeams(false);
    };

    fetchMyTeams();
  }, []);

  // 2. Charger les adversaires
  useEffect(() => {
    const fetchAdversaires = async () => {
      if (!formData.equipe_id) return;
      
      const { data } = await supabase
        .from('adversaires')
        .select('*')
        .eq('mon_equipe_id', formData.equipe_id)
        .order('nom', { ascending: true });

      if (data && data.length > 0) {
        setAdversairesList(data);
        setManualInput(false); 
      } else {
        setAdversairesList([]);
        setManualInput(true);
      }
    };

    fetchAdversaires();
  }, [formData.equipe_id]);

  // --- SOUMISSION ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée, veuillez vous reconnecter.");

      // Vérification des données
      const selectedTeam = myTeams.find(t => t.id === formData.equipe_id);
      if (!selectedTeam) throw new Error("Équipe sélectionnée invalide.");
      if (!selectedTeam.club_id) throw new Error("Club ID introuvable pour cette équipe.");
      if (!formData.adversaire) throw new Error("Veuillez renseigner un adversaire.");

      const dateHeure = `${formData.date}T${formData.heure}:00`;

      // Insertion
      const { error } = await supabase.from('matchs').insert({
        club_id: selectedTeam.club_id,
        equipe_id: formData.equipe_id,
        adversaire: formData.adversaire.toUpperCase(),
        date_heure: dateHeure,
        lieu: formData.lieu,
        type: formData.type,
        statut: 'programme',
        created_by: session.user.id
      });

      if (error) {
        // On affiche le message précis de la base de données
        throw new Error(error.message); 
      }

      // Succès
      setModalState({
        isOpen: true,
        type: 'success',
        title: 'Match Planifié',
        message: `La rencontre contre ${formData.adversaire} a été ajoutée au calendrier.`
      });
      
      // On redirige après un court délai ou au clic sur la modale
      setTimeout(() => {
        router.push('/dashboard/matchs');
        router.refresh();
      }, 2000);

    } catch (error: any) {
      console.error(error);
      setModalState({
        isOpen: true,
        type: 'error',
        title: 'Erreur Création',
        message: error.message || "Impossible de créer le match. Vérifiez votre connexion."
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingTeams) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <>
      <AlertModal 
        isOpen={modalState.isOpen} 
        onClose={closeModal} 
        type={modalState.type} 
        title={modalState.title} 
        message={modalState.message} 
      />

      <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans italic text-[#1a1a1a]">
        <div className="max-w-2xl mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              NOUVEAU <span className="text-[#ff9d00]">MATCH</span>
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 space-y-8">
            
            {/* 1. SÉLECTION ÉQUIPE */}
            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Votre Équipe</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <select 
                  value={formData.equipe_id}
                  onChange={(e) => setFormData({...formData, equipe_id: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00] appearance-none cursor-pointer"
                >
                  {myTeams.map(team => (
                    <option key={team.id} value={team.id}>{team.categorie} - {team.nom}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18}/>
              </div>
            </div>

            {/* 2. ADVERSAIRE */}
            <div>
              <div className="flex justify-between items-center mb-2 ml-2">
                 <label className="text-[10px] font-black uppercase text-gray-400">Adversaire</label>
                 <button 
                   type="button"
                   onClick={() => {
                     setManualInput(!manualInput);
                     setFormData({...formData, adversaire: ''});
                   }}
                   className="text-[9px] font-bold text-[#ff9d00] flex items-center gap-1 hover:underline"
                 >
                   <RefreshCw size={10} />
                   {manualInput && adversairesList.length > 0 ? "CHOISIR DANS LA LISTE" : "SAISIE MANUELLE (AMICAL/COUPE)"}
                 </button>
              </div>

              <div className="relative">
                <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                {!manualInput && adversairesList.length > 0 ? (
                  <div className="relative">
                    <select 
                      value={formData.adversaire}
                      onChange={(e) => setFormData({...formData, adversaire: e.target.value})}
                      required
                      className="w-full bg-white border-2 border-[#ff9d00]/20 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00] appearance-none cursor-pointer text-black"
                    >
                      <option value="">-- SÉLECTIONNER UN CLUB --</option>
                      {adversairesList.map((adv) => (
                        <option key={adv.id} value={adv.nom}>{adv.nom}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18}/>
                  </div>
                ) : (
                  <input 
                    type="text" 
                    required
                    placeholder="NOM DU CLUB ADVERSE"
                    value={formData.adversaire}
                    onChange={(e) => setFormData({...formData, adversaire: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00]"
                  />
                )}
              </div>
            </div>

            {/* 3. DATE & HEURE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Heure</label>
                <div className="relative">
                   <input 
                    type="time" 
                    required
                    value={formData.heure}
                    onChange={(e) => setFormData({...formData, heure: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-[#ff9d00]"
                  />
                </div>
              </div>
            </div>

            {/* 4. LIEU & TYPE */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Lieu</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <select 
                    value={formData.lieu}
                    onChange={(e) => setFormData({...formData, lieu: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00] appearance-none"
                  >
                    <option value="Domicile">Domicile</option>
                    <option value="Exterieur">Extérieur</option>
                    <option value="Neutre">Terrain Neutre</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18}/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 mb-2 ml-2">Type</label>
                <div className="relative">
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:ring-2 focus:ring-[#ff9d00] appearance-none"
                  >
                    <option value="Championnat">Championnat</option>
                    <option value="Coupe">Coupe</option>
                    <option value="Amical">Amical</option>
                    <option value="Tournoi">Tournoi</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18}/>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />}
              {loading ? "Création..." : "Planifier le match"}
            </button>

          </form>
        </div>
      </div>
    </>
  );
}