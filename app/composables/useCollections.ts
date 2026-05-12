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

export interface CreateCollectionResult {
  id: string
}

export function useCollections() {
  const { create, grantClient } = useLibraries()
  const { create: createInvitation, addLibrary: addInvitationLibrary } = useInvitations()

  async function createCollection(input: CreateCollectionInput): Promise<CreateCollectionResult> {
    const name = input.name.trim()
    if (name.length < 2) throw new Error('Collection name must be at least 2 characters.')
    if (name.length > 80) throw new Error('Collection name is too long (max 80 characters).')

    const lib = await create(name)

    if (input.members?.length) {
      await Promise.allSettled(
        input.members.map(m => {
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
    }

    return { id: lib.id }
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
