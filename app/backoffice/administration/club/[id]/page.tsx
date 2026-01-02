"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation'; // Attention à l'import pour Next 13+
import { 
  ArrowLeft, Trash2, Loader2, Users, 
  ShieldAlert, UserCheck, User, Mail
} from 'lucide-react';

export default function ClubDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClubDetails();
  }, []);

  const fetchClubDetails = async () => {
    setLoading(true);
    // 1. Récupérer le club
    const { data: clubData } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', params.id)
      .single();

    // 2. Récupérer les membres liés
    const { data: usersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('club_id', params.id)
      .order('role'); // Trie par rôle (souvent admin en premier)

    setClub(clubData);
    setMembers(usersData || []);
    setLoading(false);
  };

  const handleDeleteClub = async () => {
    if (!confirm("ATTENTION : Cette action supprimera DÉFINITIVEMENT le club ET tous les comptes utilisateurs liés (Admin, Coachs, Joueurs). Voulez-vous continuer ?")) return;

    setDeleting(true);
    try {
      // Grâce au SQL 'ON DELETE CASCADE' configuré à l'étape 1, 
      // supprimer le club suffit à tout nettoyer (profils + auth).
      const { error } = await supabase.from('clubs').delete().eq('id', params.id);
      if (error) throw error;
      
      router.push('/backoffice/administration'); // Retour liste
    } catch (err) {
      alert("Erreur lors de la suppression");
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-[#ef4444]"><Loader2 className="animate-spin" size={40}/></div>;
  if (!club) return <div className="text-white">Club introuvable</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-black italic uppercase">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Navigation */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#ef4444] text-xs hover:text-white mb-8 tracking-widest transition-colors">
          <ArrowLeft size={16} /> Retour à la liste
        </button>

        {/* En-tête Club */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12 bg-[#1e293b] p-8 rounded-[2rem] border border-white/5 shadow-2xl">
          <div>
            <h1 className="text-4xl md:text-5xl tracking-tighter mb-2">{club.nom}</h1>
            <div className="flex gap-4 text-white/40 text-xs tracking-widest not-italic font-bold">
              <span>📍 {club.ville}</span>
              <span>🆔 {club.id}</span>
            </div>
          </div>
          <button 
            onClick={handleDeleteClub}
            disabled={deleting}
            className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-6 py-4 rounded-2xl flex items-center gap-3 text-xs tracking-widest shadow-lg shadow-[#ef4444]/20 transition-all active:scale-95 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="animate-spin" /> : <Trash2 size={16} />}
            SUPPRIMER LE CLUB & COMPTES
          </button>
        </div>

        {/* Liste des comptes liés */}
        <div className="flex items-center gap-3 mb-6 text-2xl tracking-tight">
          <Users className="text-[#ef4444]" />
          <h2>Comptes Associés ({members.length})</h2>
        </div>

        <div className="bg-[#1e293b]/50 border border-white/5 rounded-[2rem] overflow-hidden">
          <table className="w-full text-left text-[10px] tracking-widest">
            <thead className="bg-white/5 text-white/30">
              <tr>
                <th className="p-6">Rôle</th>
                <th className="p-6">Nom</th>
                <th className="p-6">Email</th>
                <th className="p-6 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-6">
                    {member.role === 'admin' && <span className="text-[#ef4444] flex items-center gap-2"><ShieldAlert size={14}/> ADMIN</span>}
                    {member.role === 'superuser' && <span className="text-orange-400 flex items-center gap-2"><UserCheck size={14}/> COACH</span>}
                    {member.role === 'user' && <span className="text-white/60 flex items-center gap-2"><User size={14}/> JOUEUR</span>}
                    {!member.role && <span className="text-white/20">INCONNU</span>}
                  </td>
                  <td className="p-6 font-bold">{member.nom || 'Sans nom'}</td>
                  <td className="p-6 lowercase not-italic flex items-center gap-2 text-white/60">
                    <Mail size={12}/> {member.email}
                  </td>
                  <td className="p-6 text-right text-green-500">ACTIF</td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-white/20 italic">Aucun compte lié trouvé</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}