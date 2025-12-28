"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck } from 'lucide-react';

function PlayerRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [invitation, setInvitation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (token) verifyToken();
  }, [token]);

  const verifyToken = async () => {
    const { data, error } = await supabase
      .from('player_invitations')
      .select('*, clubs(name), teams(name)')
      .eq('token', token)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      alert("Lien invalide ou expiré.");
      router.push('/login');
    } else {
      setInvitation(data);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });

    if (!authError && authData.user) {
      // 1. Créer le profil Joueur
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email,
        role: 'user',
        club_id: invitation.club_id
      });

      // 2. Marquer le token comme utilisé
      await supabase.from('player_invitations').update({ is_used: true }).eq('token', token);

      alert("Compte créé ! Bienvenue au club.");
      router.push('/login');
    }
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 italic">
      <div className="max-w-md w-full bg-white rounded-[3rem] p-12 shadow-2xl text-center">
        <ShieldCheck className="mx-auto mb-6 text-[#ff9d00]" size={48} />
        <h2 className="text-3xl font-black uppercase mb-2">Rejoindre <span className="text-[#ff9d00]">{invitation?.clubs?.name}</span></h2>
        <p className="text-gray-400 font-bold not-italic uppercase text-[10px] mb-8 italic">Équipe : {invitation?.teams?.name}</p>

        <form onSubmit={handleRegister} className="space-y-4 not-italic text-left">
          <input type="email" placeholder="Ton Email" className="w-full p-4 rounded-2xl bg-gray-50 outline-none border-2 border-transparent focus:border-[#ff9d00] font-bold" onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mot de passe" className="w-full p-4 rounded-2xl bg-gray-50 outline-none border-2 border-transparent focus:border-[#ff9d00] font-bold" onChange={e => setPassword(e.target.value)} required />
          <button className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase">S'inscrire</button>
        </form>
      </div>
    </div>
  );
}

export default function PlayerRegisterPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <PlayerRegisterContent />
    </Suspense>
  );
}