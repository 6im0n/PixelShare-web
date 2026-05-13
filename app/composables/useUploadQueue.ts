export type UploadStatus = 'pending' | 'uploading' | 'done' | 'error' | 'canceled'

export interface UploadItem {
  id: string
  file: File
  name: string
  size: number
  status: UploadStatus
  bytesSent: number
  error: string | null
  photoId: string | null
}

export interface UploadQueueOptions {
  libraryId: string
  concurrency?: number
  maxFileSize?: number
  onAuthError?: () => void
  onComplete?: (photoIds: string[]) => void
}

const DEFAULT_CONCURRENCY = 4
const DEFAULT_MAX_FILE_SIZE = 50 * 1024 * 1024
const SPEED_WINDOW_MS = 3000
const SAMPLE_INTERVAL_MS = 250

export function useUploadQueue(opts: UploadQueueOptions) {
  const config = useRuntimeConfig()
  const { token } = useAuth()
  const base = config.public.apiBase

  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY
  const maxFileSize = opts.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
  const maxFileSizeMb = Math.floor(maxFileSize / 1024 / 1024)

  const items = ref<UploadItem[]>([])
  const active = ref(0)
  const xhrs = new Map<string, XMLHttpRequest>()
  const samples = ref<Array<{ at: number; bytes: number }>>([])
  let sampleTimer: ReturnType<typeof setInterval> | null = null
  let completionEmitted = false

  const totalBytes = computed(() =>
    items.value
      .filter(i => i.status !== 'canceled')
      .reduce((s, i) => s + i.size, 0),
  )
  const sentBytes = computed(() =>
    items.value
      .filter(i => i.status !== 'canceled')
      .reduce((s, i) => s + i.bytesSent, 0),
  )
  const aggregatePercent = computed(() =>
    totalBytes.value === 0 ? 0 : Math.min(100, (sentBytes.value / totalBytes.value) * 100),
  )
  const isActive = computed(() =>
    items.value.some(i => i.status === 'pending' || i.status === 'uploading'),
  )
  const doneCount = computed(() => items.value.filter(i => i.status === 'done').length)
  const errorCount = computed(() => items.value.filter(i => i.status === 'error').length)
  const pendingCount = computed(() => items.value.filter(i => i.status === 'pending').length)
  const uploadingCount = computed(() => items.value.filter(i => i.status === 'uploading').length)

  const bytesPerSecond = computed(() => {
    const s = samples.value
    if (s.length < 2) return 0
    const first = s[0]!
    const last = s[s.length - 1]!
    const dt = (last.at - first.at) / 1000
    if (dt <= 0) return 0
    return Math.max(0, (last.bytes - first.bytes) / dt)
  })

  const etaSeconds = computed(() => {
    const bps = bytesPerSecond.value
    if (!isActive.value) return null
    if (bps <= 0) return null
    const remaining = totalBytes.value - sentBytes.value
    if (remaining <= 0) return 0
    return remaining / bps
  })

  function nextId() {
    return `up_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  }

  function addFiles(files: File[] | FileList) {
    const arr = Array.isArray(files) ? files : Array.from(files)
    if (!arr.length) return
    completionEmitted = false
    for (const f of arr) {
      items.value.push({
        id: nextId(),
        file: f,
        name: f.name,
        size: f.size,
        status: 'pending',
        bytesSent: 0,
        error: null,
        photoId: null,
      })
    }
    pump()
  }

  function authHeader(): string | null {
    const t = token.value
    if (!t) return null
    return typeof t === 'string' ? t : String(t)
  }

  function uploadOne(item: UploadItem): Promise<void> {
    return new Promise((resolve) => {
      if (item.size > maxFileSize) {
        item.status = 'error'
        item.error = `file too large (>${maxFileSizeMb} MiB)`
        resolve()
        return
      }
      const xhr = new XMLHttpRequest()
      xhrs.set(item.id, xhr)
      const fd = new FormData()
      fd.append('file', item.file, item.file.name)
      xhr.open('POST', `${base}/api/libraries/${opts.libraryId}/photos`)
      const t = authHeader()
      if (t) xhr.setRequestHeader('Authorization', t)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) item.bytesSent = e.loaded
      }
      xhr.onload = () => {
        xhrs.delete(item.id)
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const body = JSON.parse(xhr.responseText) as { id?: string }
            item.photoId = body.id ?? null
          } catch { /* tolerate empty/non-JSON */ }
          item.bytesSent = item.size
          item.status = 'done'
        } else if (xhr.status === 401) {
          item.status = 'error'
          item.error = 'unauthorized'
          opts.onAuthError?.()
        } else if (xhr.status === 413) {
          item.status = 'error'
          item.error = `file too large (>${maxFileSizeMb} MiB)`
        } else {
          let msg = `upload failed (${xhr.status})`
          try {
            const parsed = JSON.parse(xhr.responseText) as { message?: string }
            if (parsed?.message) msg = parsed.message
          } catch { /* keep default */ }
          item.status = 'error'
          item.error = msg
        }
        resolve()
      }
      xhr.onerror = () => {
        xhrs.delete(item.id)
        if (item.status !== 'canceled') {
          item.status = 'error'
          item.error = 'network error'
        }
        resolve()
      }
      xhr.onabort = () => {
        xhrs.delete(item.id)
        item.status = 'canceled'
        resolve()
      }

      item.status = 'uploading'
      item.bytesSent = 0
      xhr.send(fd)
    })
  }

  function pump() {
    if (isActive.value) startSampler()

    while (active.value < concurrency) {
      const next = items.value.find(i => i.status === 'pending')
      if (!next) break
      active.value++
      uploadOne(next).finally(() => {
        active.value--
        pump()
      })
    }

    if (active.value === 0 && !items.value.some(i => i.status === 'pending')) {
      stopSampler()
      if (!completionEmitted && items.value.length > 0) {
        completionEmitted = true
        const ids = items.value
          .filter(i => i.status === 'done' && i.photoId)
          .map(i => i.photoId!)
        opts.onComplete?.(ids)
      }
    }
  }

  function startSampler() {
    if (sampleTimer) return
    samples.value = [{ at: Date.now(), bytes: sentBytes.value }]
    sampleTimer = setInterval(() => {
      const now = Date.now()
      samples.value.push({ at: now, bytes: sentBytes.value })
      const cutoff = now - SPEED_WINDOW_MS
      while (samples.value.length > 2 && samples.value[0]!.at < cutoff) {
        samples.value.shift()
      }
    }, SAMPLE_INTERVAL_MS)
  }

  function stopSampler() {
    if (sampleTimer) {
      clearInterval(sampleTimer)
      sampleTimer = null
    }
  }

  function retry(id: string) {
    const it = items.value.find(i => i.id === id)
    if (!it) return
    if (it.status !== 'error' && it.status !== 'canceled') return
    completionEmitted = false
    it.status = 'pending'
    it.error = null
    it.bytesSent = 0
    pump()
  }

  function retryAll() {
    let any = false
    for (const it of items.value) {
      if (it.status === 'error' || it.status === 'canceled') {
        it.status = 'pending'
        it.error = null
        it.bytesSent = 0
        any = true
      }
    }
    if (any) {
      completionEmitted = false
      pump()
    }
  }

  function cancelAll() {
    for (const it of items.value) {
      if (it.status === 'pending') it.status = 'canceled'
    }
    for (const xhr of xhrs.values()) xhr.abort()
    xhrs.clear()
    stopSampler()
  }

  function clearFinished() {
    if (isActive.value) return
    items.value = items.value.filter(
      i => i.status !== 'done' && i.status !== 'canceled',
    )
  }

  function reset() {
    cancelAll()
    items.value = []
    samples.value = []
    completionEmitted = false
  }

  function removeItem(id: string) {
    const it = items.value.find(i => i.id === id)
    if (!it) return
    if (it.status === 'uploading') return
    items.value = items.value.filter(i => i.id !== id)
  }

  if (import.meta.client) {
    onScopeDispose(() => {
      for (const xhr of xhrs.values()) xhr.abort()
      xhrs.clear()
      stopSampler()
    })
  }

  return {
    items,
    aggregatePercent,
    totalBytes,
    sentBytes,
    bytesPerSecond,
    etaSeconds,
    isActive,
    doneCount,
    errorCount,
    pendingCount,
    uploadingCount,
    concurrency,
    maxFileSize,
    addFiles,
    cancelAll,
    retry,
    retryAll,
    reset,
    removeItem,
    clearFinished,
  }
}
