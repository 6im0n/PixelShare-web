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
    startGoogleOAuth(invitationCode?: string) {
      const config = useRuntimeConfig()
      const base = `${config.public.apiBase}/api/oauth/google/start`
      window.location.href = invitationCode
        ? `${base}?invitation=${encodeURIComponent(invitationCode.toUpperCase())}`
        : base
    },
  },
})
