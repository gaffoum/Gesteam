"use client";
import React from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function AdminPage() {
  return (
    <DashboardLayout>
      <div className="italic">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-4 text-[#1a1a1a]">
          Console <span className="text-[#ff9d00]">SaaS</span>
        </h1>
        <p className="text-gray-400 font-bold not-italic uppercase text-[10px] tracking-[0.3em] mb-12">
          Gestion Maître des accès
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 not-italic">
          <div className="p-10 bg-white border border-gray-100 rounded-[3rem] shadow-xl">
            <h2 className="text-xl font-black uppercase italic mb-4">Total Clubs</h2>
            <p className="text-6xl font-black text-[#1a1a1a]">12</p>
          </div>
          <div className="p-10 bg-[#1a1a1a] text-white rounded-[3rem] shadow-xl">
            <h2 className="text-xl font-black uppercase italic mb-4 text-[#ff9d00]">Abonnements</h2>
            <p className="text-6xl font-black">Actif</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}