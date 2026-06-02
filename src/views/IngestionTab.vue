<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Ingestar datos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Not logged in -->
      <div v-if="!authStore.isLoggedIn" class="ion-text-center center-content">
        <ion-icon :icon="lockClosed" style="font-size: 64px; color: var(--ion-color-medium)"></ion-icon>
        <h2>Acceso restringido</h2>
        <p>Debes iniciar sesión para poder importar datos.</p>
        <ion-button expand="block" router-link="/login" class="ion-margin-top">
          Iniciar sesión
        </ion-button>
      </div>

      <!-- Logged in -->
      <div v-else>
        <ion-card>
          <ion-card-header>
            <ion-card-title>Importar competición</ion-card-title>
            <ion-card-subtitle>
              Introduce los datos de la competición a importar desde API-Football.
              Cada llamada consume ~2 peticiones de tu cuota.
            </ion-card-subtitle>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="none">
              <ion-item>
                <ion-input
                  v-model="competitionName"
                  label="Nombre de la competición"
                  label-placement="stacked"
                  placeholder="Ej: La Liga"
                  :disabled="loading"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  v-model.number="leagueApiId"
                  label="ID de la liga (API-Football)"
                  label-placement="stacked"
                  type="number"
                  placeholder="Ej: 140"
                  :disabled="loading"
                ></ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  v-model="season"
                  label="Temporada"
                  label-placement="stacked"
                  placeholder="Ej: 2024"
                  :disabled="loading"
                ></ion-input>
              </ion-item>
              <ion-item v-if="season.trim().length > 0 && !seasonValid" lines="none">
                <ion-text color="warning" style="font-size: 0.85rem">
                  La temporada debe ser un año entre 2010 y {{ new Date().getFullYear() }}.
                </ion-text>
              </ion-item>
            </ion-list>

            <div class="ion-padding-top">
              <ion-button
                expand="block"
                :disabled="loading || !isFormValid"
                @click="ingest"
              >
                <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
                {{ loading ? 'Importando...' : 'Importar datos' }}
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Success -->
        <ion-card v-if="successMessage" color="success">
          <ion-card-content>
            <div class="msg-row">
              <span>
                <ion-icon :icon="checkmarkCircle" style="vertical-align: middle; margin-right: 8px"></ion-icon>
                {{ successMessage }}
              </span>
              <ion-button fill="clear" size="small" color="light" @click="successMessage = ''" style="flex-shrink:0">
                <ion-icon :icon="closeCircle" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Warning (0 items imported) -->
        <ion-card v-if="warningMessage" color="warning">
          <ion-card-content>
            <div class="msg-row">
              <span>
                <ion-icon :icon="alertCircle" style="vertical-align: middle; margin-right: 8px"></ion-icon>
                {{ warningMessage }}
              </span>
              <ion-button fill="clear" size="small" color="dark" @click="warningMessage = ''" style="flex-shrink:0">
                <ion-icon :icon="closeCircle" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Timeout (backend still processing) -->
        <ion-card v-if="timeoutMessage" color="tertiary">
          <ion-card-content>
            <div class="msg-row">
              <span>
                <ion-icon :icon="timeOutline" style="vertical-align: middle; margin-right: 8px"></ion-icon>
                {{ timeoutMessage }}
              </span>
              <ion-button fill="clear" size="small" color="light" @click="timeoutMessage = ''" style="flex-shrink:0">
                <ion-icon :icon="closeCircle" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Error -->
        <ion-card v-if="errorMessage" color="danger">
          <ion-card-content>
            <div class="msg-row">
              <span>
                <ion-icon :icon="alertCircle" style="vertical-align: middle; margin-right: 8px"></ion-icon>
                {{ errorMessage }}
              </span>
              <ion-button fill="clear" size="small" color="light" @click="errorMessage = ''" style="flex-shrink:0">
                <ion-icon :icon="closeCircle" slot="icon-only"></ion-icon>
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Reference card -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>IDs de ligas más comunes</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-list lines="full">
              <ion-item
                v-for="league in knownLeagues"
                :key="league.id"
                button
                @click="fillForm(league)"
              >
                <ion-label>
                  <h3>{{ league.name }}</h3>
                  <p>ID: {{ league.id }}</p>
                </ion-label>
                <ion-note slot="end" color="primary">Usar</ion-note>
              </ion-item>
            </ion-list>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonList, IonItem, IonLabel, IonInput, IonButton, IonSpinner,
  IonIcon, IonNote, IonText,
} from '@ionic/vue';
import { lockClosed, checkmarkCircle, alertCircle, timeOutline, closeCircle } from 'ionicons/icons';
import { ingestionApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { useTeamsStore } from '@/stores/teamsStore';

const authStore = useAuthStore();
const teamsStore = useTeamsStore();

const leagueApiId = ref<number | null>(null);
const season = ref('');
const competitionName = ref('');
const loading = ref(false);
const successMessage = ref('');
const warningMessage = ref('');
const timeoutMessage = ref('');
const errorMessage = ref('');

const seasonValid = computed(() => {
  const y = Number(season.value.trim());
  return /^\d{4}$/.test(season.value.trim()) && y >= 2010 && y <= new Date().getFullYear();
});

const isFormValid = computed(() =>
  leagueApiId.value !== null &&
  leagueApiId.value > 0 &&
  seasonValid.value &&
  competitionName.value.trim().length > 0
);

const knownLeagues = [
  { id: 140, name: 'La Liga (España)' },
  { id: 39,  name: 'Premier League (Inglaterra)' },
  { id: 135, name: 'Serie A (Italia)' },
  { id: 78,  name: 'Bundesliga (Alemania)' },
  { id: 61,  name: 'Ligue 1 (Francia)' },
  { id: 2,   name: 'UEFA Champions League' },
  { id: 3,   name: 'UEFA Europa League' },
];

function fillForm(league: { id: number; name: string }) {
  leagueApiId.value = league.id;
  competitionName.value = league.name;
  successMessage.value = '';
  errorMessage.value = '';
}

async function ingest() {
  if (!isFormValid.value) return;
  loading.value = true;
  successMessage.value = '';
  warningMessage.value = '';
  timeoutMessage.value = '';
  errorMessage.value = '';
  try {
    const response = await ingestionApi.ingestLeague(leagueApiId.value!, season.value.trim(), competitionName.value.trim());
    const msg: string = response.data ?? '';
    if (msg.startsWith('Advertencia')) {
      warningMessage.value = msg;
    } else {
      successMessage.value = msg;
      // Refresh competitions/teams in the store only when data was imported
      await teamsStore.fetchCompetitions();
    }
  } catch (err: any) {
    const isTimeout = err.code === 'ECONNABORTED' || err.message?.includes('timeout');
    if (isTimeout) {
      timeoutMessage.value =
        'La importación está tardando más de lo esperado (servidor lento). Los datos se están procesando en segundo plano. Recarga la app en unos segundos para ver los cambios.';
      // Refresh anyway in case data was partially or fully imported
      await teamsStore.fetchCompetitions();
    } else {
      const msg = err?.response?.data?.message || err?.message || 'Error desconocido';
      errorMessage.value = `Error al importar: ${msg}`;
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 24px;
}

.msg-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.msg-row span {
  flex: 1;
}
</style>
