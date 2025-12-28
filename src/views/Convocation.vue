<template>
  <div class="convocation-layout">
    <div class="terrain">
      <h2>Terrain</h2>
      <div class="compo-active">
        <p v-if="teamStore.convoques.length === 0">Aucun joueur convoqué</p>
      </div>
    </div>

    <div class="liste-convocation">
      <h3>Liste des Convoqués</h3>
      <div class="remplacants-zone">
        <div v-if="teamStore.convoques.length > 0">
          <div 
            v-for="joueur in teamStore.convoques" 
            :key="joueur.id" 
            class="joueur-badge"
          >
            {{ joueur.prenom[0] }}. {{ joueur.nom }} ({{ joueur.poste }})
          </div>
        </div>
        <div v-else class="empty-msg">
          La zone est vide par défaut.
        </div>
      </div>
      
      <button @click="teamStore.resetConvocation" class="btn-reset">
        Réinitialiser
      </button>
    </div>
  </div>
</template>

<script setup>
import { useTeamStore } from '@/stores/team';

const teamStore = useTeamStore();
</script>

<style scoped>
.convocation-layout {
  display: flex;
  gap: 20px;
  padding: 20px;
}

.terrain {
  flex: 2;
  background-color: #27ae60;
  min-height: 400px;
  border-radius: 8px;
  padding: 15px;
  color: white;
}

.liste-convocation {
  flex: 1;
  background-color: #ecf0f1;
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 15px;
}

.joueur-badge {
  background: white;
  padding: 8px;
  margin-bottom: 5px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.empty-msg {
  color: #7f8c8d;
  font-style: italic;
  text-align: center;
  margin-top: 20px;
}

.btn-reset {
  margin-top: 15px;
  width: 100%;
  padding: 5px;
  background: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
}
</style>