"use client";
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function NouveauJoueurPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ nom: '', prenom: '', numero: '', poste: 'MILIEU' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from('joueurs').insert([formData]);
    if (!error) router.push('/dashboard/joueurs');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-5 mb-12">
          <Link href="/dashboard/joueurs" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-4xl tracking-tighter text-black italic">Nouveau <span className="text-[#ff9d00]">Joueur</span></h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-2xl space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] text-gray-400 mb-2 block">PRÉNOM</label>
              <input required type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-[#ff9d00]/20" value={formData.prenom} onChange={(e) => setFormData({...formData, prenom: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-2 block">NOM</label>
              <input required type="text" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-[#ff9d00]/20" value={formData.nom} onChange={(e) => setFormData({...formData, nom: e.target.value})} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] text-gray-400 mb-2 block">NUMÉRO</label>
              <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-[#ff9d00]/20" value={formData.numero} onChange={(e) => setFormData({...formData, numero: e.target.value})} />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 mb-2 block">POSTE</label>
              <select className="w-full p-4 bg-gray-50 rounded-2xl outline-none cursor-pointer" value={formData.poste} onChange={(e) => setFormData({...formData, poste: e.target.value})}>
                <option value="GARDIEN">GARDIEN</option>
                <option value="DÉFENSEUR">DÉFENSEUR</option>
                <option value="MILIEU">MILIEU</option>
                <option value="ATTAQUANT">ATTAQUANT</option>
              </select>
            </div>
          </div>
          <button disabled={loading} className="w-full bg-[#ff9d00] text-white py-5 rounded-2xl font-black text-xs tracking-[0.3em] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
            {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> ENREGISTRER LE JOUEUR</>}
          </button>
        </form>
      </div>
    </div>
  );
}