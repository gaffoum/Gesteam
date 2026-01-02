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
  AlertTriangle,
  Mail,
  X
} from 'lucide-react';
import ClubSelector from '@/app/components/ClubSelector';

// --- COMPOSANT MODAL GESTEAM PRO LIGHT AVEC ANIMATION ---
const AdminContactModal = ({ isOpen, onClose, adminEmail, clubName }: { isOpen: boolean, onClose: () => void, adminEmail: string, clubName: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 italic relative overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="absolute top-0 right-0 p-6">
          <button onClick={onClose} className="text-gray-300 hover:text-black transition-colors"><X size={24} /></button>
        </div>
        <div className="w-16 h-16 bg-[#ff9d00]/10 rounded-2xl flex items-center justify-center mb-6 animate-bounce">
          <Mail size={32} className="text-[#ff9d00]" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-[#1a1a1a]">Club déjà <span className="text-[#ff9d00]">Actif</span></h3>
        <p className="text-xs font-bold text-gray-500 uppercase leading-relaxed mb-8 not-italic">
          Le club <span className="text-black font-black">{clubName}</span> est déjà créé sur Gesteam. 
          Veuillez contacter le coach principal pour obtenir vos accès.
        </p>
        <div className="bg-gray-50 p-6 rounded-2xl mb-8 border border-gray-100">
          <p className="text-[10px] text-gray-400 font-black uppercase mb-2 tracking-widest">E-mail du coach principal :</p>
          <p className="text-sm font-black text-black break-all selection:bg-[#ff9d00] selection:text-white lowercase">{adminEmail}</p>
        </div>
        <button 
          onClick={onClose}
          className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all shadow-lg active:scale-95"
        >
          J'ai compris
        </button>
      </div>
    </div>
  );
};

// --- COMPOSANT INPUT COULEUR SÉCURISÉ ---
const ColorInput = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="block text-[9px] font-bold uppercase text-gray-400 mb-2 tracking-widest">{label}</label>
    <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 focus-within:border-[#ff9d00] transition-all shadow-sm">
      <input
        type="color"
        className="w-10 h-10 rounded-lg cursor-pointer border-none bg-transparent p-0"
        value={value.length === 7 ? value : '#000000'}
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
              const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
              onChange(`#${clean}`);
          }}
          onBlur={() => {
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
  const [showModal, setShowModal] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [formData, setFormData] = useState({
    id_club: '',
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
      id_club: club.id,
      nom: club.nom_usage || club.name,
      ville: club.ville,
      code_postal: club.code_postal || ''
    }));
  };

  const isValidHex = (hex: string) => /^#[0-9A-F]{6}$/i.test(hex);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData.nom) return setErrorMsg("Veuillez sélectionner un club.");
    if (!isValidHex(formData.couleur_principale) || !isValidHex(formData.couleur_secondaire) || !isValidHex(formData.couleur_tertiaire)) {
      return setErrorMsg("Les codes couleurs doivent être complets (ex: #FFFFFF)");
    }

    setLoading(true);

    try {
      // Vérification si le club appartient déjà à un coach
      const { data: existingAdmin, error: searchError } = await supabase
        .from('profiles')
        .select('email')
        .eq('club_id', formData.id_club)
        .eq('role', 'admin')
        .maybeSingle();

      if (existingAdmin) {
        setAdminEmail(existingAdmin.email || "Le coach principal");
        setShowModal(true);
        setLoading(false);
        return;
      }

      // Mise à jour des couleurs et infos du club sélectionné
      const { error: clubError } = await supabase
        .from('clubs')
        .update({
          primary_color: formData.couleur_principale,
          secondary_color: formData.couleur_secondaire,
          tertiary_color: formData.couleur_tertiaire,
          code_postal: formData.code_postal,
          status: 'active'
        })
        .eq('id', formData.id_club);

      if (clubError) throw clubError;

      // Liaison du profil utilisateur au club
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          club_id: formData.id_club, 
          role: 'admin',
          onboarding_completed: true,
          email: user.email 
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      router.push('/dashboard');
      router.refresh();

    } catch (err: any) {
      console.error("Erreur Onboarding:", err);
      setErrorMsg(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 italic">
      <AdminContactModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        adminEmail={adminEmail} 
        clubName={formData.nom} 
      />

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
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg transition-transform hover:scale-110" style={{ backgroundColor: isValidHex(formData.couleur_principale) ? formData.couleur_principale : '#000' }}></div>
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg -ml-4 transition-transform hover:scale-110" style={{ backgroundColor: isValidHex(formData.couleur_secondaire) ? formData.couleur_secondaire : '#000' }}></div>
               <div className="w-8 h-8 rounded-full border-2 border-white/20 shadow-lg -ml-4 transition-transform hover:scale-110" style={{ backgroundColor: isValidHex(formData.couleur_tertiaire) ? formData.couleur_tertiaire : '#000' }}></div>
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
            <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 not-italic animate-in slide-in-from-top-4 duration-300">
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
                      <MapPin size={10} /> {formData.ville} {formData.code_postal && `(${formData.code_postal})`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100 w-full"></div>

            <div>
              <label className="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-widest italic">Charte Graphique (Hexadécimal)</label>
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
                className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
              >
                {loading ? <Loader2 className="animate-spin" /> : <>CRÉER LE CLUB <ArrowRight size={16} /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}