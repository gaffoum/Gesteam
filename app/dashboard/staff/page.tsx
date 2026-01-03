"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Users, UserPlus, Copy, Check, Search, Mail, Phone, MapPin, 
  ShieldAlert, Loader2, ArrowLeft, LayoutGrid, List, UserCog, 
  User, Shield, Send
} from 'lucide-react';
import Link from 'next/link';

export default function StaffPage() {
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [clubId, setClubId] = useState<string | null>(null);
  const [clubName, setClubName] = useState<string>(""); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // --- ÉTATS POUR L'INVITATION ---
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'superuser' | 'player'>('superuser');
  const [inviteEmail, setInviteEmail] = useState(""); 
  const [generatedLink, setGeneratedLink] = useState("");
  const [copied, setCopied] = useState(false);
  
  // État de chargement pour l'envoi
  const [isSending, setIsSending] = useState(false); 

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log("1. Session OK, récupération profil...");

      // 1. Récupération PRIORITAIRE du club_id seul (plus robuste)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('club_id')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error("Erreur récupération profil:", profileError);
        throw profileError;
      }

      if (profile?.club_id) {
        console.log("2. Club ID trouvé:", profile.club_id);
        setClubId(profile.club_id);

        // 2. Ensuite, on récupère les infos du club (Nom)
        const { data: clubData } = await supabase
          .from('clubs')
          .select('nom, nom_usage')
          .eq('id', profile.club_id)
          .single();
        
        if (clubData) {
          setClubName(clubData.nom_usage || clubData.nom || "");
        }

        // 3. Enfin, on récupère le staff
        const { data: members, error: membersError } = await supabase
          .from('profiles')
          .select(`
            *,
            coach_teams (
              equipes (
                nom,
                categorie
              )
            )
          `)
          .eq('club_id', profile.club_id)
          .in('role', ['coach', 'superuser', 'admin']) 
          .order('created_at', { ascending: false });

        if (membersError) console.error("Erreur staff:", membersError);
        
        if (members) {
          setStaffMembers(members);
        }
      } else {
        console.error("Aucun club_id trouvé dans le profil.");
      }
    } catch (error) {
      console.error("Erreur générale fetchStaff:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- FONCTION D'ENVOI VIA RESEND ---
  const handleSendInvite = async () => {
    console.log("Tentative d'envoi. ClubID:", clubId, "Email:", inviteEmail);

    if (!clubId) {
      alert("Erreur critique : L'identifiant de votre club n'est pas chargé. Rafraîchissez la page (F5).");
      return;
    }
    if (!inviteEmail) {
      alert("Veuillez entrer une adresse email valide.");
      return;
    }

    setIsSending(true);

    // 1. Génération du token
    const payload = JSON.stringify({
      clubId: clubId,
      role: inviteRole,
      type: 'invite',
      timestamp: Date.now()
    });
    const token = btoa(payload);
    const link = `${window.location.origin}/register-complete?token=${token}`;
    
    // On garde le lien affiché au cas où
    setGeneratedLink(link);
    setCopied(false);

    try {
      // 2. Appel à l'API Resend
      const response = await fetch('/api/send-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          link: link,
          role: inviteRole,
          clubName: clubName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Invitation envoyée avec succès à ${inviteEmail} !`);
        setShowInviteModal(false); // On ferme la modale
        setInviteEmail(""); 
        setGeneratedLink("");
      } else {
        console.error("Erreur API Resend:", data);
        alert(`Erreur lors de l'envoi : ${data.error?.message || 'Erreur inconnue'}. Le lien a tout de même été généré ci-dessous.`);
      }
    } catch (error) {
      console.error("Erreur réseau:", error);
      alert("Erreur technique lors de la connexion au serveur d'envoi. Copiez le lien manuellement.");
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filteredStaff = staffMembers.filter(member => 
    `${member.prenom} ${member.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9fafb]">
        <Loader2 className="animate-spin text-[#ff9d00]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] p-6 md:p-12 italic font-black uppercase text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <Link href="/dashboard" className="p-4 bg-white rounded-2xl shadow-sm text-gray-400 hover:text-[#ff9d00] transition-all border border-gray-100">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl md:text-5xl tracking-tighter text-black italic leading-none">
                MON CLUB <span className="text-[#ff9d00]">STAFF</span>
              </h1>
            </div>
          </div>
          
          <button 
            onClick={() => { 
                if(!clubId) { alert("Le club n'est pas chargé. Patientez ou rafraîchissez."); return; }
                setShowInviteModal(true); setGeneratedLink(""); setInviteEmail(""); 
            }}
            className="bg-black text-white px-6 py-4 rounded-xl font-black text-[10px] tracking-widest hover:bg-[#ff9d00] transition-all flex items-center gap-2 shadow-lg active:scale-95"
          >
            <UserPlus size={16} /> <span className="hidden lg:inline">INVITER UN MEMBRE</span>
          </button>
        </div>

        {/* --- BARRE DE RECHERCHE & TOGGLE --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="RECHERCHER UN MEMBRE..." 
              className="w-full bg-white border border-gray-100 rounded-[2rem] py-5 pl-14 pr-6 text-xs font-black italic outline-none focus:ring-2 focus:ring-[#ff9d00]/20 transition-all shadow-sm placeholder:text-gray-300 text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-1">
            <button onClick={() => setViewMode('grid')} className={`p-3 rounded-2xl transition-all ${viewMode === 'grid' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
              <LayoutGrid size={20} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-2xl transition-all ${viewMode === 'list' ? 'bg-[#ff9d00] text-white shadow-md' : 'text-gray-300 hover:bg-gray-50'}`}>
              <List size={20} />
            </button>
          </div>
        </div>

        {/* --- CONTENU --- */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStaff.map((member) => (
              <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-[#ff9d00] hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg
                     ${member.role === 'superuser' || member.role === 'admin' ? 'bg-[#ff9d00] text-white' : 'bg-black text-white'}
                  `}>
                    {member.prenom ? member.prenom.charAt(0) : <UserCog size={20}/>}
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest 
                    ${member.role === 'superuser' || member.role === 'admin' ? 'bg-[#ff9d00]/10 text-[#ff9d00]' : 'bg-gray-100 text-gray-500'}
                  `}>
                    {member.role === 'superuser' ? 'ADMIN' : 'COACH'}
                  </span>
                </div>
                
                <h3 className="text-2xl text-black tracking-tighter mb-1 italic truncate">
                  {member.prenom} {member.nom}
                </h3>
                
                <div className="space-y-2 mt-4 text-[10px] text-gray-400 font-bold not-italic border-t border-gray-50 pt-4">
                  <div className="flex items-center gap-2">
                    <Mail size={12} className="text-[#ff9d00]" /> {member.email}
                  </div>
                  {member.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-[#ff9d00]" /> {member.telephone}
                    </div>
                  )}
                </div>
                <UserCog className="absolute -right-8 -bottom-8 text-gray-50/80 group-hover:text-[#ff9d00]/5 transition-all duration-500 transform group-hover:scale-110" size={160} />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-visible">
              <table className="w-full text-left italic">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-400 text-[10px] tracking-widest">
                  <tr>
                    <th className="px-10 py-6 font-black">LICENCE</th>
                    <th className="px-10 py-6 font-black">NOM PRÉNOM</th>
                    <th className="px-10 py-6 font-black">ADRESSE COMPLÈTE</th>
                    <th className="px-10 py-6 font-black text-right">EMAIL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50/50 transition-colors group relative">
                      <td className="px-10 py-6">
                         <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-lg text-[9px] font-black">
                           {member.licence || 'N/A'}
                         </span>
                      </td>
                      <td className="px-10 py-6 relative">
                        <div className="flex items-center gap-4 cursor-help">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black italic shadow-md shrink-0
                             ${member.role === 'superuser' ? 'bg-[#ff9d00] text-white' : 'bg-black text-white'}
                          `}>
                            {member.prenom ? member.prenom.charAt(0) : '?'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-black font-black text-sm uppercase">{member.nom}</span>
                            <span className="text-gray-400 text-[10px] font-bold">{member.prenom}</span>
                          </div>
                        </div>
                        {/* TOOLTIP */}
                        <div className="absolute left-20 bottom-full mb-2 w-64 bg-black text-white p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 invisible group-hover:visible border border-[#ff9d00]/30">
                          <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                            <Shield size={14} className="text-[#ff9d00]" />
                            <span className="text-[10px] font-black tracking-widest text-[#ff9d00]">ÉQUIPES GÉRÉES</span>
                          </div>
                          <div className="space-y-1">
                            {member.coach_teams && member.coach_teams.length > 0 ? (
                              member.coach_teams.map((ct: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-[10px] font-bold">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#ff9d00]"></div>
                                  {ct.equipes?.categorie || 'Équipe inconnue'}
                                </div>
                              ))
                            ) : (
                              <span className="text-[9px] text-gray-500 italic">Aucune équipe assignée</span>
                            )}
                          </div>
                          <div className="absolute top-full left-8 -mt-2 border-8 border-transparent border-t-black"></div>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-gray-400 text-[10px] font-black not-italic">
                        {member.adresse ? (
                          <div className="flex flex-col">
                            <span>{member.adresse}</span>
                            <span>{member.code_postal} {member.ville}</span>
                          </div>
                        ) : (
                          <span className="opacity-50">ADRESSE NON RENSEIGNÉE</span>
                        )}
                      </td>
                      <td className="px-10 py-6 text-right text-black text-[10px] font-bold lowercase">
                        {member.email}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredStaff.length === 0 && !loading && (
          <div className="py-24 text-center border-4 border-dashed border-gray-100 rounded-[3rem] mt-8 bg-white/50">
            <p className="text-gray-300 text-xs tracking-[0.5em] font-black italic">AUCUN MEMBRE TROUVÉ</p>
            <p className="text-gray-300/50 text-[10px] mt-2 font-bold">Invitez votre premier coach ou administrateur.</p>
          </div>
        )}

        {/* --- MODALE D'INVITATION AVEC CHAMP EMAIL --- */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-gray-100 font-black animate-in zoom-in duration-300">
              <h2 className="text-3xl font-black italic tracking-tighter mb-2 text-black leading-none">
                ENVOYER UNE <span className="text-[#ff9d00]">INVITATION</span>
              </h2>
              <p className="text-gray-400 text-[11px] mb-8 not-italic font-bold">
                Le destinataire recevra un email automatique.
              </p>

              <div className="space-y-6">
                
                {/* 1. CHOIX DU RÔLE */}
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-3 uppercase">1. TYPE DE COMPTE</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setInviteRole('superuser')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden
                        ${inviteRole === 'superuser' ? 'border-[#ff9d00] bg-[#ff9d00] text-white shadow-xl scale-[1.02]' : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-gray-50'}`}
                    >
                      <ShieldAlert size={28} />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black italic tracking-tighter">COACH</span>
                        <span className="text-[9px] opacity-70 tracking-widest mt-1">SUPERUSER</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => setInviteRole('player')}
                      className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative overflow-hidden
                        ${inviteRole === 'player' ? 'border-black bg-black text-white shadow-xl scale-[1.02]' : 'border-gray-100 text-gray-400 hover:border-gray-200 bg-gray-50'}`}
                    >
                      <User size={28} />
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black italic tracking-tighter">JOUEUR</span>
                        <span className="text-[9px] opacity-70 tracking-widest mt-1">USER</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. EMAIL DU DESTINATAIRE */}
                <div>
                  <label className="text-[10px] tracking-widest text-gray-400 block mb-3 uppercase">2. EMAIL DU DESTINATAIRE</label>
                  <input 
                    type="email" 
                    placeholder="exemple@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs font-black italic outline-none focus:ring-2 focus:ring-[#ff9d00]/20 transition-all text-black"
                  />
                </div>

                {/* BOUTON D'ENVOI */}
                <button 
                  onClick={handleSendInvite}
                  disabled={isSending}
                  className="w-full bg-black text-white py-5 rounded-2xl font-black text-[10px] tracking-widest shadow-xl hover:bg-[#ff9d00] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                  {isSending ? "ENVOI EN COURS..." : "ENVOYER L'INVITATION"}
                </button>

                {/* LIEN DE SECOURS */}
                {generatedLink && (
                  <div className="animate-in fade-in slide-in-from-top-2 pt-4 border-t border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold mb-2 text-center">EN CAS DE PROBLÈME, COPIEZ LE LIEN :</p>
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 break-all mb-3">
                      <p className="text-[9px] text-gray-400 font-mono lowercase not-italic">{generatedLink}</p>
                    </div>
                    <button 
                      onClick={copyToClipboard}
                      className={`w-full py-4 rounded-xl font-black text-[10px] tracking-widest transition-all flex items-center justify-center gap-2
                        ${copied ? 'bg-green-500 text-white' : 'bg-gray-100 text-black hover:bg-gray-200'}
                      `}
                    >
                      {copied ? "LIEN COPIÉ !" : "COPIER MANUELLEMENT"}
                    </button>
                  </div>
                )}

              </div>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <button 
                  onClick={() => setShowInviteModal(false)}
                  className="w-full text-gray-400 text-[10px] font-black uppercase tracking-widest hover:text-black"
                >
                  FERMER
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}