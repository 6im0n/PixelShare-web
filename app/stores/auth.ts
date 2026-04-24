import { defineStore } from 'pinia'

export type BackendRole = 'admin' | 'photographer' | 'client'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: BackendRole
}

export const useAuthStore = defineStore('auth', {
  actions: {
    startGoogleOAuth() {
      const config = useRuntimeConfig()
      window.location.href = `${config.public.apiBase}/api/oauth/google/start`
    },
  },
})
