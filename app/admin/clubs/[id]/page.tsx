"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { ArrowLeft, User, Users, Trophy, Layers } from 'lucide-react';
import Link from 'next/link';

export default function ClubDetailsAdmin() {
  const { id } = useParams();
  const [club, setClub] = useState<any>(null);
  const [equipes, setEquipes] = useState<any[]>([]);
  
  useEffect(() => {
    const getData = async () => {
      // 1. Info Club + Coachs
      const { data: clubData } = await supabase.from('clubs').select('*, profiles(*)').eq('id', id).single();
      setClub(clubData);

      // 2. Équipes + Joueurs
      // Note : on utilise 'equipes' et 'joueurs' ici
      const { data: teamData } = await supabase.from('equipes').select('*, joueurs(*)').eq('club_id', id);
      setEquipes(teamData || []);
    };
    if (id) getData();
  }, [id]);

  if (!club) return <div className="p-10 text-center font-bold">Chargement...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans not-italic">
      <div className="max-w-5xl mx-auto">
        <Link href="/admin" className="text-sm font-bold text-gray-400 hover:text-black mb-6 inline-flex items-center gap-2"><ArrowLeft size={16}/> Retour</Link>

        {/* En-tête Club */}
        <div className="bg-white rounded-3xl p-8 shadow-sm mb-8 flex justify-between">
          <div>
            <h1 className="text-3xl font-black uppercase text-[#1a1a1a] mb-1">{club.name}</h1>
            <p className="text-gray-400 font-bold text-sm">{club.ville} • {club.code_postal}</p>
          </div>
          <div className="flex gap-2">
             <div className="w-8 h-8 rounded-full border border-gray-100" style={{background: club.primary_color}}></div>
             <div className="w-8 h-8 rounded-full border border-gray-100" style={{background: club.secondary_color}}></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Liste Staff */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2 text-[#1a1a1a]"><User className="text-[#ff9d00]"/> Staff ({club.profiles?.length})</h2>
            <div className="space-y-2">
              {club.profiles?.map((coach: any) => (
                <div key={coach.id} className="p-3 bg-gray-50 rounded-xl flex justify-between items-center">
                  <div>
                    <div className="font-bold text-sm">{coach.full_name || "Sans nom"}</div>
                    <div className="text-xs text-gray-400">{coach.email}</div>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-white px-2 py-1 rounded border">{coach.role}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Liste Équipes & Joueurs */}
          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black uppercase mb-4 flex items-center gap-2 text-[#1a1a1a]"><Trophy className="text-[#ff9d00]"/> Équipes ({equipes.length})</h2>
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {equipes.map((equipe: any) => (
                <div key={equipe.id} className="border border-gray-100 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 p-3 font-bold text-sm flex justify-between">
                    <span>{equipe.name}</span>
                    <span className="text-xs bg-black text-white px-2 rounded-full flex items-center">{equipe.joueurs?.length || 0} joueurs</span>
                  </div>
                  <div className="p-2">
                    {equipe.joueurs?.length === 0 ? (
                      <div className="text-xs text-gray-300 italic p-1">Aucun joueur</div>
                    ) : (
                      equipe.joueurs?.map((joueur: any) => (
                        <div key={joueur.id} className="text-xs text-gray-600 py-1 px-2 border-b border-gray-50 last:border-0 flex justify-between">
                          <span>{joueur.first_name} {joueur.last_name}</span>
                          <span className="text-gray-300">{joueur.position}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}