<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Equipos</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Filtros liga / temporada -->
      <div class="ion-padding-horizontal ion-padding-top">
        <ion-item>
          <ion-label position="stacked">Liga</ion-label>
          <ion-select
            v-model="selectedLiga"
            interface="action-sheet"
            placeholder="Selecciona una liga"
          >
            <ion-select-option v-for="league in uniqueLeagues" :key="league.apiId" :value="league.apiId">
              {{ league.name }}
            </ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Temporada</ion-label>
          <ion-select
            v-model="selectedSeason"
            interface="popover"
            placeholder="Selecciona temporada"
            :disabled="!selectedLiga"
          >
            <ion-select-option v-for="s in seasonsForLiga" :key="s" :value="s">
              {{ s }}
            </ion-select-option>
          </ion-select>
        </ion-item>
      </div>

      <div v-if="store.loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>

      <template v-else>
        <ion-list v-if="store.teams.length > 0">
          <ion-item
            v-for="team in store.teams"
            :key="team.id"
            button
            detail
            @click="navigateToTeam(team)"
          >
            <ion-avatar slot="start">
              <img :src="team.logoUrl || '/placeholder-team.png'" :alt="team.name" />
            </ion-avatar>
            <ion-label>
              <h2>{{ team.name }}</h2>
              <p>{{ selectedLigaName }} · {{ selectedSeason }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click.stop="toggleFavorite(team)">
              <ion-icon
                :icon="favStore.isFavorite(team.id) ? heart : heartOutline"
                :color="favStore.isFavorite(team.id) ? 'danger' : 'medium'"
              ></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>

        <div v-else-if="!selectedLiga || !selectedSeason" class="ion-padding ion-text-center">
          <p>Selecciona una liga y temporada para ver los equipos.</p>
        </div>
        <div v-else class="ion-padding ion-text-center">
          <p>No hay equipos disponibles para esta selección.</p>
        </div>
      </template>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonAvatar, IonButton, IonIcon,
  IonSelect, IonSelectOption, IonSpinner, IonRefresher, IonRefresherContent,
} from '@ionic/vue';
import { heart, heartOutline } from 'ionicons/icons';
import { useTeamsStore } from '@/stores/teamsStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useAuthStore } from '@/stores/authStore';
import type { Team } from '@/types';

const router = useRouter();
const store = useTeamsStore();
const favStore = useFavoritesStore();
const authStore = useAuthStore();

const selectedLiga = ref<number | null>(null);
const selectedSeason = ref<string | null>(null);

// One entry per unique apiId, keeping the most recently imported name for display
const uniqueLeagues = computed(() => {
  const byApiId = new Map<number, typeof store.competitions[0]>();
  for (const c of store.competitions) {
    byApiId.set(c.apiId, c); // last-write wins (most recent import name)
  }
  return [...byApiId.values()].sort((a, b) => a.name.localeCompare(b.name));
});

const seasonsForLiga = computed(() =>
  store.competitions
    .filter(c => c.apiId === selectedLiga.value)
    .map(c => c.season)
    .sort()
    .reverse()
);

const selectedCompetition = computed(() =>
  store.competitions.find(
    c => c.apiId === selectedLiga.value && c.season === selectedSeason.value
  ) ?? null
);

const selectedLigaName = computed(() =>
  uniqueLeagues.value.find(l => l.apiId === selectedLiga.value)?.name ?? ''
);

// When liga changes, auto-select the latest available season for it
watch(selectedLiga, (apiId) => {
  store.clearTeams();
  if (!apiId) {
    selectedSeason.value = null;
    return;
  }
  const seasons = store.competitions
    .filter(c => c.apiId === apiId)
    .map(c => c.season)
    .sort()
    .reverse();
  const latestSeason = seasons[0] ?? null;
  if (selectedSeason.value === latestSeason && latestSeason) {
    // La temporada no cambió de valor pero sí la liga — disparar carga manualmente
    const comp = store.competitions.find(c => c.apiId === apiId && c.season === latestSeason);
    if (comp) store.fetchTeamsBySeason(comp.id, latestSeason);
  } else {
    selectedSeason.value = latestSeason;
  }
});

// Load teams when a season is selected
watch(selectedSeason, (season) => {
  if (selectedCompetition.value && season) {
    store.fetchTeamsBySeason(selectedCompetition.value.id, season);
  }
});

onMounted(async () => {
  await store.fetchCompetitions();
  // Auto-select the first liga; watch(selectedLiga) will auto-set the season and trigger team fetch
  if (store.competitions.length > 0) {
    selectedLiga.value = uniqueLeagues.value[0]?.apiId ?? null;
  }
  if (authStore.isLoggedIn) {
    favStore.fetch();
  }
});

function navigateToTeam(team: Team) {
  const query = selectedSeason.value ? { season: selectedSeason.value } : {};
  router.push({ path: `/teams/${team.id}`, query });
}

async function toggleFavorite(team: Team) {
  if (!authStore.isLoggedIn) {
    router.push('/login');
    return;
  }
  if (favStore.isFavorite(team.id)) {
    await favStore.remove(team.id);
  } else {
    await favStore.add(team.id);
  }
}

async function onRefresh(ev: CustomEvent) {
  if (selectedCompetition.value && selectedSeason.value) {
    await store.fetchTeamsBySeason(selectedCompetition.value.id, selectedSeason.value);
  }
  (ev.target as HTMLIonRefresherElement).complete();
}
</script>

<style scoped>
ion-avatar {
  --border-radius: 8px;
}
ion-avatar img {
  object-fit: contain;
  padding: 4px;
}
</style>
