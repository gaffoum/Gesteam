"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Mail, Lock, User, ArrowRight, ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Inscription Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/login`,
        }
      });

      if (error) throw error;

      if (data.user) {
        // 2. Création du profil 
        // Note : On utilise 'full_name' ici pour correspondre à ta capture d'écran Supabase
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          full_name: nom, // Changé de 'nom' à 'full_name'
          role: 'admin',
          is_blocked: false
        });

        if (profileError) throw profileError;
        setIsSent(true);
      }
    } catch (err: any) {
      alert("Erreur d'inscription : " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center">
          <div className="w-20 h-20 bg-[#ff9d00]/10 text-[#ff9d00] rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={40} />
          </div>
          <h2 className="text-3xl font-black uppercase mb-4 tracking-tighter">Vérifiez vos <span className="text-[#ff9d00]">emails</span></h2>
          <p className="text-gray-400 font-bold not-italic text-sm mb-8 italic">
            Lien envoyé à : <span className="text-[#1a1a1a] font-black">{email}</span>
          </p>
          <button onClick={() => router.push('/login')} className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest">
            Retour au login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">Gesteam <span className="text-[#ff9d00]">Admin</span></h1>
          <p className="text-gray-400 font-bold not-italic uppercase text-[9px] tracking-[0.3em] mt-2">Créer un compte responsable club</p>
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
              type="password" placeholder="Mot de passe" 
              className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold text-sm"
              onChange={e => setPassword(e.target.value)} required 
            />
          </div>

          <button disabled={isLoading} className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3">
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>S'inscrire <ArrowRight size={18}/></>}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <Link href="/login" className="inline-flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] hover:text-[#1a1a1a]">
            <ArrowLeft size={12} /> Déjà un compte ? Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}