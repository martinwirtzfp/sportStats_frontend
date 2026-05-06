<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Calculadora de Probabilidades</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Configuración -->
      <ion-card>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Liga</ion-label>
            <ion-select v-model="selectedLeagueApiId" interface="action-sheet" placeholder="Seleccionar liga">
              <ion-select-option v-for="l in uniqueLeagues" :key="l.apiId" :value="l.apiId">
                {{ l.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <div v-if="loadingTeams" class="ion-padding ion-text-center">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
          </div>
          <template v-else-if="selectedLeagueApiId">
            <ion-item>
              <ion-label position="stacked">Equipo local</ion-label>
              <ion-select v-model="homeTeamId" placeholder="Seleccionar" interface="action-sheet">
                <ion-select-option v-for="t in availableTeams" :key="t.id" :value="t.id">
                  {{ t.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Equipo visitante</ion-label>
              <ion-select v-model="awayTeamId" placeholder="Seleccionar" interface="action-sheet">
                <ion-select-option v-for="t in availableTeams" :key="t.id" :value="t.id">
                  {{ t.name }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-button
              expand="block"
              class="ion-margin-top"
              :disabled="!homeTeamId || !awayTeamId || loading"
              @click="calculate"
            >
              <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
              Calcular
            </ion-button>
          </template>
          <div v-else class="ion-padding-top">
            <p>Selecciona una liga para continuar.</p>
          </div>
        </ion-card-content>
      </ion-card>

      <!-- Resultados -->
      <div v-if="risk">
        <!-- 1X2 -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Resultado final (1X2)</ion-card-title>
            <ion-card-subtitle>{{ risk.homeTeamName }} vs {{ risk.awayTeamName }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <div class="prob-row">
              <div class="prob-item">
                <p class="prob-label">1 - Local</p>
                <p class="prob-value" style="color: #3880ff">{{ pct(risk.probability1X2.homeWin) }}</p>
                <div class="prob-bar"><div class="prob-fill blue" :style="{width: pct(risk.probability1X2.homeWin)}"></div></div>
              </div>
              <div class="prob-item">
                <p class="prob-label">X - Empate</p>
                <p class="prob-value" style="color: #999">{{ pct(risk.probability1X2.draw) }}</p>
                <div class="prob-bar"><div class="prob-fill grey" :style="{width: pct(risk.probability1X2.draw)}"></div></div>
              </div>
              <div class="prob-item">
                <p class="prob-label">2 - Visitante</p>
                <p class="prob-value" style="color: #eb445a">{{ pct(risk.probability1X2.awayWin) }}</p>
                <div class="prob-bar"><div class="prob-fill red" :style="{width: pct(risk.probability1X2.awayWin)}"></div></div>
              </div>
            </div>
            <Doughnut :data="chart1X2Data" :options="doughnutOptions" style="max-height: 180px; margin-top: 12px" />
          </ion-card-content>
        </ion-card>

        <!-- Over/Under + BTTS -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Goles y BTTS</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Más de 2.5</p>
                  <p class="stat-big blue">{{ pct(risk.overPercentage) }}</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Menos de 2.5</p>
                  <p class="stat-big grey">{{ pct(risk.underPercentage) }}</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">Media goles</p>
                  <p class="stat-big">{{ risk.avgTotalGoals.toFixed(2) }}</p>
                </ion-col>
              </ion-row>
              <ion-row>
                <ion-col class="ion-text-center">
                  <p class="stat-label">BTTS Sí</p>
                  <p class="stat-big green">{{ risk.bttsYesPercentage.toFixed(2) }}%</p>
                </ion-col>
                <ion-col class="ion-text-center">
                  <p class="stat-label">BTTS No</p>
                  <p class="stat-big red">{{ risk.bttsNoPercentage.toFixed(2) }}%</p>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ion-card-content>
        </ion-card>

        <!-- Half-time -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>Resultado al descanso</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="prob-row">
              <div class="prob-item">
                <p class="prob-label">Local</p>
                <p class="prob-value" style="color: #3880ff">{{ pct(risk.halfTimeProbability.homeWin) }}</p>
              </div>
              <div class="prob-item">
                <p class="prob-label">Empate</p>
                <p class="prob-value" style="color: #999">{{ pct(risk.halfTimeProbability.draw) }}</p>
              </div>
              <div class="prob-item">
                <p class="prob-label">Visitante</p>
                <p class="prob-value" style="color: #eb445a">{{ pct(risk.halfTimeProbability.awayWin) }}</p>
              </div>
            </div>
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
import { ref, computed, watch, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol, IonSpinner, IonText,
} from '@ionic/vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { statisticsApi, teamsApi } from '@/services/api';
import { useTeamsStore } from '@/stores/teamsStore';
import type { RiskAnalysis, Team } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const teamsStore = useTeamsStore();

const selectedLeagueApiId = ref<number | null>(null);
const availableTeams = ref<Team[]>([]);
const loadingTeams = ref(false);

const homeTeamId = ref<number | null>(null);
const awayTeamId = ref<number | null>(null);
const risk = ref<RiskAnalysis | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const uniqueLeagues = computed(() => {
  const byApiId = new Map<number, typeof teamsStore.competitions[0]>();
  for (const c of teamsStore.competitions) {
    byApiId.set(c.apiId, c);
  }
  return [...byApiId.values()].sort((a, b) => a.name.localeCompare(b.name));
});

watch(selectedLeagueApiId, (apiId) => {
  homeTeamId.value = null;
  awayTeamId.value = null;
  risk.value = null;
  availableTeams.value = [];
  if (!apiId) return;
  loadTeams();
});

async function loadTeams() {
  if (!selectedLeagueApiId.value) return;
  loadingTeams.value = true;
  try {
    const leagueComps = teamsStore.competitions.filter(c => c.apiId === selectedLeagueApiId.value);
    const allTeams = new Map<number, Team>();
    for (const comp of leagueComps) {
      try {
        const { data } = await teamsApi.getAll(comp.id, comp.season);
        if (data) for (const t of data) allTeams.set(t.id, t);
      } catch { /* ignorar errores individuales */ }
    }
    availableTeams.value = [...allTeams.values()].sort((a, b) => a.name.localeCompare(b.name));
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

async function calculate() {
  if (!homeTeamId.value || !awayTeamId.value) return;
  loading.value = true;
  error.value = null;
  risk.value = null;
  try {
    const { data } = await statisticsApi.getRisk(homeTeamId.value, awayTeamId.value);
    risk.value = data;
  } catch {
    error.value = 'No se pudieron calcular las probabilidades.';
  } finally {
    loading.value = false;
  }
}

function pct(value: number) {
  return `${value.toFixed(2)}%`;
}

const chart1X2Data = computed(() => ({
  labels: ['Local', 'Empate', 'Visitante'],
  datasets: [
    {
      data: [
        risk.value?.probability1X2.homeWin ?? 0,
        risk.value?.probability1X2.draw ?? 0,
        risk.value?.probability1X2.awayWin ?? 0,
      ],
      backgroundColor: ['#3880ff', '#999999', '#eb445a'],
      borderWidth: 0,
    },
  ],
}));

const doughnutOptions = {
  responsive: true,
  plugins: { legend: { position: 'bottom' as const } },
};
</script>

<style scoped>
.prob-row { display: flex; gap: 8px; margin-bottom: 8px; }
.prob-item { flex: 1; text-align: center; }
.prob-label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0 0 2px; }
.prob-value { font-size: 1.3rem; font-weight: 700; margin: 0 0 4px; }
.prob-bar { height: 6px; background: #eee; border-radius: 3px; overflow: hidden; }
.prob-fill { height: 100%; border-radius: 3px; }
.prob-fill.blue { background: #3880ff; }
.prob-fill.grey { background: #999; }
.prob-fill.red { background: #eb445a; }
.stat-label { font-size: 0.75rem; color: var(--ion-color-medium); margin: 0; }
.stat-big { font-size: 1.4rem; font-weight: 700; margin: 2px 0; }
.stat-big.blue { color: #3880ff; }
.stat-big.grey { color: #999; }
.stat-big.green { color: #2dd36f; }
.stat-big.red { color: #eb445a; }
</style>
