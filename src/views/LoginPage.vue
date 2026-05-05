<template>
  <ion-page>
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/profile"></ion-back-button>
        </ion-buttons>
        <ion-title>Iniciar sesión</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <div class="auth-container">
        <ion-icon :icon="football" class="auth-icon" color="primary"></ion-icon>
        <h1>Sport Stats</h1>

        <ion-card>
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Email</ion-label>
              <ion-input
                v-model="email"
                type="email"
                placeholder="tu@email.com"
                autocomplete="email"
              ></ion-input>
            </ion-item>
            <ion-item>
              <ion-label position="stacked">Contraseña</ion-label>
              <ion-input
                v-model="password"
                type="password"
                placeholder="••••••••"
                autocomplete="current-password"
              ></ion-input>
            </ion-item>

            <ion-text color="danger" v-if="error">
              <p class="ion-padding-start">{{ error }}</p>
            </ion-text>

            <ion-button
              expand="block"
              class="ion-margin-top"
              :disabled="loading"
              @click="login"
            >
              <ion-spinner v-if="loading" name="crescent" slot="start"></ion-spinner>
              Entrar
            </ion-button>
          </ion-card-content>
        </ion-card>

        <p class="ion-text-center">
          ¿No tienes cuenta?
          <router-link to="/register">Regístrate</router-link>
        </p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons,
  IonBackButton, IonCard, IonCardContent, IonItem, IonLabel, IonInput,
  IonButton, IonIcon, IonSpinner, IonText,
} from '@ionic/vue';
import { football } from 'ionicons/icons';
import { authApi } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

async function login() {
  if (!email.value || !password.value) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await authApi.login(email.value, password.value);
    authStore.setSession(data);
    router.replace('/tabs/profile');
  } catch {
    error.value = 'Credenciales incorrectas.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 40px;
}
.auth-icon {
  font-size: 72px;
}
h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 8px 0 24px;
}
ion-card {
  width: 100%;
}
</style>
