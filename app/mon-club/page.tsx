"use client";
import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
// Importation de l'icône manquante
import { Trophy } from 'lucide-react';

export default function MonClubPage() {
  return (
    <DashboardLayout>
      <div className="italic">
        <h1 className="text-6xl font-black uppercase tracking-tighter text-[#1a1a1a] mb-4">
          Mon <span className="text-[#ff9d00]">Club</span>
        </h1>
        <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em] mb-12">
          Performance & Analyse
        </p>

        <div className="h-96 bg-gray-50 rounded-[4rem] border-2 border-dashed border-gray-200 flex items-center justify-center">
          <div className="text-center">
            {/* Ligne maintenant reconnue grâce à l'import ci-dessus */}
            <Trophy size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-bold text-gray-300 uppercase tracking-widest not-italic">
              Tableau de bord prêt
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}