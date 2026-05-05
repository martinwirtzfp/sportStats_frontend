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

  async function fetchCompetitions() {
    try {
      const { data } = await competitionsApi.getAll()
      competitions.value = data
      if (data.length > 0 && !selectedCompetitionId.value) {
        selectedCompetitionId.value = data[0].id
      }
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

  function selectCompetition(id: number) {
    selectedCompetitionId.value = id
    fetchTeams(id)
  }

  return { teams, competitions, selectedCompetitionId, loading, error, fetchCompetitions, fetchTeams, selectCompetition }
})
