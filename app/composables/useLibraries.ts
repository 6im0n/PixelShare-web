export interface ApiLibrary {
  id: string
  name: string
  photographerId: string
  photographerName?: string
  shootDate: string | null
  createdAt: string
  updatedAt: string
}

export function useLibraries() {
  const api = useApi()

  async function list(): Promise<ApiLibrary[]> {
    return api.get<ApiLibrary[]>('/libraries')
  }

  async function get(id: string): Promise<ApiLibrary> {
    return api.get<ApiLibrary>(`/libraries/${id}`)
  }

  async function create(name: string, shootDate?: string): Promise<ApiLibrary> {
    return api.post<ApiLibrary>('/libraries', { name, shootDate })
  }

  async function update(id: string, patch: Partial<Pick<ApiLibrary, 'name' | 'shootDate'>>) {
    return api.patch<ApiLibrary>(`/libraries/${id}`, patch)
  }

  async function remove(id: string) {
    return api.delete<{ deleted: boolean }>(`/libraries/${id}`)
  }

  async function listClients(id: string) {
    return api.get<Array<{ id: string; email: string; name: string; grantedAt: string }>>(
      `/libraries/${id}/clients`,
    )
  }

  async function grantClient(id: string, clientId: string) {
    return api.post<{ granted: boolean }>(`/libraries/${id}/clients`, { clientId })
  }

  async function revokeClient(id: string, clientId: string) {
    return api.delete<{ revoked: boolean; clearedStars?: number }>(`/libraries/${id}/clients/${clientId}`)
  }

  return { list, get, create, update, remove, listClients, grantClient, revokeClient }
}
