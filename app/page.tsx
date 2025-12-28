"use client";
import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col items-center justify-center text-white p-6">
      <div className="text-center italic">
        <h1 className="text-7xl md:text-8xl font-black uppercase tracking-tighter mb-2">
          SKRINERS<span className="text-[#ff9d00]">LAB</span>
        </h1>
        <p className="text-gray-500 font-bold uppercase tracking-[0.5em] mb-12 not-italic text-sm">
          Football Management System
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 w-full max-w-lg">
        <Link 
          href="/mon-club" 
          className="flex-1 bg-white text-[#1a1a1a] px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-center hover:bg-[#ff9d00] transition-all duration-300 shadow-2xl"
        >
          Espace Club
        </Link>
        <Link 
          href="/admin" 
          className="flex-1 border-2 border-white/20 text-white px-8 py-6 rounded-2xl font-black uppercase tracking-widest text-center hover:bg-white hover:text-[#1a1a1a] transition-all duration-300"
        >
          Admin SaaS
        </Link>
      </div>

      <p className="mt-12 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
        v1.0.0 — Secured Access
      </p>
    </div>
  );
}