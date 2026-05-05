import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserFavorite } from '@/types'
import { favoritesApi } from '@/services/api'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<UserFavorite[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      const { data } = await favoritesApi.getAll()
      favorites.value = data
    } finally {
      loading.value = false
    }
  }

  async function add(teamId: number) {
    const { data } = await favoritesApi.add(teamId)
    favorites.value.push(data)
  }

  async function remove(teamId: number) {
    await favoritesApi.remove(teamId)
    favorites.value = favorites.value.filter((f) => f.teamId !== teamId)
  }

  function isFavorite(teamId: number) {
    return favorites.value.some((f) => f.teamId === teamId)
  }

  function clear() {
    favorites.value = []
  }

  return { favorites, loading, fetch, add, remove, isFavorite, clear }
})
