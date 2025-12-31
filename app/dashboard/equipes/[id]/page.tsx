"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { 
  Users, ArrowLeft, Loader2, Trophy, 
  UserPlus, Mail, Phone, Shield 
} from 'lucide-react';
import Link from 'next/link';

export default function EquipeDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [equipe, setEquipe] = useState<any>(null);
  const [membres, setMembres] = useState<any[]>([]);

  useEffect(() => {
    fetchEquipeDetails();
  }, [id]);

  const fetchEquipeDetails = async () => {
    try {
      // 1. Récupérer les infos de l'équipe
      const { data: equipeData, error: eError } = await supabase
        .from('equipes')
        .select('*')
        .eq('id', id)
        .single();

      if (eError) throw eError;
      setEquipe(equipeData);

      // 2. Récupérer les joueurs liés à cette équipe
      const { data: joueursData, error: jError } = await supabase
        .from('joueurs')
        .select('*')
        .eq('equipe_id', id)
        .order('nom', { ascending: true });

      if (jError) throw jError;
      setMembres(joueursData || []);

    } catch (err) {
      console.error("Erreur:", err);
      router.push('/dashboard/equipes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-6xl mx-auto">
        
        {/* Header avec infos équipe */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-6">
            <Link href="/dashboard/equipes" className="p-4 bg-white rounded-2xl shadow-sm hover:text-[#ff9d00] transition-all">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-5xl font-black uppercase tracking-tighter text-[#1a1a1a]">
                  {equipe?.nom}
                </h1>
                <span className="bg-[#ff9d00] text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase not-italic">
                  {equipe?.categorie}
                </span>
              </div>
              <p className="text-gray-400 font-bold not-italic uppercase text-xs tracking-widest mt-2 italic">
                Entraîneur : <span className="text-[#1a1a1a]">{equipe?.entraineur || 'Non défini'}</span>
              </p>
            </div>
          </div>
          
          <button className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-xl">
            <UserPlus size={18} /> Ajouter un joueur
          </button>
        </div>

        {/* Statistiques rapides de l'équipe */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 not-italic">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-500 rounded-xl"><Users size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Effectif</p>
              <p className="text-2xl font-black">{membres.length} Joueurs</p>
            </div>
          </div>
          {/* Tu pourras ajouter ici des stats comme "Matchs joués" ou "Victoires" plus tard */}
        </div>

        {/* Liste des membres sous forme de tableau propre */}
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden not-italic">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-black uppercase text-sm italic">Joueurs <span className="text-[#ff9d00]">Convoqués</span></h3>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="p-6 text-[10px] font-black uppercase text-gray-400">Joueur</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400">Poste</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400">Contact</th>
                <th className="p-6 text-[10px] font-black uppercase text-gray-400 text-right">Licence</th>
              </tr>
            </thead>
            <tbody>
              {membres.map((joueur) => (
                <tr key={joueur.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-all group">
                  <td className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden border border-gray-100">
                        {joueur.photo_url ? (
                          <img src={joueur.photo_url} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Users size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-black uppercase text-sm">{joueur.prenom} {joueur.nom}</p>
                        <p className="text-[10px] text-gray-400 font-bold">#{joueur.maillot || '--'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-gray-100 rounded-lg text-[9px] font-black uppercase text-gray-500 italic group-hover:bg-[#ff9d00] group-hover:text-white transition-all">
                      {joueur.poste || 'N/A'}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-3 text-gray-400">
                      {joueur.telephone && <Phone size={14} className="hover:text-[#ff9d00] cursor-pointer" />}
                      {joueur.email && <Mail size={14} className="hover:text-[#ff9d00] cursor-pointer" />}
                    </div>
                  </td>
                  <td className="p-6 text-right font-mono text-[11px] text-gray-400">
                    {joueur.licence || 'Sans licence'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {membres.length === 0 && (
            <div className="p-20 text-center">
              <Users className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-black uppercase text-xs tracking-widest italic">
                Aucun joueur n'est encore assigné à cette équipe.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}