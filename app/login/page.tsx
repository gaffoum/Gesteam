"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Composant interne pour gérer la logique de recherche
function LoginContent() {
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("Identifiants incorrects.");
      } else if (error.message.includes("Email not confirmed")) {
        setErrorMsg("Email non confirmé.");
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
      return;
    }

    if (data?.session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        setErrorMsg("Compte suspendu.");
        setLoading(false);
        return;
      }
      router.push('/'); 
    }
  };

  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic">
          Gesteam <span className="text-[#ff9d00]">Pro</span>
        </h2>
        <div className="h-1 w-12 bg-[#ff9d00] mx-auto mt-2 rounded-full" />
        <p className="text-white/20 text-[9px] font-bold uppercase tracking-[0.3em] mt-4 not-italic">
          Accès Administration Coach
        </p>
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
            <CheckCircle2 size={16} /> <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 animate-pulse">
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Email</label>
          <input 
            type="email" 
            required 
            placeholder="VOTRE EMAIL" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50 transition-all" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Mot de passe</label>
          <input 
            type="password" 
            required 
            placeholder="••••••••" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50 transition-all" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-[#ffb338] transition-all shadow-xl shadow-[#ff9d00]/10 mt-2"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              <LogIn size={20} /> 
              <span className="tracking-tighter italic">Entrer sur le terrain</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-10 text-center pt-8 border-t border-white/5">
        <Link 
          href="/register" 
          className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest transition-colors italic"
        >
          Nouveau coach ? Créer un compte
        </Link>
      </div>
    </div>
  );
}

// Composant principal avec Suspense pour corriger l'erreur Vercel
export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 italic overflow-hidden bg-[#0a0a0a]">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/back.png')" }}
      >
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={
          <div className="bg-[#1a1a1a]/85 p-10 rounded-[2.5rem] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
          </div>
        }>
          <LoginContent />
        </Suspense>
        
        <p className="text-center mt-8 text-white/10 text-[9px] font-bold uppercase tracking-[0.5em] not-italic">
          Gesteam Pro Infrastructure
        </p>
      </div>
    </div>
  );
}