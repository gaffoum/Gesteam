"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, Lock, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Authentification
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        console.log("Connexion réussie ! Redirection forcée en cours...");
        
        // 2. REDIRECTION RADICALE
        // Au lieu de router.push, on utilise window.location.href
        // Cela force le navigateur à recharger complètement la destination
        // et garantit que le middleware détecte bien la nouvelle session.
        window.location.href = '/onboarding';
      }
    } catch (err: any) {
      console.error("Erreur login:", err.message);
      setErrorMessage(err.message === "Invalid login credentials" 
        ? "Email ou mot de passe incorrect" 
        : err.message);
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
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2">
            Accès responsable & staff
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold not-italic border border-red-100 animate-pulse">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 not-italic">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
              onChange={e => setEmail(e.target.value)}
              value={email}
              required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              className="w-full p-4 pl-12 pr-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all"
              onChange={e => setPassword(e.target.value)}
              value={password}
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff9d00] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button 
            type="submit"
            disabled={isLoading} 
            className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Connexion <LogIn size={18}/></>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 font-bold uppercase text-[10px]">
            Pas encore de compte ?{" "}
            <button 
              type="button"
              onClick={() => window.location.href = '/register'} 
              className="text-[#ff9d00] hover:underline font-black"
            >
              S'inscrire ici
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}