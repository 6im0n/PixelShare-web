export interface ApiPhoto {
  id: string
  libraryId: string
  name: string
  originalPath: string
  thumbnailPath: string
  width: number | null
  height: number | null
  byteSize: number | null
  uploadedAt: string
}

export interface ApiPhotoStars {
  photoId: string
  myStars: number
  photographerStars: number
  ratings: Array<{
    photoId: string
    userId: string
    value: number
    updatedAt: string
    userName: string
    userRole: 'admin' | 'photographer' | 'client'
  }>
}

export interface LibraryPhoto {
  id: string
  filename: string
  thumbnailUrl: string
  originalUrl: string
  fileSize: string
  fileType: string
  photographerStars: number
  myStars: number
  isNew: boolean
  uploadedAt: number
}

export interface RatingEntry {
  by: 'photographer' | 'model'
  stars: number
  previousStars: number
  at: string
}

function humanSize(bytes: number | null): string {
  if (!bytes) return '—'
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

function fileTypeFromName(name: string): string {
  const ext = name.split('.').pop()?.toUpperCase() ?? 'IMG'
  return ext.slice(0, 4)
}

export function useLibraryPhotos(libraryId: string) {
  const api = useApi()
  const photos = ref<LibraryPhoto[]>([])
  const rawPhotos = ref<ApiPhoto[]>([])
  const historyCache = ref<Record<string, RatingEntry[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPhotos() {
    loading.value = true
    error.value = null
    try {
      const [list, _libStars] = await Promise.all([
        api.get<ApiPhoto[]>(`/libraries/${libraryId}/photos`),
        api
          .get<Array<{ photoId: string; userId: string; value: number; userRole: string }>>(
            `/libraries/${libraryId}/stars`,
          )
          .catch(() => [] as Array<{ photoId: string; userId: string; value: number; userRole: string }>),
      ])
      rawPhotos.value = list

      const { data: authData } = useAuth()
      const uid = authData.value?.id
      const starsByPhoto = new Map<string, { photographer: number; mine: number }>()
      for (const r of _libStars) {
        const cur = starsByPhoto.get(r.photoId) ?? { photographer: 0, mine: 0 }
        if (r.userRole === 'photographer' || r.userRole === 'admin') cur.photographer = r.value
        if (r.userId === uid) cur.mine = r.value
        starsByPhoto.set(r.photoId, cur)
      }

      photos.value = list.map((p) => {
        const s = starsByPhoto.get(p.id) ?? { photographer: 0, mine: 0 }
        return {
          id: p.id,
          filename: p.name,
          thumbnailUrl: api.authedUrl(`/photos/${p.id}/thumbnail`),
          originalUrl: api.authedUrl(`/photos/${p.id}/original`),
          fileSize: humanSize(p.byteSize),
          fileType: fileTypeFromName(p.name),
          photographerStars: s.photographer,
          myStars: s.mine,
          isNew: false,
          uploadedAt: new Date(p.uploadedAt).getTime(),
        }
      })
    } catch (e: any) {
      error.value = e?.data?.message ?? e?.message ?? 'Failed to load photos'
    } finally {
      loading.value = false
    }
  }

  const starredPhotos = computed(() => photos.value.filter((p) => p.myStars > 0))
  const pendingCount = computed(() => photos.value.filter((p) => p.myStars === 0).length)
  const totalCount = computed(() => photos.value.length)
  const newCount = computed(() => photos.value.filter((p) => p.isNew).length)

  async function setStars(photoId: string, stars: number) {
    const idx = photos.value.findIndex((p) => p.id === photoId)
    if (idx === -1) return
    const current = photos.value[idx]!.myStars
    const next = current === stars ? 0 : stars
    const prev = current
    photos.value[idx] = { ...photos.value[idx]!, myStars: next }
    try {
      await api.put<{ photoId: string; value: number }>(`/photos/${photoId}/stars`, {
        value: next,
      })
      const h = historyCache.value[photoId] ?? []
      historyCache.value[photoId] = [
        ...h,
        {
          by: useRole().role.value === 'photographer' ? 'photographer' : 'model',
          stars: next,
          previousStars: prev,
          at: new Date().toISOString(),
        },
      ]
    } catch {
      photos.value[idx] = { ...photos.value[idx]!, myStars: prev }
    }
  }

  async function loadPhotoHistory(photoId: string) {
    const rows = await api.get<Array<{
      id: string
      photoId: string
      userId: string
      value: number
      changedAt: string
      userName: string
      userRole: 'admin' | 'photographer' | 'client'
    }>>(`/photos/${photoId}/history`)
    const byUser = new Map<string, number>()
    const entries: RatingEntry[] = []
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i]!
      const prev = byUser.get(r.userId) ?? 0
      entries.push({
        by: r.userRole === 'photographer' || r.userRole === 'admin' ? 'photographer' : 'model',
        stars: r.value,
        previousStars: prev,
        at: r.changedAt,
      })
      byUser.set(r.userId, r.value)
    }
    historyCache.value[photoId] = entries
    return entries
  }

  async function clearMyStars() {
    await api.delete<{ cleared: number }>(`/libraries/${libraryId}/stars/me`)
    await fetchPhotos()
  }

  function getPhotoHistory(photoId: string): RatingEntry[] {
    if (!historyCache.value[photoId]) {
      void loadPhotoHistory(photoId)
    }
    return historyCache.value[photoId] ?? []
  }

  async function submitSelection() {
    console.log(
      '[PixelShare] Submitting selection:',
      starredPhotos.value.map((p) => ({ id: p.id, stars: p.myStars })),
    )
  }

  async function uploadPhoto(file: File) {
    const fd = new FormData()
    fd.append('file', file, file.name)
    const res = await api.post<ApiPhoto>(`/libraries/${libraryId}/photos`, fd)
    await fetchPhotos()
    return res
  }

  async function deletePhoto(photoId: string) {
    await api.delete<{ deleted: boolean }>(`/photos/${photoId}`)
    photos.value = photos.value.filter((p) => p.id !== photoId)
  }

  if (import.meta.client) {
    void fetchPhotos()
  }

  return {
    photos,
    rawPhotos,
    starredPhotos,
    pendingCount,
    totalCount,
    newCount,
    loading,
    error,
    fetchPhotos,
    setStars,
    getPhotoHistory,
    loadPhotoHistory,
    submitSelection,
    uploadPhoto,
    deletePhoto,
    clearMyStars,
  }
}
