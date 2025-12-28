"use client";
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { UserPlus, Shield, Trash2, CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function GestionCoachsPage() {
  const router = useRouter();
  const [coachs, setCoachs] = useState<any[]>([]);
  const [newCoachEmail, setNewCoachEmail] = useState('');
  const [clubId, setClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAdminAndFetchCoachs();
  }, []);

  const checkAdminAndFetchCoachs = async () => {
    setLoading(true);
    // 1. Récupérer l'utilisateur actuel
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return router.push('/login');

    // 2. Récupérer son profil et son club
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, club_id')
      .eq('id', user.id)
      .single();

    // Sécurité : Si pas admin, on dégage
    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    setClubId(profile.club_id);
    
    // 3. Récupérer les coachs (superUser) de ce club
    if (profile.club_id) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('club_id', profile.club_id)
        .eq('role', 'superUser')
        .order('nom', { ascending: true });
      setCoachs(data || []);
    }
    setLoading(false);
  };

  const handleInviteCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachEmail || !clubId) return;
    
    setIsSubmitting(true);
    
    // Dans un flux réel, on utiliserait une Edge Function pour créer le compte Auth
    // Ici, nous préparons l'insertion dans une table d'invitations (à créer si besoin)
    // Pour l'instant, affichons une simulation
    alert(`Invitation envoyée à : ${newCoachEmail}. (Le flux Auth Admin sera configuré à l'étape suivante)`);
    
    setNewCoachEmail('');
    setIsSubmitting(false);
  };

  const toggleBlockCoach = async (id: string, isBlocked: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_blocked: !isBlocked })
      .eq('id', id);
    
    if (!error) {
      setCoachs(coachs.map(c => c.id === id ? { ...c, is_blocked: !isBlocked } : c));
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <Loader2 className="animate-spin text-[#ff9d00]" size={48} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="italic">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[#1a1a1a]">
              Staff <span className="text-[#ff9d00]">Technique</span>
            </h1>
            <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em] mt-2">
              Gestion des entraîneurs du club
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10 not-italic">
          {/* COLONNE GAUCHE : INVITATION */}
          <div className="lg:w-1/3">
            <div className="bg-[#1a1a1a] p-8 rounded-[2.5rem] shadow-2xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <Mail size={18} className="text-[#ff9d00]" />
                <h3 className="font-black uppercase italic text-xs tracking-widest">Inviter un Coach</h3>
              </div>
              
              <form onSubmit={handleInviteCoach} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-500 ml-2">Adresse Email Professionnelle</label>
                  <input 
                    type="email" 
                    value={newCoachEmail}
                    onChange={(e) => setNewCoachEmail(e.target.value)}
                    placeholder="nom.coach@club.com"
                    className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-[#ff9d00] transition-all font-bold text-sm text-white"
                    required
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#ff9d00] text-[#1a1a1a] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-[#ff9d00]/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <UserPlus size={16} />}
                  Envoyer l'accès
                </button>
              </form>
            </div>
          </div>

          {/* COLONNE DROITE : LISTE */}
          <div className="flex-1 space-y-4">
            <h3 className="font-black uppercase italic text-xs text-gray-400 mb-4 px-4">Coachs enregistrés ({coachs.length})</h3>
            
            {coachs.map((coach) => (
              <div key={coach.id} className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-gray-100 flex items-center justify-between group hover:border-[#ff9d00] transition-all">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-[1.5rem] flex items-center justify-center border-2 border-gray-100 group-hover:border-[#ff9d00]/20 transition-all">
                    <span className="text-2xl font-black text-[#1a1a1a]">{coach.nom?.[0] || 'C'}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Coach</span>
                      {coach.is_blocked && <span className="bg-red-50 text-red-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Bloqué</span>}
                    </div>
                    <h4 className="text-xl font-black uppercase italic text-[#1a1a1a]">{coach.nom || 'Sans nom'} {coach.prenom || ''}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{coach.email}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => toggleBlockCoach(coach.id, coach.is_blocked)}
                    className={`p-4 rounded-2xl transition-all ${coach.is_blocked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-[#ff9d00]'}`}
                    title={coach.is_blocked ? "Débloquer" : "Bloquer"}
                  >
                    {coach.is_blocked ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </button>
                  <button className="p-4 bg-gray-50 text-gray-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all">
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            {coachs.length === 0 && (
              <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-gray-100">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield size={24} className="text-gray-200" />
                </div>
                <p className="text-gray-300 font-black uppercase italic text-xs">Aucun entraîneur assigné à ce club</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}