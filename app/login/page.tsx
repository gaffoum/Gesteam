"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        setErrorMsg("Ce compte n'existe pas. Veuillez créer un compte.");
      } else if (error.message.includes("Email not confirmed")) {
        setErrorMsg("Email non confirmé. Vérifiez votre boîte mail.");
      } else {
        setErrorMsg(error.message);
      }
      setLoading(false);
      return;
    }

    if (data?.session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.session.user.id)
        .single();
      
      if (profile?.is_blocked) {
        await supabase.auth.signOut();
        setErrorMsg("Accès refusé : Compte suspendu.");
        setLoading(false);
        return;
      }

      router.push('/'); // Redirige vers le dispatcher racine
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 italic text-white">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <h2 className="text-3xl font-black uppercase text-center mb-8 italic">Connexion</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2 not-italic">
                <AlertCircle size={18} /> <span>{errorMsg}</span>
              </div>
            )}
            <input type="email" required placeholder="Email" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ff9d00]/50" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" required placeholder="Mot de passe" className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm outline-none focus:border-[#ff9d00]/50" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="submit" disabled={loading} className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffb338] transition-all">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20} /> Entrer</>}
            </button>
          </form>
          <div className="mt-8 text-center pt-8 border-t border-white/5">
            <Link href="/register" className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest">Pas de compte ? S'inscrire</Link>
          </div>
        </div>
      </div>
    </div>
  );
}