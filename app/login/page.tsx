"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Loader2, 
  Mail, 
  Lock, 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';

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
      // 1. Authentification Supabase
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        // 2. Récupération immédiate du profil pour l'aiguillage
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('club_id, role')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        // 3. LOGIQUE DE REDIRECTION PAR PRIORITÉ
        
        // PRIORITÉ 1 : SuperAdmin (ex: gaffoum@gmail.com)
        if (profile?.role === 'superAdmin') {
          window.location.href = '/backoffice';
        } 
        // PRIORITÉ 2 : Admin de club avec club_id déjà renseigné
        else if (profile?.club_id) {
          window.location.href = '/dashboard';
        } 
        // PRIORITÉ 3 : Admin sans club (Nouvel utilisateur)
        else {
          window.location.href = '/onboarding';
        }
      }
    } catch (err: any) {
      setErrorMessage(
        err.message === "Invalid login credentials" 
          ? "Email ou mot de passe incorrect" 
          : "Erreur de connexion au serveur"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
            Gesteam <span className="text-[#ff9d00]">Login</span>
          </h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2 italic text-center">
            Accès sécurisé plateforme
          </p>
        </div>

        {/* Message d'erreur */}
        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold not-italic border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleLogin} className="space-y-5 not-italic">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              required
              type="email" 
              placeholder="Email" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all shadow-sm"
              onChange={e => setEmail(e.target.value)}
              value={email}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              required
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              className="w-full p-4 pl-12 pr-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm transition-all shadow-sm"
              onChange={e => setPassword(e.target.value)}
              value={password}
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
            {isLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <>Entrer sur le terrain <LogIn size={18}/></>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">
            Nouveau sur Gesteam ?{" "}
            <button 
              type="button"
              onClick={() => router.push('/register')} 
              className="text-[#ff9d00] hover:underline font-black"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}