<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="teams" href="/tabs/teams">
          <ion-icon :icon="football" />
          <ion-label>Equipos</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="compare" href="/tabs/compare">
          <ion-icon :icon="swapHorizontal" />
          <ion-label>Comparar</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="calculator" href="/tabs/calculator">
          <ion-icon :icon="calculator" />
          <ion-label>Calculadora</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" href="/tabs/profile">
          <ion-icon :icon="person" />
          <ion-label>Perfil</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { football, swapHorizontal, calculator, person } from 'ionicons/icons';
</script>
