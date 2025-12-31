"use client";
import React from 'react';
import { ShieldAlert, AlertTriangle, Check, X } from 'lucide-react';

interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminConfirmModal({ isOpen, title, message, type, onConfirm, onCancel }: AdminConfirmModalProps) {
  if (!isOpen) return null;

  // Couleurs selon le type d'action
  const isDanger = type === 'danger';
  const accentColor = isDanger ? 'bg-red-600' : 'bg-[#ff9d00]';
  const borderColor = isDanger ? 'border-red-600' : 'border-[#ff9d00]';
  const glowColor = isDanger ? 'shadow-red-900/50' : 'shadow-orange-900/50';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fond flouté */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" 
        onClick={onCancel}
      ></div>

      {/* La Fenêtre Style "Command Center" */}
      <div className={`relative bg-[#1e293b] w-full max-w-md rounded-2xl border-2 ${borderColor} shadow-2xl ${glowColor} p-8 animate-in zoom-in-95 duration-200`}>
        
        {/* Icône animée */}
        <div className="flex justify-center mb-6">
          <div className={`w-20 h-20 rounded-full bg-[#0f172a] border-4 ${borderColor} flex items-center justify-center shadow-inner`}>
            {isDanger ? (
              <ShieldAlert size={40} className="text-red-500 animate-pulse" />
            ) : (
              <AlertTriangle size={40} className="text-[#ff9d00]" />
            )}
          </div>
        </div>

        {/* Textes */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-black uppercase text-white tracking-tighter mb-2">
            {title}
          </h3>
          <p className="text-slate-400 font-bold text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Boutons */}
        <div className="flex gap-4">
          <button 
            onClick={onCancel}
            className="flex-1 py-4 bg-[#0f172a] hover:bg-slate-800 text-slate-400 font-black uppercase text-xs rounded-xl transition-all border border-slate-700"
          >
            Annuler
          </button>
          
          <button 
            onClick={onConfirm}
            className={`flex-1 py-4 ${accentColor} hover:brightness-110 text-white font-black uppercase text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2`}
          >
            <Check size={16} strokeWidth={4} /> Confirmer
          </button>
        </div>

        {/* Décoration technique */}
        <div className="absolute top-4 left-4 w-2 h-2 bg-slate-500 rounded-full opacity-20"></div>
        <div className="absolute top-4 right-4 w-2 h-2 bg-slate-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 left-4 w-2 h-2 bg-slate-500 rounded-full opacity-20"></div>
        <div className="absolute bottom-4 right-4 w-2 h-2 bg-slate-500 rounded-full opacity-20"></div>

      </div>
    </div>
  );
}