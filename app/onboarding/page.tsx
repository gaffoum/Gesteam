"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  ArrowRight, 
  Loader2, 
  CheckCircle,
  MapPin,
  Hash,
  AlertTriangle
} from 'lucide-react';
import ClubSelector from '@/app/components/ClubSelector';

// --- COMPOSANT INPUT COULEUR SÉCURISÉ ---
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-[#ff9d00] focus-within:ring-1 focus-within:ring-[#ff9d00]/20 transition-all">
      <input
        type="color"
        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent p-0"
        value={value.length === 7 ? value : '#000000'} // Fallback visuel si hex invalide
        onChange={(e) => onChange(e.target.value)}
      />
      <div className="flex-1 flex items-center border-l border-gray-200 pl-3">
        <Hash size={12} className="text-gray-400 mr-1" />
        <input
          type="text"
          maxLength={7}
          className="w-full bg-transparent border-none outline-none text-xs font-black text-[#1a1a1a] uppercase p-0 placeholder-gray-300"
          value={value.replace('#', '')}
          onChange={(e) => {
             // On autorise la saisie mais on nettoie les caractères interdits
             const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
             onChange(`#${clean}`);
          }}
          onBlur={() => {
            // Sécurité : Si l'utilisateur sort du champ avec un code incomplet (ex: #A1), on remet du noir ou blanc
            if (value.length < 7) onChange('#000000');
          }}
        />
      </div>
    </div>
  </div>
);

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    nom: '',
    ville: '',
    code_postal: '',
    couleur_principale: '#1a1a1a', 
    couleur_secondaire: '#ff9d00',
    couleur_tertiaire: '#ffffff'
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login');
    setUser(session.user);
  };

  const handleClubSelect = (club: any) => {
    setFormData(prev => ({
      ...prev,
      nom: club.nom,
      ville: club.ville,
      code_postal: club.cp
    }));
  };

  // Fonction pour valider qu'un hex est correct (# + 6 caractères)
  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.nom) return setErrorMsg("Veuillez sélectionner un club.");
    
    // Validation des couleurs avant envoi
    if (!isValidHex(formData.couleur_principale) || !isValidHex(formData.couleur_secondaire) || !isValidHex(formData.couleur_tertiaire)) {
      return setErrorMsg("Les codes couleurs doivent être complets (ex: #FFFFFF)");
    }

    setLoading(true);

    try {
      // 1. Création du club
      const { data: newClub, error: clubError } = await supabase
        .from('clubs')
        .insert([
          {
            name: formData.nom,
            ville: formData.ville,
            code_postal: formData.code_postal,
            primary_color: formData.couleur_principale,
            secondary_color: formData.couleur_secondaire,
            tertiary_color: formData.couleur_tertiaire 
          }
        ])
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Liaison User -> Club
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ club_id: newClub.id, role: 'admin' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/dashboard');

    } catch (err: any) {
      console.error("Erreur Onboarding:", err);
      // Message d'erreur plus clair pour toi
      setErrorMsg(err.message || "Erreur lors de l'enregistrement. Vérifiez votre base de données.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 italic">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
        {/* Partie Gauche */}
        <div className="w-full md:w-5/12 bg-[#1a1a1a] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#ff9d00] rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-[#ff9d00]/20">
              <Trophy size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 leading-tight">Bienvenue <br/> Coach !</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed opacity-80 not-italic">
              La charte graphique est importante. Choisissez vos 3 couleurs officielles.
            </p>
          </div>
          
          <div className="relative z-10 mt-12">
            <div className="flex items-center gap-3 mb-6">
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg" style={{ backgroundColor: isValidHex(formData.couleur_principale) ? formData.couleur_principale : '#000' }}></div>
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg -ml-4" style={{ backgroundColor: isValidHex(formData.couleur_secondaire) ? formData.couleur_secondaire : '#000' }}></div>
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg -ml-4" style={{ backgroundColor: isValidHex(formData.couleur_tertiaire) ? formData.couleur_tertiaire : '#000' }}></div>
            </div>
            <p className="text-[10px] uppercase font-bold text-gray-500">Aperçu Palette</p>
          </div>
          <Trophy className="absolute -bottom-10 -right-10 text-white opacity-5 rotate-12" size={300} />
        </div>

        {/* Partie Droite */}
        <div className="w-full md:w-7/12 p-12 relative">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-8">
            Identité du <span className="text-[#ff9d00]">Club</span>
          </h2>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 not-italic">
              <AlertTriangle size={16} /> {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 not-italic">
            
            <div className="space-y-4">
              <ClubSelector onSelect={handleClubSelect} />
              
              {formData.nom && (
                <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                  <div className="bg-green-500 text-white p-1 rounded-full mt-0.5"><CheckCircle size={12} /></div>
                  <div>
                    <p className="text-xs font-black uppercase text-green-800 tracking-tight">{formData.nom}</p>
                    <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide flex items-center gap-1">
                      <MapPin size={10} /> {formData.ville} ({formData.code_postal})
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest italic">
                Charte Graphique (Hexadécimal)
              </label>
              
              <div className="grid grid-cols-3 gap-4">
                <ColorInput label="Principale" value={formData.couleur_principale} onChange={c => setFormData({...formData, couleur_principale: c})} />
                <ColorInput label="Secondaire" value={formData.couleur_secondaire} onChange={c => setFormData({...formData, couleur_secondaire: c})} />
                <ColorInput label="Tertiaire" value={formData.couleur_tertiaire} onChange={c => setFormData({...formData, couleur_tertiaire: c})} />
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={loading || !formData.nom}
                className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>Valider la configuration <ArrowRight size={16} /></>}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}