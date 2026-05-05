import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const authStore = useAuthStore()
  if (authStore.token) {
    config.headers.Authorization = `Bearer ${authStore.token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
    }
    return Promise.reject(error)
  }
)

// --- Auth ---
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  register: (username: string, email: string, password: string) =>
    api.post('/api/auth/register', { username, email, password }),
}

// --- Competitions ---
export const competitionsApi = {
  getAll: () => api.get('/api/competitions'),
}

// --- Teams ---
export const teamsApi = {
  getAll: (competitionId?: number) =>
    api.get('/api/teams', { params: competitionId ? { competitionId } : {} }),
  getById: (id: number) => api.get(`/api/teams/${id}`),
}

// --- Matches ---
export const matchesApi = {
  getLastByTeam: (teamId: number, lastN = 10) =>
    api.get(`/api/matches/teams/${teamId}`, { params: { lastN } }),
  getH2H: (team1Id: number, team2Id: number) =>
    api.get('/api/matches/h2h', { params: { team1Id, team2Id } }),
}

// --- Statistics ---
export const statisticsApi = {
  getTeamStats: (teamId: number, lastN = 10) =>
    api.get(`/api/statistics/teams/${teamId}`, { params: { lastN } }),
  getRisk: (homeTeamId: number, awayTeamId: number, lastN = 10) =>
    api.get('/api/risk', { params: { homeTeamId, awayTeamId, lastN } }),
  getH2H: (team1Id: number, team2Id: number) =>
    api.get('/api/h2h', { params: { team1Id, team2Id } }),
}

// --- Favorites ---
export const favoritesApi = {
  getAll: () => api.get('/api/users/me/favorites'),
  add: (teamId: number) => api.post(`/api/users/me/favorites/${teamId}`),
  remove: (teamId: number) => api.delete(`/api/users/me/favorites/${teamId}`),
}

export default api
