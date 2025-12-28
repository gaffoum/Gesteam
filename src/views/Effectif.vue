<template>
  <div class="effectif-container">
    <h1>Gestion de l'Effectif</h1>
    
    <table>
      <thead>
        <tr>
          <th>Sélect.</th>
          <th>Nom</th>
          <th>Poste</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="joueur in teamStore.joueurs" :key="joueur.id">
          <td>
            <input 
              type="checkbox" 
              :value="joueur.id" 
              v-model="teamStore.selectionIds"
            />
          </td>
          <td>{{ joueur.prenom }} {{ joueur.nom }}</td>
          <td>{{ joueur.poste }}</td>
        </tr>
      </tbody>
    </table>

    <button 
      @click="validerEtNaviguer" 
      :disabled="teamStore.selectionIds.length === 0"
      class="btn-convocation"
    >
      Convocation ({{ teamStore.selectionIds.length }})
    </button>
  </div>
</template>

<script setup>
import { useTeamStore } from '@/stores/team';
import { useRouter } from 'vue-router';

const teamStore = useTeamStore();
const router = useRouter();

const validerEtNaviguer = () => {
  teamStore.confirmerConvocation();
  router.push('/convocation');
};
</script>

<style scoped>
.btn-convocation {
  margin-top: 20px;
  padding: 10px 20px;
  background-color: #2c3e50;
  color: white;
  border: none;
  cursor: pointer;
}
.btn-convocation:disabled {
  background-color: #95a5a6;
}
</style>