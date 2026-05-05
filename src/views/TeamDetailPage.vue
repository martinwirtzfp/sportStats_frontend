<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/teams"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ team?.name || 'Equipo' }}</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleFavorite">
            <ion-icon
              :icon="favStore.isFavorite(teamId) ? heart : heartOutline"
              :color="favStore.isFavorite(teamId) ? 'danger' : 'light'"
              slot="icon-only"
            ></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div v-if="loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>

      <div v-else-if="team">
        <!-- Team header -->
        <div class="team-header">
          <img :src="team.logoUrl || '/placeholder-team.png'" :alt="team.name" class="team-logo" />
          <h1>{{ team.name }}</h1>
          <p>{{ team.competitionName }}</p>
        </div>

        <!-- Selector lastN -->
        <div class="ion-padding-horizontal">
          <ion-segment :value="String(lastN)" @ionChange="onLastNChange">
            <ion-segment-button value="5"><ion-label>Últ. 5</ion-label></ion-segment-button>
            <ion-segment-button value="10"><ion-label>Últ. 10</ion-label></ion-segment-button>
            <ion-segment-button value="15"><ion-label>Últ. 15</ion-label></ion-segment-button>
          </ion-segment>
        </div>

        <!-- Stats cards -->
        <div v-if="stats">
          <ion-grid class="ion-padding-horizontal">
            <ion-row>
              <ion-col size="4" class="ion-text-center">
                <div class="stat-box win">
                  <p class="stat-num">{{ stats.wins }}</p>
                  <p class="stat-lbl">V</p>
                </div>
              </ion-col>
              <ion-col size="4" class="ion-text-center">
                <div class="stat-box draw">
                  <p class="stat-num">{{ stats.draws }}</p>
                  <p class="stat-lbl">E</p>
                </div>
              </ion-col>
              <ion-col size="4" class="ion-text-center">
                <div class="stat-box loss">
                  <p class="stat-num">{{ stats.losses }}</p>
                  <p class="stat-lbl">D</p>
                </div>
              </ion-col>
            </ion-row>
          </ion-grid>

          <ion-card>
            <ion-card-header><ion-card-title>Rendimiento</ion-card-title></ion-card-header>
            <ion-card-content>
              <Bar :data="statsChartData" :options="barOptions" style="max-height: 200px" />
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Goles</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-grid>
                <ion-row>
                  <ion-col class="ion-text-center">
                    <p class="stat-lbl">Marcados</p>
                    <p class="stat-big">{{ stats.goalsScored }}</p>
                    <p class="stat-avg">({{ stats.goalsScoredAvg.toFixed(2) }}/partido)</p>
                  </ion-col>
                  <ion-col class="ion-text-center">
                    <p class="stat-lbl">Encajados</p>
                    <p class="stat-big">{{ stats.goalsConceded }}</p>
                    <p class="stat-avg">({{ stats.goalsConcededAvg.toFixed(2) }}/partido)</p>
                  </ion-col>
                  <ion-col class="ion-text-center">
                    <p class="stat-lbl">Portería a 0</p>
                    <p class="stat-big">{{ stats.cleanSheets }}</p>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-card-content>
          </ion-card>

          <ion-card>
            <ion-card-header><ion-card-title>Casa vs Fuera</ion-card-title></ion-card-header>
            <ion-card-content>
              <Bar :data="homeAwayChartData" :options="barOptions" style="max-height: 200px" />
            </ion-card-content>
          </ion-card>
        </div>

        <!-- Recent matches -->
        <ion-list-header class="ion-padding-horizontal">
          <ion-label>Últimos partidos</ion-label>
        </ion-list-header>
        <ion-list>
          <ion-item v-for="m in matches" :key="m.id">
            <ion-label>
              <div class="match-row">
                <span :class="['match-team', m.homeTeamId === teamId ? 'bold' : '']">{{ m.homeTeamName }}</span>
                <span class="match-score">{{ m.homeGoals }} – {{ m.awayGoals }}</span>
                <span :class="['match-team right', m.awayTeamId === teamId ? 'bold' : '']">{{ m.awayTeamName }}</span>
              </div>
              <p class="match-date">{{ formatDate(m.matchDate) }} · {{ m.competitionName }}</p>
            </ion-label>
            <ion-badge slot="end" :color="matchResultColor(m)">{{ matchResultLabel(m) }}</ion-badge>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonButton, IonIcon, IonSpinner, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonGrid, IonRow, IonCol, IonList,
  IonListHeader, IonItem, IonLabel, IonBadge, IonSegment, IonSegmentButton,
} from '@ionic/vue';
import { heart, heartOutline } from 'ionicons/icons';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { teamsApi, matchesApi, statisticsApi } from '@/services/api';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import type { Team, Match, TeamStats } from '@/types';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const route = useRoute();
const router = useRouter();
const favStore = useFavoritesStore();
const authStore = useAuthStore();

