"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MailCheck, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    // 1. Inscription Auth (Déclenche l'envoi du mail de confirmation)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: nom },
        // On ajoute le paramètre ?confirmed=true pour que la page Login sache quoi faire
        emailRedirectTo: `${window.location.origin}/login?confirmed=true`,
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    // 2. Création immédiate du profil en base de données
    // Cela garantit que l'utilisateur existe dans 'profiles' dès qu'il valide son mail
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert([
        { 
          id: data.user.id, 
          email: email, 
          nom: nom, 
          role: 'user',
          is_blocked: false 
        }
      ]);

      if (profileError) {
        console.error("Erreur lors de la création du profil:", profileError.message);
      }
      setSuccess(true);
    }
    setLoading(false);
  };

  // VUE APRÈS INSCRIPTION RÉUSSIE
  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 italic">
        <div className="max-w-md w-full bg-[#1a1a1a] p-10 rounded-[3rem] border border-white/5 text-center shadow-2xl">
          <div className="w-20 h-20 bg-[#ff9d00]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#ff9d00]/20">
            <MailCheck className="text-[#ff9d00]" size={40} />
          </div>
          <h2 className="text-2xl font-black uppercase text-white mb-4 italic">Action requise</h2>
          <p className="text-white/40 text-sm leading-relaxed mb-8">
            Un lien de validation a été envoyé à <span className="text-white">{email}</span>. 
            Veuillez cliquer dessus pour activer votre compte.
          </p>
          <Link href="/login" className="text-[#ff9d00] font-black uppercase text-xs hover:underline tracking-widest">
            Retourner à la page de connexion
          </Link>
        </div>
      </div>
    );
  }

  // FORMULAIRE D'INSCRIPTION
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 italic text-white">
      <div className="w-full max-w-md">
        <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black uppercase">Créer un <span className="text-[#ff9d00]">Compte</span></h2>
            <p className="text-white/20 text-[10px] font-bold uppercase tracking-[0.3em] mt-2 italic">Rejoignez Gesteam Pro</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {errorMsg && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2 not-italic font-bold">
                <AlertCircle size={16} /> {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Nom complet</label>
              <input 
                type="text" 
                placeholder="Ex: Jean Dupont" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-[#ff9d00]/50 outline-none transition-all placeholder:text-white/10" 
                value={nom} 
                onChange={(e) => setNom(e.target.value)} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Adresse Email</label>
              <input 
                type="email" 
                placeholder="coach@votreclub.com" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-[#ff9d00]/50 outline-none transition-all placeholder:text-white/10" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-white/30 ml-4 tracking-widest">Mot de passe</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-[#ff9d00]/50 outline-none transition-all placeholder:text-white/10" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffb338] transition-all shadow-xl shadow-[#ff9d00]/10 mt-6"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> Finaliser l'inscription</>}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-white/5">
            <Link href="/login" className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest transition-colors">
              Vous avez déjà un compte ? Se connecter
            </Link>
          </div>
        </div>
        
        <p className="text-center mt-8 text-white/10 text-[9px] font-bold uppercase tracking-[0.5em]">
          Gesteam Pro Infrastructure
        </p>
      </div>
    </div>
  );
}