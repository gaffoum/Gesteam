"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      if (data.user) {
        // Création du profil admin
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: email,
          nom: nom,
          role: 'admin',
          is_blocked: false
        });
        setIsSent(true);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 italic">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center">
          <h2 className="text-3xl font-black uppercase mb-4">Email envoyé !</h2>
          <p className="text-gray-500 font-bold not-italic">Vérifiez votre boîte de réception pour valider votre compte admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl border border-gray-100">
        <h1 className="text-4xl font-black uppercase text-center mb-10">Gesteam <span className="text-[#ff9d00]">Admin</span></h1>
        <form onSubmit={handleRegister} className="space-y-5 not-italic">
          <input type="text" placeholder="Nom complet" className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold" onChange={e => setNom(e.target.value)} required />
          <input type="email" placeholder="Email" className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold" onChange={e => setPassword(e.target.value)} required />
          <button disabled={isLoading} className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3">
            {isLoading ? <Loader2 className="animate-spin" /> : "Créer mon compte Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}