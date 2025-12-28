"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, MessageCircle, Send, Shield, Loader2 } from 'lucide-react';

export default function PlayerProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('profiles')
      .select('*, clubs(name)')
      .eq('id', user?.id)
      .single();
    setProfile(data);
    setLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-6 italic">
      <div className="max-w-md mx-auto space-y-6">
        {/* HEADER JOUEUR */}
        <div className="bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-gray-100">
            <User size={40} className="text-[#1a1a1a]" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">{profile?.nom || 'Joueur'}</h1>
          <p className="text-[#ff9d00] font-black uppercase text-[10px] tracking-widest mt-2">{profile?.clubs?.name}</p>
        </div>

        {/* LIENS DE COMMUNICATION */}
        <div className="bg-[#1a1a1a] rounded-[2.5rem] p-8 shadow-2xl text-white space-y-4 not-italic">
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center mb-6 opacity-40">Canaux de communication</p>
          
          <a href="#" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-green-500/20 transition-all border border-white/5">
            <div className="flex items-center gap-4">
              <MessageCircle className="text-green-500" />
              <span className="font-black uppercase text-xs">WhatsApp Team</span>
            </div>
            <Shield size={14} className="opacity-20" />
          </a>

          <a href="#" className="flex items-center justify-between p-5 bg-white/5 rounded-2xl hover:bg-blue-500/20 transition-all border border-white/5">
            <div className="flex items-center gap-4">
              <Send className="text-blue-400" />
              <span className="font-black uppercase text-xs">Telegram Bot</span>
            </div>
            <Shield size={14} className="opacity-20" />
          </a>
        </div>
      </div>
    </div>
  );
}