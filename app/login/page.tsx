"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowLeft, KeyRound } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  
  // États
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false); // Bascule entre Login et Reset
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Form Data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. CONNEXION CLASSIQUE
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Redirection intelligente
      if (data.user?.email === 'gaffoum@gmail.com') {
        router.push('/backoffice');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      setMessage({ text: "Email ou mot de passe incorrect.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 2. DEMANDE DE RÉINITIALISATION
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setMessage({ 
        text: "Si cet email existe, un lien de réinitialisation vous a été envoyé.", 
        type: 'success' 
      });
      // On ne vide pas l'email pour laisser l'utilisateur vérifier s'il a fait une typo
    } catch (error: any) {
      setMessage({ text: "Erreur lors de l'envoi : " + error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl relative overflow-hidden">
        
        {/* Décoration Header */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#1a1a1a] via-red-600 to-[#1a1a1a]"></div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-[#1a1a1a]">
            Gesteam <span className="text-red-600">Pro</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-2">
            {isResetMode ? "Récupération de compte" : "Connexion à votre espace"}
          </p>
        </div>

        {/* --- FORMULAIRE --- */}
        <form onSubmit={isResetMode ? handleResetPassword : handleLogin} className="space-y-6">
          
          {/* Email (Utilisé dans les deux modes) */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-gray-500 ml-3">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                placeholder="coach@gesteam.fr"
              />
            </div>
          </div>

          {/* Mot de passe (Uniquement en mode Login) */}
          {!isResetMode && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <div className="flex justify-between items-center ml-3 mr-1">
                <label className="text-xs font-black uppercase text-gray-500">Mot de passe</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl font-bold text-gray-800 focus:ring-2 focus:ring-red-600 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              
              {/* Lien Mot de passe oublié */}
              <div className="text-right mt-1">
                <button 
                  type="button"
                  onClick={() => { setIsResetMode(true); setMessage(null); }}
                  className="text-[10px] font-bold uppercase text-gray-400 hover:text-red-600 transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>
          )}

          {/* Messages d'erreur / Succès */}
          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
               {message.text}
            </div>
          )}

          {/* Bouton d'action */}
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#1a1a1a] hover:bg-red-600 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : (
              isResetMode ? "Envoyer le lien" : "Se connecter"
            )}
          </button>

          {/* Bouton Retour (Mode Reset uniquement) */}
          {isResetMode && (
            <button 
              type="button"
              onClick={() => { setIsResetMode(false); setMessage(null); }}
              className="w-full py-2 text-gray-400 hover:text-[#1a1a1a] font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft size={12} /> Retour à la connexion
            </button>
          )}

        </form>

        {/* Footer */}
        <div className="mt-8 text-center pt-8 border-t border-gray-100">
           <p className="text-gray-400 text-xs font-medium">
             Pas encore de compte ? <Link href="/register" className="text-[#1a1a1a] font-black hover:text-red-600 transition-colors">Créer un club</Link>
           </p>
        </div>

      </div>
    </div>
  );
}