"use client";
import React, { useState, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { MailCheck, Loader2, UserPlus, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function RegisterForm() {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: nom }, emailRedirectTo: `${window.location.origin}/login?confirmed=true` }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').insert([{ id: data.user.id, email, nom, role: 'user', is_blocked: false }]);
      setSuccess(true);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="bg-[#1a1a1a]/95 p-10 rounded-[3rem] border border-[#ff9d00]/20 text-center shadow-2xl backdrop-blur-xl">
        <MailCheck className="text-[#ff9d00] mx-auto mb-6" size={50} />
        <h2 className="text-2xl font-black uppercase text-white mb-4 italic text-center">Activation Mail</h2>
        <p className="text-white/40 text-sm leading-relaxed mb-8 font-bold">Lien envoyé à {email}.</p>
        <Link href="/login" className="text-[#ff9d00] font-black uppercase text-xs hover:underline tracking-widest">Retour au login</Link>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a]/90 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl">
      <h2 className="text-3xl font-black uppercase text-white text-center mb-8 italic">Inscription <span className="text-[#ff9d00]">Coach</span></h2>
      <form onSubmit={handleRegister} className="space-y-4">
        {errorMsg && <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase rounded-xl flex items-center gap-2"><AlertCircle size={16} /> {errorMsg}</div>}
        <input type="text" placeholder="NOM COMPLET" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50" value={nom} onChange={(e)=>setNom(e.target.value)} />
        <input type="email" placeholder="EMAIL" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input type="password" placeholder="MOT DE PASSE" required className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm outline-none focus:border-[#ff9d00]/50" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button type="submit" disabled={loading} className="w-full bg-[#ff9d00] text-[#1a1a1a] font-black uppercase py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffb338] transition-all">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} /> Créer mon accès</>}
        </button>
      </form>
      <div className="mt-8 text-center pt-6 border-t border-white/5">
        <Link href="/login" className="text-white/40 text-[10px] font-bold uppercase hover:text-[#ff9d00] tracking-widest italic">Déjà inscrit ? Connexion</Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 italic overflow-hidden bg-black">
      <div className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/back.png')" }}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-[2px]" />
      </div>
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<div className="flex justify-center"><Loader2 className="animate-spin text-[#ff9d00]" size={40} /></div>}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  );
}