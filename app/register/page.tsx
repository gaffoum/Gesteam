"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Inscription Auth
      // Sans confirmation email, data.session sera immédiatement rempli
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: nom } // Envoyé au trigger SQL pour remplir la colonne 'nom'
        }
      });

      if (authError) throw authError;

      if (data.user) {
        // Le Trigger SQL a déjà créé le profil admin
        // On redirige vers le login pour que le middleware gère la suite (Onboarding)
        router.push('/login');
      }
    } catch (err: any) {
      alert("Erreur : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">Gesteam <span className="text-[#ff9d00]">Admin</span></h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2">Création de compte instantanée</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 not-italic">
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" placeholder="Nom complet" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
              onChange={e => setNom(e.target.value)} required 
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="email" placeholder="Email professionnel" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
              onChange={e => setEmail(e.target.value)} required 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type={showPassword ? "text" : "password"} 
              placeholder="Mot de passe" 
              className="w-full p-4 pl-12 pr-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
              onChange={e => setPassword(e.target.value)} required 
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#ff9d00] transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button disabled={isLoading} className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all shadow-xl flex items-center justify-center gap-3">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>S'inscrire <ArrowRight size={18}/></>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-400 font-bold uppercase text-[10px]">
           <p className="mb-4">Mode développement : Validation email désactivée</p>
           <Link href="/login" className="inline-flex items-center gap-2 hover:text-[#1a1a1a] transition-all">
             <ArrowLeft size={12} /> Retour au login
           </Link>
        </div>
      </div>
    </div>
  );
}