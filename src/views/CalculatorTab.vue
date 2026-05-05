<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Calculadora de Probabilidades</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Team selectors -->
      <ion-card>
        <ion-card-content>
          <ion-item>
            <ion-label position="stacked">Equipo local</ion-label>
            <ion-select v-model="homeTeamId" placeholder="Seleccionar" interface="action-sheet">
              <ion-select-option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">
                {{ t.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Equipo visitante</ion-label>
            <ion-select v-model="awayTeamId" placeholder="Seleccionar" interface="action-sheet">
              <ion-select-option v-for="t in teamsStore.teams" :key="t.id" :value="t.id">
                {{ t.name }}
              </ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Últimos N partidos</ion-label>
            <ion-select v-model="lastN" interface="popover">
              <ion-select-option :value="5">5</ion-select-option>
              <ion-select-option :value="10">10</ion-select-option>
              <ion-select-option :value="15">15</ion-select-option>
              <ion-select-option :value="20">20</ion-select-option>
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label position="stacked">Temporada</ion-label>
            <ion-select v-model="selectedSeason" interface="popover">
              <ion-select-option :value="null">Todas</ion-select-option>
              <ion-select-option v-for="s in teamsStore.availableSeasons" :key="s" :value="s">{{ s }}</ion-select-option>
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
        </ion-card-content>
      </ion-card>

      <!-- Results -->
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
import { ref, computed, onMounted } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonItem, IonLabel, IonSelect, IonSelectOption,
  IonGrid, IonRow, IonCol, IonSpinner, IonText,
} from '@ionic/vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { statisticsApi } from '@/services/api';
import { useTeamsStore } from '@/stores/teamsStore';
import type { RiskAnalysis } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const teamsStore = useTeamsStore();
const homeTeamId = ref<number | null>(null);
const awayTeamId = ref<number | null>(null);
const lastN = ref(10);
const selectedSeason = ref<string | null>(null);
const risk = ref<RiskAnalysis | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

onMounted(() => {
  if (teamsStore.teams.length === 0) {
    teamsStore.fetchTeams();
  }
  if (teamsStore.competitions.length === 0) {
    teamsStore.fetchCompetitions();
  }
});

async function calculate() {
  if (!homeTeamId.value || !awayTeamId.value) return;
  loading.value = true;
  error.value = null;
  risk.value = null;
  try {
    const season = selectedSeason.value ?? undefined;
    const { data } = await statisticsApi.getRisk(homeTeamId.value, awayTeamId.value, lastN.value, season);
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
