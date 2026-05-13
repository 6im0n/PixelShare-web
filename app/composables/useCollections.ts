export interface NewCollectionMember {
  userId?: string
  invitationId?: string
  email?: string
  name: string
  readyToShare: boolean
}

export interface CreateCollectionInput {
  name: string
  description?: string
  members?: NewCollectionMember[]
}

export interface FailedMember {
  name: string
  reason: string
}

export interface CreateCollectionResult {
  id: string
  failedMembers: FailedMember[]
}

export function useCollections() {
  const { create, grantClient } = useLibraries()
  const { create: createInvitation, addLibrary: addInvitationLibrary } = useInvitations()

  async function createCollection(input: CreateCollectionInput): Promise<CreateCollectionResult> {
    const name = input.name.trim()
    if (name.length < 2) throw new Error('Collection name must be at least 2 characters.')
    if (name.length > 80) throw new Error('Collection name is too long (max 80 characters).')

    const lib = await create(name)

    const failedMembers: FailedMember[] = []
    if (input.members?.length) {
      const queued = input.members
      const results = await Promise.allSettled(
        queued.map(m => {
          if (m.userId) return grantClient(lib.id, m.userId)
          if (m.invitationId) return addInvitationLibrary(m.invitationId, lib.id)
          if (m.email) return createInvitation({
            email: m.email,
            name: m.name,
            libraryIds: [lib.id],
          })
          return Promise.resolve()
        }),
      )
      results.forEach((r, i) => {
        const m = queued[i]
        if (r.status === 'rejected' && m) {
          const reason = r.reason instanceof Error ? r.reason.message : String(r.reason)
          failedMembers.push({ name: m.name, reason })
        }
      })
    }

    return { id: lib.id, failedMembers }
  }

  async function addMember(libraryId: string, member: NewCollectionMember): Promise<void> {
    if (!libraryId) throw new Error('Missing library id.')
    if (member.userId) {
      await grantClient(libraryId, member.userId)
      return
    }
    if (member.invitationId) {
      await addInvitationLibrary(member.invitationId, libraryId)
      return
    }
    if (member.email) {
      await createInvitation({
        email: member.email,
        name: member.name,
        libraryIds: [libraryId],
      })
    }
  }

  return { createCollection, addMember }
}
