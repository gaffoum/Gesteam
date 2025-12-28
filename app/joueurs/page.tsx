"use client";
import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { 
  Users, Plus, Search, X, Download, Upload,
  LayoutGrid, List, Trash2, ChevronDown, Filter,
  CheckSquare, Square, ClipboardCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Joueur {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  poste: string;
  num_licence: string;
  lateralite: string;
  statut: string;
  email: string;
  tel: string;
}

export default function JoueursPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPoste, setFilterPoste] = useState("Tous les postes");
  const [selectedJoueurs, setSelectedJoueurs] = useState<number[]>([]);
  const [activeStatusSelector, setActiveStatusSelector] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const importFileRef = useRef<HTMLInputElement>(null);

  const [joueurs, setJoueurs] = useState<Joueur[]>([]);

  // État pour le nouveau joueur
  const [newJoueur, setNewJoueur] = useState({
    nom: '', prenom: '', date_naissance: '', poste: 'Milieu',
    num_licence: '', lateralite: 'Droitier', email: '', tel: '', statut: 'Disponible'
  });

  const disponibilites = [
    { label: 'Disponible', color: 'text-green-500' },
    { label: 'Blessé', color: 'text-red-500' },
    { label: 'Suspendu', color: 'text-orange-600' },
    { label: 'Absent', color: 'text-gray-400' },
    { label: 'En reprise', color: 'text-yellow-500' }
  ];

  const listePostes = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

  // --- LOGIQUE DES COMPTEURS ---
  const countByPoste = (poste: string) => joueurs.filter(j => j.poste === poste).length;

  useEffect(() => {
    fetchJoueurs();
  }, []);

  const fetchJoueurs = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('joueurs').select('*').order('nom', { ascending: true });
    if (!error) setJoueurs(data || []);
    setIsLoading(false);
  };

  const handleAddJoueur = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('joueurs').insert([newJoueur]);
    if (!error) {
      setIsModalOpen(false);
      fetchJoueurs();
      setNewJoueur({ nom: '', prenom: '', date_naissance: '', poste: 'Milieu', num_licence: '', lateralite: 'Droitier', email: '', tel: '', statut: 'Disponible' });
    } else {
      alert("Erreur lors de l'ajout");
    }
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").slice(1);
      const toImport = rows.filter(row => row.trim() !== "").map((row) => {
        const cols = row.split(",");
        return {
          nom: cols[0]?.trim(), prenom: cols[1]?.trim(), poste: cols[2]?.trim(),
          num_licence: cols[3]?.trim(), tel: cols[4]?.trim(), statut: "Disponible"
        };
      });
      const { error } = await supabase.from('joueurs').insert(toImport);
      if (!error) fetchJoueurs();
    };
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const headers = ["Nom", "Prenom", "Poste", "Num_Licence", "Telephone"];
    const csvContent = [headers].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "modele_joueurs.csv";
    link.click();
  };

  const changeStatut = async (id: number, nouveauStatut: string) => {
    const { error } = await supabase.from('joueurs').update({ statut: nouveauStatut }).eq('id', id);
    if (!error) setJoueurs(joueurs.map(j => j.id === id ? { ...j, statut: nouveauStatut } : j));
    setActiveStatusSelector(null);
  };

  const deleteSelected = async () => {
    if (confirm(`Supprimer ${selectedJoueurs.length} joueurs ?`)) {
      const { error } = await supabase.from('joueurs').delete().in('id', selectedJoueurs);
      if (!error) { fetchJoueurs(); setSelectedJoueurs([]); }
    }
  };

  const handleConvocation = () => {
    const convoques = joueurs.filter(j => selectedJoueurs.includes(j.id));
    localStorage.setItem('derniere_convocation', JSON.stringify(convoques));
    router.push('/convocations');
  };

  const joueursFiltrés = joueurs.filter(j => {
    const matchSearch = (j.nom + " " + j.prenom).toLowerCase().includes(searchTerm.toLowerCase());
    const matchPoste = filterPoste === "Tous les postes" || j.poste === filterPoste;
    return matchSearch && matchPoste;
  });

  return (
    <DashboardLayout>
      <div className="italic pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a]">L' <span className="text-[#ff9d00]">Effectif</span></h1>
            {/* --- COMPTEURS PAR POSTE --- */}
            <div className="mt-4 flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 not-italic">
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span className="text-[#1a1a1a]">Total:</span> <span className="text-[#ff9d00]">{joueurs.length}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span>G:</span> <span className="text-[#1a1a1a]">{countByPoste('Gardien')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span>D:</span> <span className="text-[#1a1a1a]">{countByPoste('Défenseur')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span>M:</span> <span className="text-[#1a1a1a]">{countByPoste('Milieu')}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <span>A:</span> <span className="text-[#1a1a1a]">{countByPoste('Attaquant')}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {selectedJoueurs.length > 0 && (
              <>
                <button onClick={handleConvocation} className="bg-[#ff9d00] text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 shadow-xl hover:scale-105 transition-all"><ClipboardCheck size={18} /> Convoquer</button>
                <button onClick={deleteSelected} className="bg-red-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 shadow-xl hover:bg-red-600 transition-all"><Trash2 size={16} /> Supprimer</button>
              </>
            )}
            <button onClick={downloadCSVTemplate} className="bg-white border-2 border-gray-100 text-[#1a1a1a] px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-gray-50 transition-all"><Download size={16} /> Modèle</button>
            <input type="file" ref={importFileRef} className="hidden" accept=".csv" onChange={handleImportCSV} />
            <button onClick={() => importFileRef.current?.click()} className="bg-orange-50 text-[#ff9d00] border-2 border-[#ff9d00]/20 px-6 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-orange-100 transition-all"><Upload size={16} /> Importer</button>
            <button onClick={() => setIsModalOpen(true)} className="bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center gap-3 hover:bg-[#ff9d00] transition-all shadow-xl"><Plus size={16} /> Nouveau</button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8 not-italic">
          <div className="relative flex-[3]">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input type="text" placeholder="Rechercher..." className="w-full bg-white border border-gray-100 p-6 pl-16 rounded-[2rem] outline-none font-bold text-sm shadow-sm" onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="relative flex-1">
            <Filter className="absolute left-6 top-1/2 -translate-y-1/2 text-[#ff9d00]" size={18} />
            <select value={filterPoste} onChange={(e) => setFilterPoste(e.target.value)} className="w-full bg-white border border-gray-100 p-6 pl-16 rounded-[2rem] outline-none font-bold text-sm appearance-none cursor-pointer uppercase italic">
              <option>Tous les postes</option>{listePostes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex bg-white p-2 rounded-[1.5rem] border border-gray-100 shadow-sm">
            <button onClick={() => setViewMode('table')} className={`p-4 rounded-xl ${viewMode === 'table' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400'}`}><List size={20} /></button>
            <button onClick={() => setViewMode('grid')} className={`p-4 rounded-xl ${viewMode === 'grid' ? 'bg-[#1a1a1a] text-white shadow-lg' : 'text-gray-400'}`}><LayoutGrid size={20} /></button>
          </div>
        </div>

        {/* Listing */}
        {isLoading ? (
          <div className="text-center py-20 font-black uppercase italic text-gray-300 animate-pulse">Chargement Supabase...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 not-italic">
            {joueursFiltrés.map((j) => (
              <div key={j.id} className={`bg-white rounded-[2.5rem] p-6 shadow-xl border-2 transition-all relative ${selectedJoueurs.includes(j.id) ? 'border-[#ff9d00]' : 'border-transparent'}`}>
                <div className="absolute top-6 left-6 z-10 cursor-pointer" onClick={() => setSelectedJoueurs(prev => prev.includes(j.id) ? prev.filter(id => id !== j.id) : [...prev, j.id])}>
                  {selectedJoueurs.includes(j.id) ? <CheckSquare className="text-[#ff9d00]" size={24} /> : <Square className="text-gray-100" size={24} />}
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full mb-4 flex items-center justify-center text-gray-200"><Users size={32} /></div>
                  <h3 className="font-black uppercase italic text-md leading-tight">{j.nom} <br/> <span className="text-[#ff9d00]">{j.prenom}</span></h3>
                  <div className="mt-4 w-full text-[9px] font-black uppercase border-t pt-4 relative">
                    <div className="flex justify-between text-gray-400 mb-2"><span>Poste</span> <span className="text-[#1a1a1a] italic">{j.poste}</span></div>
                    <div className="relative">
                      <button onClick={() => setActiveStatusSelector(activeStatusSelector === j.id ? null : j.id)} className={`w-full flex justify-between items-center p-2 rounded-lg bg-gray-50 border border-gray-100 ${disponibilites.find(d => d.label === j.statut)?.color}`}><span className="italic">{j.statut}</span><ChevronDown size={10} /></button>
                      {activeStatusSelector === j.id && (
                        <div className="absolute bottom-full left-0 w-full mb-1 bg-white rounded-xl shadow-2xl border border-gray-100 p-1 z-30">{disponibilites.map(d => <button key={d.label} onClick={() => changeStatut(j.id, d.label)} className={`w-full text-left p-2 rounded-lg text-[8px] font-black uppercase hover:bg-gray-50 ${d.color}`}>{d.label}</button>)}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden not-italic">
            <table className="w-full text-left">
              <thead><tr className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 border-b"><th className="p-8 w-20">Sél.</th><th className="p-8">Nom</th><th className="p-8">Poste</th><th className="p-8">Statut</th></tr></thead>
              <tbody>
                {joueursFiltrés.map((j) => (
                  <tr key={j.id} className={`border-b hover:bg-gray-50 ${selectedJoueurs.includes(j.id) ? 'bg-orange-50/30' : ''}`}>
                    <td className="p-8 cursor-pointer" onClick={() => setSelectedJoueurs(prev => prev.includes(j.id) ? prev.filter(id => id !== j.id) : [...prev, j.id])}>{selectedJoueurs.includes(j.id) ? <CheckSquare className="text-[#ff9d00]" size={22} /> : <Square className="text-gray-200" size={22} />}</td>
                    <td className="p-8 font-black uppercase italic text-sm">{j.nom} <span className="text-[#ff9d00] ml-2">{j.prenom}</span></td>
                    <td className="p-8 text-[10px] font-black uppercase text-gray-400">{j.poste}</td>
                    <td className="p-8 font-black uppercase italic text-[10px]"><span className={disponibilites.find(d => d.label === j.statut)?.color}>{j.statut}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MODALE DE CRÉATION */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-[#1a1a1a]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl relative italic max-h-[95vh] overflow-y-auto">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-300 hover:text-red-500"><X size={32} /></button>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic text-[#1a1a1a]">Fiche <span className="text-[#ff9d00]">Sportif</span></h2>
              
              <form onSubmit={handleAddJoueur} className="space-y-6 not-italic">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Prénom</label><input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.prenom} onChange={e => setNewJoueur({...newJoueur, prenom: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Nom</label><input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.nom} onChange={e => setNewJoueur({...newJoueur, nom: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Date de Naissance</label><input type="date" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.date_naissance} onChange={e => setNewJoueur({...newJoueur, date_naissance: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Latéralité</label><select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.lateralite} onChange={e => setNewJoueur({...newJoueur, lateralite: e.target.value})}><option>Droitier</option><option>Gaucher</option><option>Ambidextre</option></select></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Poste</label><select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.poste} onChange={e => setNewJoueur({...newJoueur, poste: e.target.value})}>{listePostes.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">N° de Licence</label><input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.num_licence} onChange={e => setNewJoueur({...newJoueur, num_licence: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Email</label><input type="email" required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.email} onChange={e => setNewJoueur({...newJoueur, email: e.target.value})} /></div>
                  <div className="space-y-1"><label className="text-[10px] font-black uppercase text-gray-400 ml-2 text-xs">Téléphone</label><input required className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-[#ff9d00]" value={newJoueur.tel} onChange={e => setNewJoueur({...newJoueur, tel: e.target.value})} /></div>
                </div>

                <button type="submit" className="w-full bg-[#1a1a1a] text-white p-6 rounded-2xl font-black uppercase tracking-widest hover:bg-[#ff9d00] transition-all shadow-xl italic">Enregistrer dans l'Effectif</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}