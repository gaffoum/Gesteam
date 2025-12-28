import { defineStore } from 'pinia';

export const useTeamStore = defineStore('team', {
  state: () => ({
    joueurs: [
      { id: 1, nom: 'Dupont', prenom: 'Jean', poste: 'G' },
      { id: 2, nom: 'Durand', prenom: 'Pierre', poste: 'D' },
      // ... vos autres joueurs
    ],
    selectionIds: [], // IDs des joueurs cochés dans l'effectif
    convoques: []     // Joueurs officiellement envoyés vers la page convocation
  }),
  actions: {
    confirmerConvocation() {
      // On filtre l'effectif pour ne garder que ceux dont l'ID est dans selectionIds
      this.convoques = this.joueurs.filter(j => this.selectionIds.includes(j.id));
    },
    resetConvocation() {
      this.convoques = [];
      this.selectionIds = [];
    }
  }
});