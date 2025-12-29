"use client";
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, Loader2, Camera, Trophy } from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [clubName, setClubName] = useState('');
  const [ville, setVille] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }

      // VÉRIFICATION CRUCIALE : Si l'utilisateur a déjà un club, on le dégage d'ici
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        console.log("Club déjà existant, redirection dashboard...");
        router.replace('/dashboard');
      } else {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('equipes_logos') 
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('equipes_logos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
    } catch (error: any) {
      alert("Erreur logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");

      // 1. Création du club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert([{ 
          name: clubName, 
          ville: ville,
          logo_url: logoUrl 
        }])
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Liaison au profil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ club_id: club.id })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // Utilisation de window.location pour vider les états React
      window.location.href = '/dashboard';
    } catch (err: any) {
      alert("Erreur : " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
            Nouveau <span className="text-[#ff9d00]">Club</span>
          </h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2">
            Configuration initiale de votre espace
          </p>
        </div>

        <form onSubmit={handleCreateClub} className="space-y-6 not-italic">
          <div className="flex flex-col items-center mb-6">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-28 h-28 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-[#ff9d00] transition-all overflow-hidden relative group"
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  {uploading ? <Loader2 className="animate-spin text-[#ff9d00]" /> : <Camera className="text-gray-300 mx-auto" size={32} />}
                </div>
              )}
            </div>
            <p className="text-[10px] font-black uppercase text-gray-400 mt-3 italic">Logo du Club</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Trophy className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                required
                type="text" 
                placeholder="Nom du Club" 
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
              />
            </div>
            <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input 
                required
                type="text" 
                placeholder="Ville" 
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
                value={ville}
                onChange={(e) => setVille(e.target.value)}
              />
            </div>
          </div>

          <button 
            disabled={loading || uploading}
            type="submit" 
            className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#ff9d00] transition-all shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <>Créer le club <ArrowRight size={18} /></>}
          </button>
        </form>
      </div>
    </div>
  );
}