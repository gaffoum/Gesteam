"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getRedirectPath } from '@/lib/auth-guard';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Authentification
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });

      if (authError) throw authError;

      // 2. Récupération du profil
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, is_blocked')
        .eq('id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error("Erreur de sécurité (RLS) : " + profileError.message);
      }

      if (!profile) {
        await supabase.auth.signOut();
        throw new Error("Profil introuvable en base de données.");
      }

      if (profile.is_blocked) {
        await supabase.auth.signOut();
        throw new Error("Ce compte a été suspendu.");
      }

      // 3. Log de connexion (dans un bloc try/catch séparé pour ne pas bloquer le login)
      try {
        await supabase.from('login_logs').insert({
          user_id: authData.user.id,
          role: profile.role,
          user_agent: window.navigator.userAgent
        });
      } catch (logError) {
        console.warn("Impossible d'enregistrer le log de connexion :", logError);
      }

      // 4. Redirection vers la page correspondante
      const targetPath = getRedirectPath(profile.role as any);
      router.push(targetPath);

    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
            Gesteam <span className="text-[#ff9d00]">Login</span>
          </h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-widest mt-2">
            Accès sécurisé à votre espace
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 not-italic">
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 ml-4 text-gray-400">Email</label>
            <input 
              type="email" 
              placeholder="votre@email.com" 
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] focus:bg-white outline-none font-bold transition-all text-sm"
              onChange={e => setEmail(e.target.value)} 
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase mb-2 ml-4 text-gray-400">Mot de passe</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] focus:bg-white outline-none font-bold transition-all text-sm"
              onChange={e => setPassword(e.target.value)} 
              required
            />
          </div>
          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}