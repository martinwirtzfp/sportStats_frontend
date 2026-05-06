import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Team, Competition } from '@/types'
import { teamsApi, competitionsApi } from '@/services/api'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref<Team[]>([])
  const competitions = ref<Competition[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchCompetitions() {
    try {
      const { data } = await competitionsApi.getAll()
      competitions.value = data
    } catch (e) {
      error.value = 'Error loading competitions'
    }
  }

  async function fetchTeamsBySeason(competitionId: number, season: string) {
    loading.value = true
    error.value = null
    try {
      const { data } = await teamsApi.getAll(competitionId, season)
      teams.value = data ?? []
    } catch (e) {
      error.value = 'Error loading teams'
      teams.value = []
    } finally {
      loading.value = false
    }
  }

  function clearTeams() {
    teams.value = []
  }

  return { teams, competitions, loading, error, fetchCompetitions, fetchTeamsBySeason, clearTeams }
})
