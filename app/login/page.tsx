"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const confirmed = searchParams.get('confirmed');
    if (confirmed === 'true') {
      supabase.auth.signOut();
      setSuccessMsg("Email confirmé avec succès ! Connectez-vous.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanEmail = email.trim();

    // 1. Tentative de connexion
    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: cleanEmail, 
      password: password 
    });

    // 2. Si Supabase Auth ne trouve pas l'utilisateur ou si le MDP est faux
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setErrorMsg("Votre email n'est pas encore confirmé.");
      } else {
        // Pour toute autre erreur (compte inexistant ou identifiants invalides)
        setErrorMsg("Ce compte n'existe pas. Veuillez créer un compte.");
      }
      setLoading(false);
      return;
    }

    // 3. Si connexion réussie, on vérifie si le profil existe toujours et n'est pas bloqué
    if (data?.session) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      // Si l'utilisateur est dans Auth mais pas dans Profiles (cas rare de suppression partielle)
      if (profileError || !profile) {
        await supabase.auth.signOut();
        setErrorMsg("Erreur de profil : ce compte semble incomplet.");
        setLoading(false);
        return;
      }

      if (profile.is_blocked) {
        await supabase.auth.signOut();
        setErrorMsg("Compte suspendu par l'administrateur.");
        setLoading(false);
        return;
      }
      
      router.push('/'); 
    }
  };

  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic text-center">
          Gesteam <span className="text-[#ff9d00]">Pro</span>
        </h2>
        <div className="h-1 w-12 bg-[#ff9d00] mx-auto mt-2 rounded-full" />
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 font-bold">
            <CheckCircle2 size={16} /> <span>{successMsg}</span>
          </div>
        )}
        
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 animate-pulse font-bold italic">
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Email</label>
          <input type="email" required placeholder="EMAIL" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Mot de passe</label>
          <input type="password" required placeholder="MOT DE PASSE" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50 transition-all" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        <button type="submit" disabled={loading} className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffb338] transition-all shadow-xl shadow-[#ff9d00]/10">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />} 
          {loading ? "" : "Entrer sur le terrain"}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-white/5">
        <Link href="/register" className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest transition-colors">
          Nouveau coach ? Créer un compte
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 italic overflow-hidden bg-black">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/back.png')" }}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-[#ff9d00]" size={40} /></div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}