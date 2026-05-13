export type InvitationStatus = 'pending' | 'consumed' | 'revoked' | 'expired'

export interface Invitation {
  id: string
  email: string
  name: string
  code: string
  invitedByUserId: string
  invitedByName?: string
  createdAt: string
  expiresAt: string
  consumedAt: string | null
  consumedByUserId: string | null
  revokedAt: string | null
  status: InvitationStatus
}

export interface InvitationLookup {
  email: string
  name: string
}

export interface CreateInvitationInput {
  email: string
  name: string
  libraryIds?: string[]
}

export function useInvitations() {
  const api = useApi()

  async function create(input: CreateInvitationInput): Promise<Invitation> {
    const email = input.email.trim().toLowerCase()
    const name = input.name.trim()
    if (!email) throw new Error('Email is required.')
    if (name.length < 2) throw new Error('Name must be at least 2 characters.')
    return api.post<Invitation>('/invitations', {
      email,
      name,
      libraryIds: input.libraryIds,
    })
  }

  async function list(): Promise<Invitation[]> {
    return api.get<Invitation[]>('/invitations')
  }

  async function resend(id: string): Promise<void> {
    await api.post(`/invitations/${id}/resend`)
  }

  async function revoke(id: string): Promise<void> {
    await api.delete(`/invitations/${id}`)
  }

  async function lookup(code: string): Promise<InvitationLookup> {
    return api.get<InvitationLookup>(`/invitations/lookup/${encodeURIComponent(code.toUpperCase())}`)
  }

  async function addLibrary(invitationId: string, libraryId: string): Promise<void> {
    await api.post(`/invitations/${invitationId}/libraries`, { libraryId })
  }

  return { create, list, resend, revoke, lookup, addLibrary }
}
