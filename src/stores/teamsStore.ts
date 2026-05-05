import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Team, Competition } from '@/types'
import { teamsApi, competitionsApi } from '@/services/api'

export const useTeamsStore = defineStore('teams', () => {
  const teams = ref<Team[]>([])
  const competitions = ref<Competition[]>([])
  const selectedCompetitionId = ref<number | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const availableSeasons = ref<string[]>([])

  async function fetchCompetitions() {
    try {
      const { data } = await competitionsApi.getAll()
      competitions.value = data
      if (data.length > 0 && !selectedCompetitionId.value) {
        selectedCompetitionId.value = data[0].id
      }
      availableSeasons.value = [...new Set<string>(data.map((c: any) => c.season).filter(Boolean))].sort().reverse()
    } catch (e) {
      error.value = 'Error loading competitions'
    }
  }

  async function fetchTeams(competitionId?: number) {
    loading.value = true
    error.value = null
    try {
      const { data } = await teamsApi.getAll(competitionId)
      teams.value = data
    } catch (e) {
      error.value = 'Error loading teams'
    } finally {
      loading.value = false
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

  function selectCompetition(id: number) {
    selectedCompetitionId.value = id
    fetchTeams(id)
  }

  return { teams, competitions, selectedCompetitionId, loading, error, availableSeasons, fetchCompetitions, fetchTeams, fetchTeamsBySeason, clearTeams, selectCompetition }
})
