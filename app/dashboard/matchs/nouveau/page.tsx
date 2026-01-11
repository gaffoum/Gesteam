"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  ChevronRight, 
  Loader2, 
  Shield,
  Clock,
  Trophy,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function NewMatchPage() {
  const router = useRouter();
  
  // --- ÉTATS DE CHARGEMENT ---
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- DONNÉES ---
  const [myTeams, setMyTeams] = useState<any[]>([]);
  const [poolOpponents, setPoolOpponents] = useState<string[]>([]); // Liste issue du scraping
  
  // --- FORMULAIRE ---
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [adversaire, setAdversaire] = useState("");
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("");
  const [lieu, setLieu] = useState("Domicile"); // Domicile / Extérieur / Neutre
  const [typeMatch, setTypeMatch] = useState("Championnat"); // Championnat / Amical / Coupe

  // État pour l'autocomplétion (Adversaire)
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- 1. CHARGEMENT INITIAL ---
  useEffect(() => {
    fetchMyTeams();
  }, []);

  const fetchMyTeams = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // On récupère l'équipe ET le classement_data pour avoir la liste des adversaires
        const { data, error } = await supabase
          .from('equipes')
          .select('id, nom, categorie, classement_data')
          .order('categorie', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          setMyTeams(data);
          // Sélection par défaut de la première équipe
          setSelectedTeamId(data[0].id);
          extractOpponents(data[0]); 
        }
    } catch (err) {
        console.error("Erreur chargement équipes:", err);
    }
  };

  // --- 2. GESTION DE LA LISTE ADVERSAIRES (Poule) ---
  useEffect(() => {
    if (selectedTeamId) {
      const team = myTeams.find(t => t.id === selectedTeamId);
      if (team) extractOpponents(team);
    }
  }, [selectedTeamId]);

  const extractOpponents = (team: any) => {
    // Si on a des données de classement (scrapées), on remplit la liste
    if (team.classement_data && Array.isArray(team.classement_data)) {
      const ops = team.classement_data
        .map((row: any) => row.nom || row.nom_equipe) // Gère les deux formats possibles
        .filter((name: string) => name && name.toUpperCase().trim() !== team.nom.toUpperCase().trim());
      
      setPoolOpponents(ops);
    } else {
      setPoolOpponents([]);
    }
  };

  // --- 3. SOUMISSION & REDIRECTION ---
  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedTeamId || !adversaire || !date) {
        setErrorMsg("Veuillez remplir tous les champs obligatoires.");
        return;
    }

    setLoading(true);

    try {
      // 1. Récupération Session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Vous n'êtes pas connecté.");
      
      // 2. Récupération Profil (CORRECTION ERREUR CLUB_ID)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile) {
          throw new Error("Impossible de récupérer votre profil club.");
      }

      // 3. CRÉATION DU MATCH EN BASE
      const { data: match, error: matchError } = await supabase
        .from('matchs')
        .insert({
          club_id: profile.club_id, // Ici profile est garanti non-null
          equipe_id: selectedTeamId,
          adversaire: adversaire,
          date_heure: `${date}T${heure || '00:00'}:00`,
          lieu: lieu,
          type: typeMatch,
          statut: 'programme', // Statut par défaut
          score_home: 0,
          score_away: 0
        })
        .select()
        .single();

      if (matchError) throw matchError;

      // 4. REDIRECTION VERS L'ÉTAPE 2 : SÉLECTION DES JOUEURS
      router.push(`/dashboard/matchs/${match.id}/selection`);

    } catch (err: any) {
      console.error("Erreur création match:", err);
      setErrorMsg(err.message || "Une erreur est survenue lors de la création.");
      setLoading(false); // On arrête le chargement seulement si erreur
    }
  };

  // Filtrage pour l'autocomplétion
  const filteredSuggestions = poolOpponents.filter(op => 
    op.toLowerCase().includes(adversaire.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard/matchs" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter">NOUVEAU MATCH</h1>
             <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">Étape 1/3 : Infos & Adversaire</p>
          </div>
        </div>

        {/* AFFICHAGE ERREUR */}
        {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                <AlertTriangle size={18} />
                {errorMsg}
            </div>
        )}

        <form onSubmit={handleNextStep} className="space-y-6">
          
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            
            {/* SÉLECTION ÉQUIPE */}
            <div className="mb-8">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                Mon Équipe
              </label>
              <div className="relative">
                <select 
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold uppercase appearance-none outline-none focus:border-[#ff9d00] transition-colors cursor-pointer"
                >
                  {myTeams.map(t => (
                    <option key={t.id} value={t.id}>
                       {t.nom === t.categorie ? t.nom : `${t.categorie} - ${t.nom}`}
                    </option>
                  ))}
                </select>
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                
                {/* --- CHAMP ADVERSAIRE (HYBRIDE) --- */}
                <div className="relative z-20">
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                     Adversaire
                   </label>
                   <div className="relative">
                      <input 
                        type="text" 
                        value={adversaire}
                        onChange={(e) => { setAdversaire(e.target.value); setShowSuggestions(true); }}
                        onFocus={() => setShowSuggestions(true)}
                        // Petit délai pour permettre le clic sur la suggestion avant que le champ perde le focus
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        placeholder="Sélectionner ou saisir..."
                        className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-[#ff9d00] transition-colors placeholder:font-medium placeholder:normal-case"
                        required
                        autoComplete="off"
                      />
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                      
                      {/* MENU DÉROULANT DES SUGGESTIONS */}
                      {showSuggestions && filteredSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {filteredSuggestions.map((op, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => { setAdversaire(op); setShowSuggestions(false); }}
                                  className="p-3 px-4 hover:bg-[#ff9d00]/10 hover:text-[#ff9d00] cursor-pointer text-xs font-bold uppercase transition-colors border-b border-gray-50 last:border-0"
                                >
                                    {op}
                                </div>
                            ))}
                        </div>
                      )}
                   </div>
                   {/* Indication visuelle si suggestions disponibles */}
                   {poolOpponents.length > 0 && (
                      <p className="text-[9px] text-gray-300 mt-2 pl-2 italic flex items-center gap-1">
                        <Trophy size={10} /> {poolOpponents.length} équipes détectées
                      </p>
                   )}
                </div>

                {/* TYPE DE MATCH */}
                <div>
                   <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                     Type de Match
                   </label>
                   <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                      {['Championnat', 'Amical', 'Coupe'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setTypeMatch(type)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${typeMatch === type ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:bg-white'}`}
                          >
                              {type}
                          </button>
                      ))}
                   </div>
                </div>
            </div>

            {/* DATE / HEURE / LIEU */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                    Date
                  </label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff9d00]"
                      required
                    />
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  </div>
               </div>
               
               <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                    Heure
                  </label>
                  <div className="relative">
                    <input 
                      type="time" 
                      value={heure}
                      onChange={(e) => setHeure(e.target.value)}
                      className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:border-[#ff9d00]"
                      required
                    />
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  </div>
               </div>

               <div className="md:col-span-1">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-2">
                    Lieu
                  </label>
                  <div className="relative">
                     <select 
                       value={lieu}
                       onChange={(e) => setLieu(e.target.value)}
                       className="w-full p-4 pl-12 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold uppercase appearance-none outline-none focus:border-[#ff9d00] cursor-pointer"
                     >
                       <option value="Domicile">Domicile</option>
                       <option value="Exterieur">Extérieur</option>
                       <option value="Neutre">Terrain Neutre</option>
                     </select>
                     <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
                  </div>
               </div>
            </div>
          </div>

          {/* ACTION BUTTON */}
          <div className="flex justify-end pt-4">
             <button 
               type="submit" 
               disabled={loading}
               className="bg-[#ff9d00] text-white px-8 py-5 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-black transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
             >
                {loading ? <Loader2 className="animate-spin" /> : "SUIVANT : SÉLECTION JOUEURS"} 
                {!loading && <ChevronRight size={16} />}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}