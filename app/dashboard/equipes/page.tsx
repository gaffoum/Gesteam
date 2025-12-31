"use client";
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Plus, 
  Search, 
  ArrowLeft, 
  Loader2, 
  Users, 
  ChevronRight, 
  Layout,
  Trash2,
  Settings2
} from 'lucide-react';
import Link from 'next/link';

export default function EquipesListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [equipes, setEquipes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEquipes();
  }, []);

  const fetchEquipes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      // Récupération du club de l'utilisateur
      const { data: profile } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profile?.club_id) {
        const { data, error } = await supabase
          .from('equipes')
          .select('*')
          .eq('club_id', profile.club_id)
          .order('nom', { ascending: true });
        
        if (error) throw error;
        setEquipes(data || []);
      }
    } catch (err) {
      console.error("Erreur chargement équipes:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteEquipe = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette équipe ? Les joueurs ne seront pas supprimés mais n'auront plus d'équipe assignée.")) return;
    
    try {
      const { error } = await supabase.from('equipes').delete().eq('id', id);
      if (error) throw error;
      setEquipes(equipes.filter(e => e.id !== id));
    } catch (err: any) {
      alert("Erreur lors de la suppression : " + err.message);
    }
  };

  const filteredEquipes = equipes.filter(e => 
    e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.categorie && e.categorie.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#ff9d00] mx-auto mb-4" size={40} />
        <p className="font-black uppercase text-[10px] tracking-widest text-gray-400 italic">Chargement des catégories...</p>
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
                Nos <span className="text-[#ff9d00]">Équipes</span>
              </h1>
            </div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest ml-16 italic not-italic">
              Structure sportive du club
            </p>
          </div>
          <Link href="/dashboard/equipes/nouveau" className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-3 shadow-xl">
            <Plus size={18} /> Créer une catégorie
          </Link>
        </div>

        {/* Barre de Recherche */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100 mb-10 flex items-center not-italic">
          <div className="relative flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une équipe (ex: Seniors, U17...)" 
              className="w-full p-5 pl-16 rounded-2xl bg-gray-50 border-none outline-none font-bold text-sm focus:ring-2 ring-[#ff9d00]/10 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Liste des Équipes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 not-italic">
          {filteredEquipes.map((equipe) => (
            <div key={equipe.id} className="group bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 hover:border-[#ff9d00] transition-all relative overflow-hidden flex flex-col">
              
              {/* Badge Catégorie */}
              <div className="absolute top-6 right-6 bg-gray-50 px-4 py-2 rounded-full border border-gray-100 group-hover:bg-[#ff9d00]/10 group-hover:border-[#ff9d00]/20 transition-all">
                <span className="text-[9px] font-black uppercase text-gray-400 group-hover:text-[#ff9d00]">
                  {equipe.categorie || 'Club'}
                </span>
              </div>

              <div className="flex-1 mb-8">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-[1.8rem] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-black/10">
                  <Trophy className="text-[#ff9d00]" size={28} />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-1 leading-tight text-[#1a1a1a]">
                  {equipe.nom}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Settings2 size={12} className="text-[#ff9d00]" />
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest italic">
                    Coach: <span className="text-[#1a1a1a] not-italic">{equipe.entraineur || 'À définir'}</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <button 
                  onClick={() => deleteEquipe(equipe.id)}
                  className="p-3 bg-gray-50 rounded-xl text-gray-300 hover:bg-red-500 hover:text-white transition-all"
                  title="Supprimer l'équipe"
                >
                  <Trash2 size={18} />
                </button>
                
                <Link 
                  href={`/dashboard/equipes/${equipe.id}`}
                  className="p-3 bg-gray-50 rounded-xl hover:bg-[#1a1a1a] hover:text-white transition-all flex items-center gap-3 group/btn"
                >
                  <span className="text-[10px] font-black uppercase pl-2">Effectif</span>
                  <div className="bg-white/10 p-1 rounded-lg">
                    <ChevronRight size={16} />
                  </div>
                </Link>
              </div>
            </div>
          ))}

          {/* État vide */}
          {filteredEquipes.length === 0 && !loading && (
            <div className="col-span-full py-24 text-center bg-white rounded-[4rem] border-2 border-dashed border-gray-100">
              <Layout className="mx-auto text-gray-200 mb-4 shadow-sm" size={60} />
              <p className="text-gray-400 font-black uppercase text-xs tracking-[0.2em]">
                Aucune équipe trouvée
              </p>
              <Link href="/dashboard/equipes/nouveau" className="inline-block mt-6 text-[#ff9d00] font-black uppercase text-[10px] hover:underline">
                Créer votre première équipe maintenant
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}