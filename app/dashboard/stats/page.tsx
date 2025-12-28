"use client";
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';

export default function StatsPage() {
  return (
    <DashboardLayout>
      <div className="p-8 italic">
        <h1 className="text-5xl font-black uppercase tracking-tighter mb-10">Data <span className="text-[#ff9d00]">Performance</span></h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 not-italic">
          {[
            { label: 'Présence Entraînement', value: '92%', icon: Activity, color: 'text-blue-500' },
            { label: 'Ratio Victoires', value: '64%', icon: TrendingUp, color: 'text-green-500' },
            { label: 'Buts / Match', value: '2.4', icon: BarChart3, color: 'text-[#ff9d00]' },
            { label: 'Disponibilité Staff', value: '100%', icon: PieChart, color: 'text-purple-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-50 group hover:scale-[1.02] transition-all">
              <stat.icon className={`${stat.color} mb-4`} size={24} />
              <p className="text-gray-400 font-black uppercase text-[9px] tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black mt-1 tracking-tighter">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-white rounded-[3rem] p-20 border-2 border-dashed border-gray-100 flex items-center justify-center">
          <p className="text-gray-300 font-black uppercase text-xs italic tracking-widest">Les graphiques détaillés arrivent prochainement...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}