/**
 * useInvitations
 * Generates single-use invitation links for new models.
 *
 * Single-use semantics are enforced server-side; the frontend just creates
 * the link and surfaces it. The returned URL points at the frontend's
 * `/register?token=...` route since registration happens here.
 */

export interface GenerateInvitationInput {
  name: string
  libraryIds?: string[]
}

export interface GeneratedInvitation {
  token: string
  url:   string
}

function randomToken(length = 24): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijkmnopqrstuvwxyz'
  let out = ''
  for (let i = 0; i < length; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

export function useInvitations() {
  const config  = useRuntimeConfig()
  const apiBase = config.public.apiBase

  async function generateInvitationLink({ name, libraryIds = [] }: GenerateInvitationInput): Promise<GeneratedInvitation> {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      throw new Error('Please enter a name (min 2 characters).')
    }

    // TODO: POST `${apiBase}/invitations` with { name: trimmed, libraryIds }
    void apiBase
    void libraryIds
    await new Promise(r => setTimeout(r, 350))

    const token = randomToken()
    const origin = (typeof window !== 'undefined' && window.location?.origin)
      ? window.location.origin
      : ''
    const params = new URLSearchParams({ token, name: trimmed })
    const url = `${origin}/register?${params.toString()}`

    return { token, url }
  }

  return { generateInvitationLink }
}
