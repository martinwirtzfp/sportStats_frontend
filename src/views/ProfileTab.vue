<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Perfil</ion-title>
        <ion-buttons slot="end" v-if="authStore.isLoggedIn">
          <ion-button @click="logout">
            <ion-icon :icon="logOut" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Not logged in -->
      <div v-if="!authStore.isLoggedIn" class="ion-padding ion-text-center center-content">
        <ion-icon :icon="personCircle" style="font-size: 80px; color: var(--ion-color-medium)"></ion-icon>
        <h2>Inicia sesión para ver tus favoritos</h2>
        <ion-button expand="block" router-link="/login" class="ion-margin-top">
          Iniciar sesión
        </ion-button>
        <ion-button expand="block" fill="outline" router-link="/register">
          Crear cuenta
        </ion-button>
      </div>

      <!-- Logged in -->
      <div v-else>
        <ion-card>
          <ion-card-content>
            <div class="user-info">
              <ion-icon :icon="personCircle" style="font-size: 56px; color: var(--ion-color-primary)"></ion-icon>
              <div>
                <h2 style="margin: 0">{{ authStore.user?.username }}</h2>
                <p style="margin: 2px 0 0; color: var(--ion-color-medium)">{{ authStore.user?.email }}</p>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <ion-list-header>
          <ion-label>Equipos favoritos</ion-label>
        </ion-list-header>

        <div v-if="favStore.loading" class="ion-padding ion-text-center">
          <ion-spinner name="crescent" color="primary"></ion-spinner>
        </div>

        <ion-list v-else-if="favStore.favorites.length > 0">
          <ion-item-sliding v-for="fav in favStore.favorites" :key="fav.id">
            <ion-item button detail @click="router.push(`/teams/${fav.teamId}`)">
              <ion-avatar slot="start">
                <img :src="fav.teamLogo || '/placeholder-team.png'" :alt="fav.teamName" />
              </ion-avatar>
              <ion-label>{{ fav.teamName }}</ion-label>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" @click="removeFav(fav.teamId)">
                <ion-icon :icon="trash" slot="icon-only"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        </ion-list>

        <div v-else class="ion-padding ion-text-center">
          <p>No tienes equipos favoritos aún.</p>
          <ion-button fill="outline" router-link="/tabs/teams">Explorar equipos</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonCard, IonCardContent, IonList, IonListHeader, IonLabel,
  IonItem, IonItemSliding, IonItemOptions, IonItemOption,
  IonAvatar, IonButton, IonButtons, IonIcon, IonSpinner,
} from '@ionic/vue';
import { personCircle, logOut, trash } from 'ionicons/icons';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';

const router = useRouter();
const authStore = useAuthStore();
const favStore = useFavoritesStore();

onMounted(() => {
  if (authStore.isLoggedIn) {
    favStore.fetch();
  }
});

function logout() {
  authStore.logout();
  favStore.clear();
}

async function removeFav(teamId: number) {
  await favStore.remove(teamId);
}
</script>

<style scoped>
.center-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 16px;
}
ion-avatar {
  --border-radius: 8px;
}
ion-avatar img {
  object-fit: contain;
  padding: 4px;
}
</style>
