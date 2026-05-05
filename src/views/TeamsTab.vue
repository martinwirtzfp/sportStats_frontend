<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Equipos</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment :value="String(store.selectedCompetitionId)" @ionChange="onSegmentChange">
          <ion-segment-button
            v-for="comp in store.competitions"
            :key="comp.id"
            :value="String(comp.id)"
          >
            <ion-label>{{ comp.name }}</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div v-if="store.loading" class="ion-padding ion-text-center">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
      </div>

      <ion-list v-else>
        <ion-item
          v-for="team in store.teams"
          :key="team.id"
          button
          detail
          @click="router.push(`/teams/${team.id}`)"
        >
          <ion-avatar slot="start">
            <img :src="team.logoUrl || '/placeholder-team.png'" :alt="team.name" />
          </ion-avatar>
          <ion-label>
            <h2>{{ team.name }}</h2>
            <p>{{ team.competitionName }}</p>
          </ion-label>
          <ion-button
            fill="clear"
            slot="end"
            @click.stop="toggleFavorite(team)"
          >
            <ion-icon
              :icon="favStore.isFavorite(team.id) ? heart : heartOutline"
              :color="favStore.isFavorite(team.id) ? 'danger' : 'medium'"
            ></ion-icon>
          </ion-button>
        </ion-item>
      </ion-list>

      <div v-if="!store.loading && store.teams.length === 0" class="ion-padding ion-text-center">
        <p>No hay equipos disponibles.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel, IonAvatar, IonButton, IonIcon,
  IonSegment, IonSegmentButton, IonSpinner, IonRefresher, IonRefresherContent,
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

onMounted(async () => {
  await store.fetchCompetitions();
  if (store.selectedCompetitionId) {
    store.fetchTeams(store.selectedCompetitionId);
  }
  if (authStore.isLoggedIn) {
    favStore.fetch();
  }
});

function onSegmentChange(ev: CustomEvent) {
  const id = Number(ev.detail.value);
  store.selectCompetition(id);
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
  await store.fetchTeams(store.selectedCompetitionId ?? undefined);
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
