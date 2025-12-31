"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, CheckCircle } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Vérifier qu'on a bien une session (le lien email connecte automatiquement l'user)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/login'); // Si pas de session, le lien est invalide ou expiré
      }
    });
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setMessage({ text: "Mot de passe mis à jour avec succès !", type: 'success' });
      
      // Redirection après 2 secondes
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-600 via-[#1a1a1a] to-red-600"></div>

        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
            <KeyRound size={24} />
          </div>
          <h1 className="text-2xl font-black uppercase text-[#1a1a1a]">Nouveau Mot de passe</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
            Sécurisez votre compte
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-500 ml-3">Nouveau mot de passe</label>
            <input 
              type="password" 
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border-none rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-red-600 outline-none transition-all placeholder:font-normal"
              placeholder="Minimum 6 caractères"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
               {message.type === 'success' && <CheckCircle size={14}/>}
               {message.text}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#1a1a1a] hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Confirmer le changement"}
          </button>
        </form>
      </div>
    </div>
  );
}