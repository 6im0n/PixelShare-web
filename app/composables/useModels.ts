import type { User } from '~/types'

export interface ApiClient {
  id: string
  email: string
  name: string
  role: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export function useModels() {
  const api = useApi()

  async function listKnownModels(): Promise<User[]> {
    const rows = await api.get<ApiClient[]>('/account/clients')
    return rows.map((r) => ({
      id: r.id,
      email: r.email,
      name: r.name,
      role: r.role as User['role'],
      createdAt: r.createdAt,
    }))
  }

  return { listKnownModels }
}
