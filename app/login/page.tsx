"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// 1. COMPOSANT FORMULAIRE (Isolé pour useSearchParams)
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
      setSuccessMsg("Email confirmé ! Connectez-vous.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (error) {
      // Message personnalisé pour compte inexistant ou mauvais identifiants
      setErrorMsg("Ce compte n'existe pas. Veuillez créer un compte.");
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
        <h2 className="text-4xl font-black uppercase tracking-tighter text-white italic text-center">
          Gesteam <span className="text-[#ff9d00]">Pro</span>
        </h2>
        <div className="h-1 w-12 bg-[#ff9d00] mx-auto mt-2 rounded-full" />
      </div>
      
      <form onSubmit={handleLogin} className="space-y-6">
        {successMsg && (
          <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 italic font-bold">
            <CheckCircle2 size={16} /> <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 italic animate-pulse font-bold">
            <AlertCircle size={16} /> <span>{errorMsg}</span>
          </div>
        )}
        
        <input 
          type="email" 
          required 
          placeholder="EMAIL" 
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-[#ff9d00]/50 outline-none italic uppercase" 
          value={email} 
          onChange={(e)=>setEmail(e.target.value)} 
        />
        
        <div className="space-y-2">
          <input 
            type="password" 
            required 
            placeholder="MOT DE PASSE" 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-[#ff9d00]/50 outline-none italic uppercase" 
            value={password} 
            onChange={(e)=>setPassword(e.target.value)} 
          />
          {/* LIEN MOT DE PASSE OUBLIÉ CORRIGÉ */}
          <div className="text-right px-2">
            <Link 
              href="/auth/reset-password" 
              className="text-white/20 text-[9px] font-black uppercase hover:text-[#ff9d00] hover:underline transition-all tracking-widest italic"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffb338] transition-all shadow-xl shadow-[#ff9d00]/20 active:scale-[0.98]"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LogIn size={20} />} 
          {loading ? "" : "Entrer sur le terrain"}
        </button>
      </form>

      <div className="mt-8 text-center pt-8 border-t border-white/5">
        <Link href="/register" className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest italic transition-colors">
          Nouveau coach ? Créer un compte
        </Link>
      </div>
    </div>
  );
}

// 2. PAGE PRINCIPALE
export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 italic overflow-hidden bg-black">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: "url('/back.png')" }}
      >
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