const teamId = Number(route.params.id);
const team = ref<Team | null>(null);
const matches = ref<Match[]>([]);
const stats = ref<TeamStats | null>(null);
const loading = ref(true);
const lastN = ref(10);

onMounted(async () => {
  await loadAll();
});

async function loadAll() {
  loading.value = true;
  try {
    const [teamRes, matchRes, statsRes] = await Promise.all([
      teamsApi.getById(teamId),
      matchesApi.getLastByTeam(teamId, lastN.value),
      statisticsApi.getTeamStats(teamId, lastN.value),
    ]);
    team.value = teamRes.data;
    matches.value = matchRes.data;
    stats.value = statsRes.data;
  } catch {
    // errors handled silently; components show empty state
  } finally {
    loading.value = false;
  }
}

function onLastNChange(ev: CustomEvent) {
  lastN.value = Number(ev.detail.value);
  loadAll();
}

async function toggleFavorite() {
  if (!authStore.isLoggedIn) { router.push('/login'); return; }
  if (favStore.isFavorite(teamId)) {
    await favStore.remove(teamId);
  } else {
    await favStore.add(teamId);
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function matchResultColor(m: Match) {
  const scored = m.homeTeamId === teamId ? m.homeGoals : m.awayGoals;
  const conceded = m.homeTeamId === teamId ? m.awayGoals : m.homeGoals;
  if (scored != null && conceded != null && scored > conceded) return 'success';
  if (scored != null && conceded != null && scored === conceded) return 'warning';
  if (scored != null && conceded != null) return 'danger';
  return 'medium';
}

function matchResultLabel(m: Match) {
  const scored = m.homeTeamId === teamId ? m.homeGoals : m.awayGoals;
  const conceded = m.homeTeamId === teamId ? m.awayGoals : m.homeGoals;
  if (scored > conceded) return 'V';
  if (scored === conceded) return 'E';
  return 'D';
}

const statsChartData = computed(() => ({
  labels: ['Victorias', 'Empates', 'Derrotas'],
  datasets: [{
    label: 'Partidos',
    data: [stats.value?.wins ?? 0, stats.value?.draws ?? 0, stats.value?.losses ?? 0],
    backgroundColor: ['#2dd36f', '#ffc409', '#eb445a'],
  }],
}));

const homeAwayChartData = computed(() => ({
  labels: ['Casa', 'Fuera'],
  datasets: [
    { label: 'Victorias', data: [stats.value?.homeWins ?? 0, stats.value?.awayWins ?? 0], backgroundColor: '#2dd36f' },
    { label: 'Empates',   data: [stats.value?.homeDraws ?? 0, stats.value?.awayDraws ?? 0], backgroundColor: '#ffc409' },
    { label: 'Derrotas',  data: [stats.value?.homeLosses ?? 0, stats.value?.awayLosses ?? 0], backgroundColor: '#eb445a' },
  ],
}));

const barOptions = {
  responsive: true,
  plugins: { legend: { position: 'bottom' as const } },
};
</script>

<style scoped>
.team-header { text-align: center; padding: 24px 16px 8px; }
.team-logo { width: 80px; height: 80px; object-fit: contain; }
.team-header h1 { margin: 8px 0 4px; font-size: 1.4rem; font-weight: 700; }
.team-header p { margin: 0; color: var(--ion-color-medium); }
.stat-box { border-radius: 12px; padding: 12px 4px; }
.stat-box.win  { background: #e6f9ed; }
.stat-box.draw { background: #fff8e1; }
.stat-box.loss { background: #fdecea; }
.stat-num { font-size: 1.8rem; font-weight: 700; margin: 0; }
.stat-lbl { font-size: 0.7rem; color: var(--ion-color-medium); margin: 0; }
.stat-big { font-size: 1.4rem; font-weight: 700; margin: 2px 0; }
.stat-avg { font-size: 0.7rem; color: var(--ion-color-medium); margin: 0; }
.match-row { display: flex; align-items: center; gap: 8px; }
.match-team { flex: 1; font-size: 0.85rem; }
.match-team.right { text-align: right; }
.match-team.bold { font-weight: 700; }
.match-score { font-weight: 700; white-space: nowrap; }
.match-date { font-size: 0.75rem; color: var(--ion-color-medium); margin: 2px 0 0; }
</style>
