export interface NewCollectionMember {
  userId?: string
  invitationToken?: string
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

  async function createCollection(input: CreateCollectionInput): Promise<CreateCollectionResult> {
    const name = input.name.trim()
    if (name.length < 2) throw new Error('Collection name must be at least 2 characters.')
    if (name.length > 80) throw new Error('Collection name is too long (max 80 characters).')

    const lib = await create(name)

    // Grant access to members that have a real userId
    if (input.members?.length) {
      await Promise.allSettled(
        input.members
          .filter(m => m.userId)
          .map(m => grantClient(lib.id, m.userId!)),
      )
    }

    return { id: lib.id }
  }

  async function addMember(libraryId: string, member: NewCollectionMember): Promise<void> {
    if (!libraryId) throw new Error('Missing library id.')
    if (member.userId) {
      await grantClient(libraryId, member.userId)
    }
    // Invitation-token members are frontend-only for now (no backend invitations system)
  }

  return { createCollection, addMember }
}
