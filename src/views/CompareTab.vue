<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Comparar Equipos (H2H)</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Team selectors -->
      <ion-grid>
        <ion-row>
          <ion-col>
            <ion-item>
              <ion-label position="stacked">Equipo 1</ion-label>
              <ion-select v-model="team1Id" placeholder="Seleccionar" interface="action-sheet">
                <ion-select-option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">
                  {{ t.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
          <ion-col>
            <ion-item>
              <ion-label position="stacked">Equipo 2</ion-label>
              <ion-select v-model="team2Id" placeholder="Seleccionar" interface="action-sheet">
                <ion-select-option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">
                  {{ t.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-button expand="block" :disabled="!team1Id || !team2Id || loading" @click="compare">
        <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
        Comparar
      </ion-button>

      <!-- H2H Result -->
      <div v-if="h2h">
        <!-- Record card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title class="ion-text-center">Historial de enfrentamientos</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="h2h-scoreboard">
              <div class="team-col">
                <p class="team-name">{{ h2h.team1Name }}</p>
                <p class="big-number">{{ h2h.team1Wins }}</p>
                <p class="label">Victorias</p>
              </div>
              <div class="team-col center">
                <p class="big-number draws">{{ h2h.draws }}</p>
                <p class="label">Empates</p>
              </div>
              <div class="team-col">
                <p class="team-name">{{ h2h.team2Name }}</p>
                <p class="big-number">{{ h2h.team2Wins }}</p>
                <p class="label">Victorias</p>
              </div>
            </div>

            <ion-grid>
              <ion-row>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Partidos totales</p>
                  <p class="stat-value">{{ h2h.totalMatches }}</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Media goles/partido</p>
                  <p class="stat-value">{{ h2h.avgTotalGoals.toFixed(2) }}</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">BTTS %</p>
                  <p class="stat-value">{{ h2h.bttsPercentage.toFixed(2) }}%</p>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Bar chart: wins/draws/losses -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Distribución de resultados</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <Bar :data="chartData" :options="chartOptions" style="max-height: 220px" />
          </ion-card-content>
        </ion-card>

        <!-- Recent matches -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Últimos enfrentamientos</ion-card-title>
          </ion-card-header>
          <ion-card-content class="ion-no-padding">
            <ion-list lines="full">
              <ion-item v-for="m in h2h.recentMatches" :key="m.id">
                <ion-label>
                  <div class="match-row">
                    <span class="match-team">{{ m.homeTeamName }}</span>
                    <span class="match-score">{{ m.homeGoals }} – {{ m.awayGoals }}</span>
                    <span class="match-team right">{{ m.awayTeamName }}</span>
                  </div>
                  <p class="match-date">{{ formatDate(m.matchDate) }}</p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>

      <div v-if="error" class="ion-padding ion-text-center">
        <ion-text color="danger">{{ error }}</ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonList, IonSpinner, IonText,
} from '@ionic/vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { statisticsApi } from '@/services/api';
import { useTeamsStore } from '@/stores/teamsStore';
import type { HeadToHead } from '@/types';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const teamsStore = useTeamsStore();
const team1Id = ref<number | null>(null);
const team2Id = ref<number | null>(null);
const h2h = ref<HeadToHead | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  if (teamsStore.teams.length === 0) {
    teamsStore.fetchTeams();
  }
});

async function compare() {
  if (!team1Id.value || !team2Id.value) return;
  loading.value = true;
  error.value = null;
  h2h.value = null;
  try {
    const { data } = await statisticsApi.getH2H(team1Id.value, team2Id.value);
    h2h.value = data;
  } catch {
    error.value = 'No se pudieron cargar los datos H2H.';
  } finally {
    loading.value = false;
  }
}

const chartData = computed(() => ({
  labels: [h2h.value?.team1Name ?? 'Equipo 1', 'Empates', h2h.value?.team2Name ?? 'Equipo 2'],
  datasets: [
    {
      label: 'Partidos',
      data: [h2h.value?.team1Wins ?? 0, h2h.value?.draws ?? 0, h2h.value?.team2Wins ?? 0],
      backgroundColor: ['#3880ff', '#999999', '#eb445a'],
    },
  ],
}));

const chartOptions = {
  responsive: true,
  plugins: { legend: { display: false } },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}
</script>

<style scoped>
.h2h-scoreboard {
  display: flex;
  justify-content: space-around;
  text-align: center;
  margin-bottom: 12px;
}
.team-col { flex: 1; }
.team-name { font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; }
.big-number { font-size: 2rem; font-weight: 700; margin: 0; }
.big-number.draws { color: var(--ion-color-medium); }
.label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0; }
.stat-label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0; }
.stat-value { font-size: 1.2rem; font-weight: 600; margin: 2px 0 0; }
.match-row { display: flex; align-items: center; gap: 8px; }
.match-team { flex: 1; font-size: 0.85rem; }
.match-team.right { text-align: right; }
.match-score { font-weight: 700; white-space: nowrap; }
.match-date { font-size: 0.75rem; color: var(--ion-color-medium); margin: 2px 0 0; }
</style>
