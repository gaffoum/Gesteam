"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, BookOpen, Shield, Users, Calendar, 
  LayoutTemplate, MessageCircle, ChevronRight, HelpCircle
} from 'lucide-react';

// --- CONTENU DU GUIDE ---
const GUIDE_SECTIONS = [
  {
    id: 'intro',
    title: 'Introduction',
    icon: <HelpCircle size={20} />,
    content: (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#ff9d00] p-8 rounded-[2rem] text-white shadow-lg">
          <h2 className="text-3xl font-black italic uppercase mb-2">Bienvenue sur Gesteam Pro</h2>
          <p className="font-medium opacity-90">
            Votre assistant numérique pour la gestion de club. Ce guide vous explique comment utiliser chaque fonctionnalité pour gagner du temps.
          </p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-xl font-black italic uppercase mb-4 text-black">Les bases</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</span>
              <p className="text-sm text-gray-500 font-medium">Naviguez via le menu latéral pour accéder aux Équipes, Joueurs et Matchs.</p>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</span>
              <p className="text-sm text-gray-500 font-medium">Utilisez le bouton <span className="font-bold text-black">NOUVEAU</span> présent sur chaque page pour ajouter des données.</p>
            </li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 'equipes',
    title: 'Équipes & Scraping',
    icon: <Shield size={20} />,
    content: (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-black italic uppercase text-black mb-2">Configuration des Équipes</h2>
        
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-blue-50 text-blue-600 px-4 py-2 rounded-bl-2xl text-[10px] font-black uppercase">Automatique</div>
          <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-2">
            <LayoutTemplate size={18} className="text-[#ff9d00]"/> Import FFF (Scraping)
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">
            Pour récupérer automatiquement le classement et les adversaires de votre poule :
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm font-bold text-gray-700 bg-gray-50 p-4 rounded-xl">
            <li>Allez sur le site officiel de la FFF (compétitions).</li>
            <li>Copiez l'URL de la page de classement de votre poule.</li>
            <li>Dans Gesteam, allez dans <strong>Équipes &gt; Configurer Poule</strong>.</li>
            <li>Collez l'URL et validez.</li>
          </ol>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black uppercase mb-3">Ajout Manuel</h3>
          <p className="text-sm text-gray-500">
            Vous pouvez créer des équipes manuellement pour les catégories qui ne sont pas en compétition officielle (ex: École de foot).
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'matchs',
    title: 'Matchs & Tactique',
    icon: <Calendar size={20} />,
    content: (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-black italic uppercase text-black mb-2">Gestion des Matchs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <span className="text-[#ff9d00] font-black text-4xl opacity-20 absolute">01</span>
              <h3 className="text-sm font-black uppercase mb-2 relative z-10">Création</h3>
              <p className="text-xs text-gray-500">
                Sélectionnez votre équipe. L'adversaire est suggéré automatiquement si vous avez configuré le scraping. Sinon, saisissez-le manuellement (Amical).
              </p>
           </div>
           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
              <span className="text-[#ff9d00] font-black text-4xl opacity-20 absolute">02</span>
              <h3 className="text-sm font-black uppercase mb-2 relative z-10">Sélection</h3>
              <p className="text-xs text-gray-500">
                Cochez les joueurs disponibles pour le match. Ils sont triés par poste (Gardiens, Défenseurs, etc.).
              </p>
           </div>
        </div>

        <div className="bg-black text-white p-6 rounded-[2rem] shadow-lg">
           <h3 className="text-lg font-black uppercase mb-3 flex items-center gap-2">
             <LayoutTemplate size={18} className="text-[#ff9d00]"/> Tableau Tactique Interactif
           </h3>
           <p className="text-sm text-gray-300 mb-4">
             Une fois l'effectif choisi, accédez au terrain virtuel :
           </p>
           <ul className="space-y-2 text-xs font-bold uppercase tracking-wide">
             <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ff9d00] rounded-full"></div> Glissez les joueurs sur le terrain pour les titulariser.</li>
             <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ff9d00] rounded-full"></div> Glissez vers la droite pour les mettre remplaçants.</li>
             <li className="flex items-center gap-2"><div className="w-2 h-2 bg-[#ff9d00] rounded-full"></div> Sauvegardez pour figer la compo.</li>
           </ul>
        </div>
      </div>
    )
  },
  {
    id: 'whatsapp',
    title: 'Convocations & RSVP',
    icon: <MessageCircle size={20} />,
    content: (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h2 className="text-2xl font-black italic uppercase text-black mb-2">Communication</h2>
        
        <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 shadow-sm">
          <h3 className="text-lg font-black uppercase mb-3 text-green-700 flex items-center gap-2">
            <MessageCircle size={18}/> Système WhatsApp
          </h3>
          <p className="text-sm text-green-800 mb-4">
            Depuis la page Tactique, cliquez sur <strong>CONVOQUER</strong>.
          </p>
          <div className="space-y-3">
             <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <h4 className="text-xs font-black uppercase text-black mb-1">Message Groupe</h4>
                <p className="text-[10px] text-gray-500">Copie un message générique (Date, Heure, Lieu) à coller dans votre groupe d'équipe.</p>
             </div>
             <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                <h4 className="text-xs font-black uppercase text-black mb-1">Envoi Individuel (Recommandé)</h4>
                <p className="text-[10px] text-gray-500">
                  Envoie un message privé à chaque joueur contenant un <strong>LIEN UNIQUE</strong> de confirmation.
                </p>
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-black uppercase mb-3">Suivi des Présences (Live)</h3>
          <p className="text-sm text-gray-500 mb-4">
            Quand un joueur clique sur le lien et valide sa présence :
          </p>
          <div className="flex gap-4">
             <div className="flex-1 bg-gray-50 p-3 rounded-xl text-center">
                <span className="block text-xl">✅</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">Pastille Verte</span>
             </div>
             <div className="flex-1 bg-gray-50 p-3 rounded-xl text-center">
                <span className="block text-xl">🔔</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">Notification</span>
             </div>
             <div className="flex-1 bg-gray-50 p-3 rounded-xl text-center">
                <span className="block text-xl">📊</span>
                <span className="text-[10px] font-bold uppercase text-gray-400">Compteur à jour</span>
             </div>
          </div>
        </div>
      </div>
    )
  }
];

export default function GuidePage() {
  const [activeTab, setActiveTab] = useState(GUIDE_SECTIONS[0].id);

  const activeContent = GUIDE_SECTIONS.find(s => s.id === activeTab)?.content;

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 font-sans text-[#1a1a1a]">
      <div className="max-w-6xl mx-auto h-full flex flex-col">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/dashboard" className="p-3 bg-white rounded-xl shadow-sm hover:text-[#ff9d00] transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-black italic uppercase tracking-tighter">GUIDE DE GESTION</h1>
             <p className="text-[#ff9d00] text-xs font-bold uppercase tracking-widest">Documentation & Aide</p>
          </div>
        </div>

        {/* CONTENU PRINCIPAL (LAYOUT 2 COLONNES) */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* MENU LATÉRAL (Navigation) */}
          <div className="w-full lg:w-1/4 sticky top-6">
             <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden p-2">
                {GUIDE_SECTIONS.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveTab(section.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all mb-1 last:mb-0 group
                      ${activeTab === section.id 
                        ? 'bg-black text-white shadow-md' 
                        : 'hover:bg-gray-50 text-gray-500'}
                    `}
                  >
                     <div className="flex items-center gap-3">
                        <span className={activeTab === section.id ? 'text-[#ff9d00]' : 'text-gray-400 group-hover:text-[#ff9d00]'}>
                          {section.icon}
                        </span>
                        <span className="text-xs font-black uppercase tracking-wide">{section.title}</span>
                     </div>
                     {activeTab === section.id && <ChevronRight size={14} className="text-[#ff9d00]"/>}
                  </button>
                ))}
             </div>

             <div className="mt-6 bg-[#ff9d00]/10 p-6 rounded-[2rem] text-center border border-[#ff9d00]/20">
                <BookOpen size={32} className="mx-auto text-[#ff9d00] mb-3"/>
                <p className="text-[10px] font-bold text-[#ff9d00] uppercase leading-relaxed">
                  Besoin d'aide supplémentaire ?<br/>Contactez le support technique.
                </p>
             </div>
          </div>

          {/* ZONE DE CONTENU */}
          <div className="flex-1 w-full min-h-[500px]">
             {activeContent}
          </div>

        </div>

      </div>
    </div>
  );
}