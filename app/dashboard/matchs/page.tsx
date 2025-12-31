"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Plus, Search, ArrowLeft, Loader2, 
  MapPin, Clock, Trophy, Trash2, ChevronRight, AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function MatchsListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [matchs, setMatchs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMatchs();
  }, []);

  const fetchMatchs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        // On récupère les matchs ET le nom de l'équipe associée
        const { data, error } = await supabase
          .from('matchs')
          .select('*, equipes(nom, categorie)')
          .eq('club_id', profile.club_id)
          .order('date_heure', { ascending: true });
        
        if (error) throw error;
        setMatchs(data || []);
      }
    } catch (err) {
      console.error("Erreur chargement matchs:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMatch = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer ce match du calendrier ?")) return;
    
    try {
      const { error } = await supabase.from('matchs').delete().eq('id', id);
      if (error) throw error;
      // Mise à jour locale de la liste
      setMatchs(matchs.filter(m => m.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  // Filtrage par nom d'adversaire ou nom d'équipe
  const filteredMatchs = matchs.filter(m => 
    (m.adversaire && m.adversaire.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (m.equipes?.nom && m.equipes.nom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#ff9d00] mx-auto mb-4" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Chargement du calendrier...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-8 italic">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/dashboard" className="p-3 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all">
                <ArrowLeft size={20} />
              </Link>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-[#1a1a1a]">
                Calendrier <span className="text-[#ff9d00]">Matchs</span>
              </h1>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-16 italic not-italic">
              Gestion des rencontres & résultats
            </p>
          </div>
          <Link href="/dashboard/matchs/nouveau" className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-xl">
            <Plus size={18} /> Programmer un match
          </Link>
        </div>

        {/* Barre de Recherche */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-10 flex items-center not-italic">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher par adversaire ou équipe..." 
              className="w-full p-5 pl-16 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/10 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Liste des Matchs */}
        <div className="space-y-4 not-italic">
          {filteredMatchs.map((match) => {
            const dateObj = new Date(match.date_heure);
            const isFinished = match.statut === 'termine';
            
            return (
              <div key={match.id} className="group bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#ff9d00] transition-all flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* Bloc Date */}
                <div className="flex items-center gap-6 min-w-[180px]">
                  <div className={`w-20 h-20 rounded-[1.5rem] flex flex-col items-center justify-center font-black leading-none transition-colors shadow-lg ${isFinished ? 'bg-gray-100 text-gray-400' : 'bg-[#1a1a1a] text-white group-hover:bg-[#ff9d00]'}`}>
                    <span className="text-2xl">{format(dateObj, 'dd')}</span>
                    <span className="text-[10px] uppercase">{format(dateObj, 'MMM', { locale: fr })}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[#ff9d00] font-black text-xs uppercase mb-1">
                      <Clock size={14} /> {format(dateObj, 'HH:mm')}
                    </div>
                    <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg inline-block">
                      {match.competition}
                    </div>
                  </div>
                </div>

                {/* Affiche du Match */}
                <div className="flex-1 text-center md:text-left w-full">
                  <div className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-8">
                    <div className="text-right">
                      <span className="block font-black uppercase text-lg text-[#1a1a1a] leading-none">
                        {match.equipes?.nom || 'Équipe supprimée'}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {match.equipes?.categorie}
                      </span>
                    </div>
                    
                    <span className="text-gray-200 font-black text-2xl italic">VS</span>
                    
                    <div className="text-left">
                      <span className="block font-black uppercase text-lg text-[#1a1a1a] leading-none">
                        {match.adversaire}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        Extérieur
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 mt-3 text-gray-400 text-[10px] font-bold uppercase">
                    <MapPin size={12} /> {match.lieu || 'Domicile'}
                  </div>
                </div>

                {/* Score ou Statut */}
                <div className="flex items-center gap-4">
                  <div className={`px-6 py-4 rounded-2xl font-black text-xl tracking-widest border min-w-[100px] text-center ${isFinished ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'bg-gray-50 text-gray-300 border-gray-100'}`}>
                    {isFinished ? (
                      <span>{match.score_home} - {match.score_away}</span>
                    ) : (
                      <span className="text-xs">À venir</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Link href={`/dashboard/matchs/${match.id}`} className="p-3 bg-gray-50 text-[#1a1a1a] rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-all">
                      <ChevronRight size={18} />
                    </Link>
                    <button onClick={() => deleteMatch(match.id)} className="p-3 bg-gray-50 text-gray-300 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {filteredMatchs.length === 0 && !loading && (
            <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
              <Calendar className="mx-auto text-gray-200 mb-4 shadow-sm" size={60} />
              <p className="text-gray-400 font-black uppercase text-xs tracking-[0.2em]">
                Aucun match prévu
              </p>
              <Link href="/dashboard/matchs/nouveau" className="inline-block mt-6 text-[#ff9d00] font-black uppercase text-[10px] hover:underline">
                Programmer une rencontre
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}