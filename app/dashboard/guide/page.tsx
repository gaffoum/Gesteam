"use client";

import React, { useState } from 'react';
import { 
  BookOpen, Users, Trophy, CalendarCheck, BarChart2, 
  Activity, Shield, Settings, LayoutGrid, List 
} from 'lucide-react';

export default function GuidePage() {
  
  // État pour la vue (Carte ou Liste)
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  const sections = [
    {
      title: "Gestion d'Effectif",
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-50",
      steps: [
        "Accédez à l'onglet 'Effectifs' pour voir vos joueurs.",
        "Ajoutez un joueur avec le bouton '+' en renseignant ses infos.",
        "Attribuez des numéros et des postes précis.",
        "Les joueurs créés ici seront disponibles pour les feuilles de match."
      ]
    },
    {
      title: "Matchs & Live",
      icon: Trophy,
      color: "text-[#ff9d00]",
      bg: "bg-[#fff4e0]",
      steps: [
        "Planifiez une rencontre via 'Programmer un match'.",
        "Avant le match : Définissez la composition et la tactique.",
        "Pendant le match : Cliquez sur le bouton ⚡ (Live) pour saisir les actions en temps réel.",
        "Après le match : Le score et les stats sont enregistrés automatiquement."
      ]
    },
    {
      title: "Entraînements",
      icon: CalendarCheck,
      color: "text-green-600",
      bg: "bg-green-50",
      steps: [
        "Créez une séance en choisissant la date, l'heure et l'équipe.",
        "Utilisez le bouton 'Thèmes' pour configurer vos types de séances (Physique, Tactique...).",
        "Le jour J : Ouvrez la séance et faites l'appel en un clic (Présent / Absent / Retard).",
        "Le taux de présence est calculé instantanément."
      ]
    },
    {
      title: "Statistiques",
      icon: BarChart2,
      color: "text-purple-500",
      bg: "bg-purple-50",
      steps: [
        "Visualisez les performances globales dans l'onglet 'Statistiques'.",
        "Utilisez les filtres pour voir les stats d'une équipe spécifique ou d'un match précis.",
        "Découvrez les 'Top 3' automatiques : Meilleurs buteurs, passeurs et cartons.",
        "Analysez l'évolution de votre saison grâce aux données cumulées."
      ]
    }
  ];

  return (
    <div className="p-6 md:p-12 font-sans text-[#1a1a1a] min-h-screen bg-[#f9fafb]">
      
      {/* HEADER & CONTROLS */}
      <div className="max-w-6xl mx-auto mb-12 flex flex-col md:flex-row justify-between items-end gap-8">
          
          {/* Titres */}
          <div className="text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 mb-6">
                <BookOpen size={20} className="text-[#ff9d00]" />
                <span className="text-xs font-black uppercase tracking-widest text-gray-400">Centre d'aide</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4">
              Guide d'utilisation <span className="text-[#ff9d00]">Gesteam</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm max-w-2xl leading-relaxed">
              Maîtrisez toutes les fonctionnalités de votre dashboard manager.
            </p>
          </div>

          {/* TOGGLE VIEW MODE (Style Orange) */}
           <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
               <button 
                  onClick={() => setViewMode('cards')}
                  className={`p-3 rounded-lg transition-all ${viewMode === 'cards' ? 'bg-[#ff9d00] text-black shadow-md' : 'text-gray-300 hover:bg-gray-50 hover:text-black'}`}
                  title="Vue Cartes"
               >
                   <LayoutGrid size={18} />
               </button>
               <button 
                  onClick={() => setViewMode('list')}
                  className={`p-3 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-black shadow-md' : 'text-gray-300 hover:bg-gray-50 hover:text-black'}`}
                  title="Vue Liste"
               >
                   <List size={18} />
               </button>
           </div>
      </div>

      {/* CONTENU (GRILLE OU LISTE) */}
      <div className="max-w-6xl mx-auto">
        {viewMode === 'cards' ? (
            // --- VUE CARTES (GRILLE) ---
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {sections.map((section, idx) => (
                  <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:border-[#ff9d00]/50 transition-all group hover:shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${section.bg} ${section.color} transition-transform group-hover:scale-110 duration-500`}>
                        <section.icon size={28} strokeWidth={2.5} />
                      </div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter">{section.title}</h2>
                    </div>
                    <ul className="space-y-4">
                      {section.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex items-start gap-4">
                          <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5 border border-gray-100 font-black text-[10px] text-gray-400">
                            {stepIdx + 1}
                          </div>
                          <p className="text-sm font-bold text-gray-600 leading-relaxed">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
        ) : (
            // --- VUE LISTE (LINEAIRE) ---
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {sections.map((section, idx) => (
                  <div key={idx} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-start hover:border-[#ff9d00]/30 transition-all">
                    
                    {/* Colonne Gauche : Titre & Icone */}
                    <div className="flex items-center gap-4 md:w-1/3 border-b md:border-b-0 md:border-r border-gray-50 pb-4 md:pb-0">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${section.bg} ${section.color} shrink-0`}>
                        <section.icon size={32} strokeWidth={2.5} />
                      </div>
                      <div>
                          <h2 className="text-xl font-black italic uppercase tracking-tighter">{section.title}</h2>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Module {idx + 1}</p>
                      </div>
                    </div>

                    {/* Colonne Droite : Etapes */}
                    <ul className="flex-1 grid grid-cols-1 gap-3">
                      {section.steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#ff9d00] shrink-0"></div>
                          <p className="text-sm font-bold text-gray-600 leading-relaxed">
                            {step}
                          </p>
                        </li>
                      ))}
                    </ul>

                  </div>
                ))}
            </div>
        )}
      </div>

      {/* SECTION ASTUCE (Toujours visible) */}
      <div className="max-w-6xl mx-auto mt-12 bg-black text-white p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
         <div className="relative z-10 flex-1">
            <div className="flex items-center gap-3 mb-4 text-[#ff9d00]">
                <Activity size={24} />
                <span className="font-black uppercase tracking-widest text-xs">Astuce Pro</span>
            </div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter mb-2">Gagnez du temps !</h3>
            <p className="text-gray-400 text-sm font-medium">
                Utilisez le bouton <span className="text-white font-bold">"Auto-Remplir"</span> dans la configuration des thèmes d'entraînement pour générer automatiquement une liste standard (Physique, Technique, etc.).
            </p>
         </div>
         <div className="relative z-10">
            <Settings size={60} className="text-[#ff9d00] opacity-80 animate-spin-slow" />
         </div>
         
         {/* Déco fond */}
         <Shield className="absolute -right-10 -bottom-10 text-white opacity-5 rotate-12" size={300} />
      </div>

    </div>
  );
}