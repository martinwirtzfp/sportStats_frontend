<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Comparar Equipos (H2H)</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Selector + Equipos -->
      <ion-card>
        <ion-card-content>
          <ion-item lines="none">
            <ion-label position="stacked">Liga</ion-label>
            <ion-select v-model="selectedLeagueApiId" interface="action-sheet" placeholder="Seleccionar liga">
              <ion-select-option v-for="l in uniqueLeagues" :key="l.apiId" :value="l.apiId">
                {{ l.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item lines="none">
            <ion-label position="stacked">Temporada</ion-label>
            <ion-select v-model="selectedSeason" interface="popover" :disabled="!selectedLeagueApiId">
              <ion-select-option :value="null">Todas</ion-select-option>
              <ion-select-option v-for="s in seasonsForLeague" :key="s" :value="s">{{ s }}</ion-select-option>
            </ion-select>
          </ion-item>
          <div v-if="loadingTeams" class="ion-padding ion-text-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
          </div>
          <template v-else-if="selectedLeagueApiId">
            <ion-grid>
              <ion-row>
                <ion-col>
                  <ion-item>
                    <ion-label position="stacked">Equipo 1</ion-label>
                    <ion-select v-model="team1Id" placeholder="Seleccionar" interface="action-sheet">
                      <ion-select-option v-for="t in availableTeams" :key="t.id" :value="t.id">
                        {{ t.name }}
                      </ion-select-option>
                    </ion-select>
                  </ion-item>
                </ion-col>
                <ion-col>
                  <ion-item>
                    <ion-label position="stacked">Equipo 2</ion-label>
                    <ion-select v-model="team2Id" placeholder="Seleccionar" interface="action-sheet">
                      <ion-select-option v-for="t in availableTeams" :key="t.id" :value="t.id">
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
          </template>
          <div v-else class="ion-padding ion-text-center">
            <p>Selecciona una liga para empezar.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Resultados H2H -->
      <template v-if="h2h">

        <!-- 1. Marcador principal -->
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
                <p class="sub-stat">{{ h2h.team1GoalsAvg.toFixed(2) }} goles/p</p>
              </div>
              <div class="team-col center">
                <p class="big-number draws">{{ h2h.draws }}</p>
                <p class="label">Empates</p>
                <p class="sub-stat">{{ h2h.totalMatches }} partidos</p>
              </div>
              <div class="team-col">
                <p class="team-name">{{ h2h.team2Name }}</p>
                <p class="big-number">{{ h2h.team2Wins }}</p>
                <p class="label">Victorias</p>
                <p class="sub-stat">{{ h2h.team2GoalsAvg.toFixed(2) }} goles/p</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- 2. Goles -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Goles</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Media goles/p</p>
                  <p class="stat-value">{{ h2h.avgTotalGoals.toFixed(2) }}</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Mas de 2.5</p>
                  <p class="stat-value blue">{{ h2h.overPercentage.toFixed(1) }}%</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Menos de 2.5</p>
                  <p class="stat-value grey">{{ h2h.underPercentage.toFixed(1) }}%</p>
                </ion-col>
              </ion-row>
              <ion-row class="ion-margin-top">
                <ion-col class="ion-text-center">
                  <p class="stat-label">BTTS Si</p>
                  <p class="stat-value green">{{ h2h.bttsPercentage.toFixed(1) }}%</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">BTTS No</p>
                  <p class="stat-value red">{{ (100 - h2h.bttsPercentage).toFixed(1) }}%</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Resultado mas repetido</p>
                  <p class="stat-value">{{ h2h.mostCommonScore }}</p>
                  <p class="stat-sub">({{ h2h.mostCommonScoreCount }} veces)</p>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- 3. Porterias a cero -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Porterias a cero en H2H</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="h2h-scoreboard">
              <div class="team-col">
                <p class="team-name">{{ h2h.team1Name }}</p>
                <p class="big-number">{{ h2h.team1CleanSheets }}</p>
                <p class="label">veces</p>
                <p class="stat-sub">{{ h2h.totalMatches > 0 ? ((h2h.team1CleanSheets / h2h.totalMatches) * 100).toFixed(0) : 0 }}% de partidos</p>
              </div>
              <div class="team-col center"></div>
              <div class="team-col">
                <p class="team-name">{{ h2h.team2Name }}</p>
                <p class="big-number">{{ h2h.team2CleanSheets }}</p>
                <p class="label">veces</p>
                <p class="stat-sub">{{ h2h.totalMatches > 0 ? ((h2h.team2CleanSheets / h2h.totalMatches) * 100).toFixed(0) : 0 }}% de partidos</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- 4. Resultado al descanso -->
        <ion-card v-if="h2h.htMatchesWithData > 0">
          <ion-card-header>
            <ion-card-title>Resultado al descanso</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="h2h-scoreboard">
              <div class="team-col">
                <p class="team-name">{{ h2h.team1Name }}</p>
                <p class="big-number">{{ h2h.htTeam1Wins }}</p>
                <p class="label">Ganando</p>
                <p class="stat-sub">{{ h2h.htMatchesWithData > 0 ? ((h2h.htTeam1Wins / h2h.htMatchesWithData) * 100).toFixed(0) : 0 }}%</p>
              </div>
              <div class="team-col center">
                <p class="big-number draws">{{ h2h.htDraws }}</p>
                <p class="label">Igualados</p>
                <p class="stat-sub">{{ h2h.htMatchesWithData > 0 ? ((h2h.htDraws / h2h.htMatchesWithData) * 100).toFixed(0) : 0 }}%</p>
              </div>
              <div class="team-col">
                <p class="team-name">{{ h2h.team2Name }}</p>
                <p class="big-number">{{ h2h.htTeam2Wins }}</p>
                <p class="label">Ganando</p>
                <p class="stat-sub">{{ h2h.htMatchesWithData > 0 ? ((h2h.htTeam2Wins / h2h.htMatchesWithData) * 100).toFixed(0) : 0 }}%</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- 5. Distribucion de victorias -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Distribucion de victorias</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <Bar :data="chartData" :options="chartOptions" style="max-height: 220px" />
          </ion-card-content>
        </ion-card>

        <!-- 6. Ultimos enfrentamientos -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Ultimos enfrentamientos</ion-card-title>
          </ion-card-header>
          <ion-card-content class="ion-no-padding">
            <ion-list lines="full">
              <ion-item v-for="m in h2h.recentMatches" :key="m.id">
                <ion-label>
                  <div class="match-row">
                    <span class="match-team">{{ m.homeTeamName }}</span>
                    <span class="match-score">{{ m.homeGoals }} - {{ m.awayGoals }}</span>
                    <span class="match-team right">{{ m.awayTeamName }}</span>
                  </div>
                  <p class="match-meta">
                    <span>{{ formatDate(m.matchDate) }}</span>
                    <span v-if="m.htHomeGoals != null" class="ht-score">(HT: {{ m.htHomeGoals }}-{{ m.htAwayGoals }})</span>
                  </p>
                </ion-label>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>

      </template>

      <div v-if="error" class="ion-padding ion-text-center">
        <ion-text color="danger">{{ error }}</ion-text>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonGrid, IonRow, IonCol, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonList, IonSpinner, IonText,
} from '@ionic/vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { statisticsApi, teamsApi } from '@/services/api';
import { useTeamsStore } from '@/stores/teamsStore';
import type { HeadToHead, Team } from '@/types';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const teamsStore = useTeamsStore();

const selectedLeagueApiId = ref<number | null>(null);
const selectedSeason = ref<string | null>(null);
const availableTeams = ref<Team[]>([]);
const loadingTeams = ref(false);

const team1Id = ref<number | null>(null);
const team2Id = ref<number | null>(null);
const h2h = ref<HeadToHead | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const uniqueLeagues = computed(() => {
  const byApiId = new Map<number, typeof teamsStore.competitions[0]>();
  for (const c of teamsStore.competitions) {
    byApiId.set(c.apiId, c);
  }
  return [...byApiId.values()].sort((a, b) => a.name.localeCompare(b.name));
});

const seasonsForLeague = computed(() =>
  teamsStore.competitions
    .filter(c => c.apiId === selectedLeagueApiId.value)
    .map(c => c.season)
    .filter(Boolean)
    .sort()
    .reverse()
);

watch(selectedLeagueApiId, (apiId) => {
  team1Id.value = null;
  team2Id.value = null;
  h2h.value = null;
  availableTeams.value = [];
  if (!apiId) {
    selectedSeason.value = null;
    return;
  }
  const seasons = teamsStore.competitions
    .filter(c => c.apiId === apiId)
    .map(c => c.season)
    .sort()
    .reverse();
  const latestSeason = seasons[0] ?? null;
  if (selectedSeason.value === latestSeason) {
    loadTeams();
  } else {
    selectedSeason.value = latestSeason;
  }
});

watch(selectedSeason, () => {
  if (selectedLeagueApiId.value) {
    team1Id.value = null;
    team2Id.value = null;
    h2h.value = null;
    loadTeams();
  }
});

async function loadTeams() {
  if (!selectedLeagueApiId.value) return;
  loadingTeams.value = true;
  try {
    const leagueComps = teamsStore.competitions.filter(c => c.apiId === selectedLeagueApiId.value);
    if (!selectedSeason.value) {
      const allTeams = new Map<number, Team>();
      for (const comp of leagueComps) {
        try {
          const { data } = await teamsApi.getAll(comp.id, comp.season);
          if (data) for (const t of data) allTeams.set(t.id, t);
        } catch { /* ignorar errores individuales */ }
      }
      availableTeams.value = [...allTeams.values()].sort((a, b) => a.name.localeCompare(b.name));
    } else {
      const comp = leagueComps.find(c => c.season === selectedSeason.value);
      if (!comp) {
        availableTeams.value = [];
      } else {
        const { data } = await teamsApi.getAll(comp.id, selectedSeason.value!);
        availableTeams.value = data ?? [];
      }
    }
  } catch {
    availableTeams.value = [];
  } finally {
    loadingTeams.value = false;
  }
}

onMounted(async () => {
  if (teamsStore.competitions.length === 0) {
    await teamsStore.fetchCompetitions();
  }
  if (uniqueLeagues.value.length > 0) {
    selectedLeagueApiId.value = uniqueLeagues.value[0].apiId;
  }
});

async function compare() {
  if (!team1Id.value || !team2Id.value) return;
  loading.value = true;
  error.value = null;
  h2h.value = null;
  try {
    const season = selectedSeason.value ?? undefined;
    const { data } = await statisticsApi.getH2H(team1Id.value, team2Id.value, season);
    h2h.value = data;
  } catch {
    error.value = 'No se pudieron cargar los datos H2H.';
  } finally {
    loading.value = false;
  }
}

const chartData = computed(() => {
  const total = h2h.value?.totalMatches ?? 0;
  const pct = (n: number) => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : '0%';
  return {
    labels: [
      [h2h.value?.team1Name ?? 'Equipo 1', pct(h2h.value?.team1Wins ?? 0)],
      ['Empates', pct(h2h.value?.draws ?? 0)],
      [h2h.value?.team2Name ?? 'Equipo 2', pct(h2h.value?.team2Wins ?? 0)],
    ],
    datasets: [
      {
        label: 'Partidos',
        data: [h2h.value?.team1Wins ?? 0, h2h.value?.draws ?? 0, h2h.value?.team2Wins ?? 0],
        backgroundColor: ['#3880ff', '#999999', '#eb445a'],
      },
    ],
  };
});

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
  margin-bottom: 8px;
}
.team-col { flex: 1; }
.team-name { font-weight: 600; font-size: 0.85rem; margin-bottom: 4px; }
.big-number { font-size: 2rem; font-weight: 700; margin: 0; }
.big-number.draws { color: var(--ion-color-medium); }
.label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0; }
.team-col.center .label { margin-top: 18px; }
.sub-stat { font-size: 0.75rem; color: var(--ion-color-medium); margin: 4px 0 0; }
.stat-label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0; }
.stat-value { font-size: 1.2rem; font-weight: 600; margin: 2px 0 0; }
.stat-value.blue { color: #3880ff; }
.stat-value.grey { color: #999; }
.stat-value.green { color: #2dd36f; }
.stat-value.red { color: #eb445a; }
.stat-sub { font-size: 0.7rem; color: var(--ion-color-medium); margin: 0; }
.match-row { display: flex; align-items: center; gap: 8px; }
.match-team { flex: 1; font-size: 0.85rem; }
.match-team.right { text-align: right; }
.match-score { font-weight: 700; white-space: nowrap; }
.match-meta { display: flex; gap: 8px; font-size: 0.75rem; color: var(--ion-color-medium); margin: 2px 0 0; }
.ht-score { color: var(--ion-color-medium); }
</style>
