import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/TabsPage.vue';
import { useAuthStore } from '@/stores/authStore';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/teams',
  },
  {
    path: '/login',
    component: () => import('@/views/LoginPage.vue'),
  },
  {
    path: '/register',
    component: () => import('@/views/RegisterPage.vue'),
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/teams',
      },
      {
        path: 'teams',
        component: () => import('@/views/TeamsTab.vue'),
      },
      {
        path: 'compare',
        component: () => import('@/views/CompareTab.vue'),
      },
      {
        path: 'calculator',
        component: () => import('@/views/CalculatorTab.vue'),
      },
      {
        path: 'profile',
        component: () => import('@/views/ProfileTab.vue'),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: '/teams/:id',
    component: () => import('@/views/TeamDetailPage.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach((to) => {
  const authStore = useAuthStore();
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return '/login';
  }
});

export default router;
