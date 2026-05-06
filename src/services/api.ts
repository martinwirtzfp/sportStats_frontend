import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 15000,
})

// Instance with extended timeout for slow operations (e.g. ingestion against remote DB)
const apiSlow = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 90000,
})

function addAuthInterceptors(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  })
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const authStore = useAuthStore()
        authStore.logout()
      }
      return Promise.reject(error)
    }
  )
}

addAuthInterceptors(api)
addAuthInterceptors(apiSlow)

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
  getAll: (competitionId?: number, season?: string) =>
    api.get('/api/teams', { params: { ...(competitionId ? { competitionId } : {}), ...(season ? { season } : {}) } }),
  getById: (id: number) => api.get(`/api/teams/${id}`),
  getSeasons: (id: number) => api.get<string[]>(`/api/teams/${id}/seasons`),
}

// --- Matches ---
export const matchesApi = {
  getLastByTeam: (teamId: number, lastN = 10) =>
    api.get(`/api/matches/teams/${teamId}`, { params: { lastN } }),
}

// --- Statistics ---
export const statisticsApi = {
  getTeamStats: (teamId: number, lastN = 10, season?: string) =>
    api.get(`/api/statistics/teams/${teamId}`, { params: { lastN, ...(season ? { season } : {}) } }),
  getRisk: (homeTeamId: number, awayTeamId: number) =>
    api.get('/api/risk', { params: { homeTeamId, awayTeamId } }),
  getH2H: (team1Id: number, team2Id: number, season?: string) =>
    api.get('/api/h2h', { params: { team1Id, team2Id, ...(season ? { season } : {}) } }),
}

// --- Ingestion ---
export const ingestionApi = {
  ingestLeague: (leagueApiId: number, season: string, competitionName: string) =>
    apiSlow.post(`/api/ingestion/leagues/${leagueApiId}`, null, { params: { season, competitionName } }),
}

// --- Favorites ---
export const favoritesApi = {
  getAll: () => api.get('/api/users/me/favorites'),
  add: (teamId: number) => api.post(`/api/users/me/favorites/${teamId}`),
  remove: (teamId: number) => api.delete(`/api/users/me/favorites/${teamId}`),
}
