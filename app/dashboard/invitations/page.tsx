"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/app/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { Link, Copy, Check, UserPlus, Timer } from 'lucide-react';

export default function InvitationPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', user?.id).single();
    
    if (profile?.club_id) {
      const { data } = await supabase.from('teams').select('*').eq('club_id', profile.club_id);
      setTeams(data || []);
    }
  };

  const generateLink = async () => {
    if (!selectedTeam) return alert("Choisis une équipe !");
    setLoading(true);

    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('club_id').eq('id', user?.id).single();

    const { error } = await supabase.from('player_invitations').insert({
      token,
      team_id: selectedTeam,
      club_id: profile?.club_id,
      created_by: user?.id
    });

    if (!error) {
      const fullLink = `${window.location.origin}/register/player?token=${token}`;
      setGeneratedLink(fullLink);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-8 italic">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-10">Recrutement <span className="text-[#ff9d00]">Joueurs</span></h1>

        <div className="max-w-2xl bg-white rounded-[3rem] p-10 shadow-xl border border-gray-100 not-italic">
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase ml-4 text-gray-400">Équipe concernée</label>
              <select 
                className="w-full p-5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-[#ff9d00] outline-none font-bold uppercase text-sm mt-2"
                onChange={(e) => setSelectedTeam(e.target.value)}
              >
                <option value="">Sélectionner l'équipe...</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <button 
              onClick={generateLink}
              disabled={loading || !selectedTeam}
              className="w-full bg-[#1a1a1a] text-white p-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-3"
            >
              {loading ? "Génération..." : <><UserPlus size={18} /> Générer un lien magique</>}
            </button>

            {generatedLink && (
              <div className="mt-8 p-6 bg-[#ff9d00]/5 border-2 border-dashed border-[#ff9d00] rounded-3xl animate-in fade-in zoom-in duration-300">
                <p className="text-[10px] font-black uppercase text-[#ff9d00] mb-2 flex items-center gap-2">
                  <Timer size={14} /> Lien valable 48h - Usage unique
                </p>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={generatedLink} 
                    className="flex-1 bg-white p-4 rounded-xl text-xs font-mono border border-gray-200 outline-none"
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="p-4 bg-[#1a1a1a] text-white rounded-xl hover:bg-[#ff9d00] transition-all"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}