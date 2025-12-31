"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Search, 
  Trash2, 
  Ban, 
  Loader2, 
  CheckCircle2, 
  ChevronLeft 
} from 'lucide-react';
import Link from 'next/link';

interface Profile {
  id: string;
  nom: string;
  email: string;
  club_nom?: string;
  ville?: string;
  is_blocked: boolean;
}

export default function AdministrationBDD() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('nom', { ascending: true });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // LOGIQUE DE SUPPRESSION LIÉE AU BOUTON ROUGE
  const handleDelete = async (userId: string, userEmail: string) => {
    const confirmDelete = confirm(
      `SUPPRESSION DÉFINITIVE\n\nVoulez-vous supprimer le profil de ${userEmail} ?\n\n` +
      `Note : Pensez à supprimer aussi l'utilisateur dans l'onglet Authentication de Supabase.`
    );

    if (!confirmDelete) return;

    setActionLoading(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) throw error;

      // Mise à jour instantanée de la liste
      setProfiles(profiles.filter(p => p.id !== userId));
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 italic uppercase font-black">
      <div className="max-w-7xl mx-auto">
        
        {/* Header avec bouton Dashboard */}
        <div className="mb-8">
          <Link href="/backoffice" className="text-red-500 flex items-center gap-2 text-[10px] hover:underline mb-6">
            <ChevronLeft size={14} /> DASHBOARD
          </Link>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <h1 className="text-5xl md:text-6xl tracking-tighter italic">
              ADMINISTRATION <span className="text-red-500 font-black">BDD</span>
            </h1>
            <div className="flex gap-2">
              <button className="bg-red-500 text-white px-6 py-2 rounded-xl text-[10px] flex items-center gap-2">
                UTILISATEURS
              </button>
              <button className="bg-white/5 text-white/40 px-6 py-2 rounded-xl text-[10px] flex items-center gap-2 border border-white/5">
                CLUBS
              </button>
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-4 mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher..."
              className="w-full bg-[#1e293b] border border-white/5 rounded-2xl py-3 pl-12 pr-4 text-xs outline-none focus:border-red-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-[#1e293b]/40 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-[9px] tracking-widest">
            <thead>
              <tr className="text-white/20 border-b border-white/5">
                <th className="px-10 py-8">NOM / EMAIL</th>
                <th className="px-10 py-8">INFO / VILLE</th>
                <th className="px-10 py-8">STATUT</th>
                <th className="px-10 py-8 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-bold">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-500" size={30} />
                  </td>
                </tr>
              ) : filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-10 py-8">
                    <div className="flex flex-col gap-1">
                      <span className="text-white text-sm">{profile.email}</span>
                      <span className="text-white/30 italic">{profile.nom || 'SANS NOM'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-8 italic text-white/60">
                    {profile.club_nom || 'AUCUN CLUB'}
                  </td>
                  <td className="px-10 py-8">
                    <span className="flex items-center gap-2 text-green-500">
                      <CheckCircle2 size={12} /> ACTIF
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex justify-end gap-3">
                      {/* Bouton Bannir (Orange) */}
                      <button className="p-3 bg-orange-500/10 text-orange-500 rounded-2xl border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all">
                        <Ban size={18} />
                      </button>
                      
                      {/* BOUTON SUPPRIMER (Rouge) - ICI LA LOGIQUE EST AJOUTÉE */}
                      <button 
                        onClick={() => handleDelete(profile.id, profile.email)}
                        disabled={actionLoading === profile.id}
                        className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-30"
                      >
                        {actionLoading === profile.id ? (
                          <Loader2 className="animate-spin" size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}