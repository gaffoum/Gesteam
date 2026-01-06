"use client";
import React from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'error' | 'success';
  title: string;
  message: string;
}

export default function AlertModal({ isOpen, onClose, type, title, message }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop Flou */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Contenu Modale */}
      <div className="relative bg-white rounded-[2.5rem] p-8 md:p-10 w-full max-w-md shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center space-y-6">
          {/* Icône */}
          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-3xl shadow-sm
            ${type === 'error' ? 'bg-red-50 text-red-500' : 'bg-[#ff9d00]/10 text-[#ff9d00]'}`}
          >
            {type === 'error' ? <AlertTriangle size={40} strokeWidth={2.5}/> : <CheckCircle2 size={40} strokeWidth={2.5}/>}
          </div>

          {/* Textes */}
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-black">
              {title}
            </h3>
            <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed px-4">
              {message}
            </p>
          </div>

          {/* Bouton Action */}
          <button 
            onClick={onClose}
            className={`w-full py-4 rounded-xl font-black text-xs tracking-[0.2em] uppercase text-white shadow-lg active:scale-95 transition-all
              ${type === 'error' ? 'bg-black hover:bg-red-600' : 'bg-black hover:bg-[#ff9d00]'}`}
          >
            {type === 'error' ? 'Compris' : 'Continuer'}
          </button>
        </div>
      </div>
    </div>
  );
}