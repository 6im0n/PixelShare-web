<script setup lang="ts">
import AddMemberControls, { type PickedMember, type InvitedMember } from '~/components/collection/AddMemberControls.vue'

definePageMeta({ layout: 'library' })

const route = useRoute()
const libraryId = route.params.id as string

const { photos, starredPhotos, totalCount, pendingCount, setStars, getPhotoHistory, submitSelection, uploadPhoto, clearMyStars, deletePhoto, fetchPhotos } = useLibraryPhotos(libraryId)
const { markViewed, isViewed } = useViewedPhotos()
const { filterStars, filterNewOnly, filterUnstarred, filterName, sortBy, sortDir, hasActiveFilters, clearAll: clearFilters } = useLibraryFilters()

// ── Filtered photos ───────────────────────────────────────────────────────
const filteredPhotos = computed(() => {
  const q = filterName.value.trim().toLowerCase()
  const filtered = photos.value.filter(photo => {
    if (filterNewOnly.value   && !(photo.isNew && !isViewed(photo.id))) return false
    if (filterUnstarred.value && photo.myStars > 0)                      return false
    if (filterStars.value !== null && photo.myStars !== filterStars.value) return false
    if (q && !photo.filename.toLowerCase().includes(q))                  return false
    return true
  })

  const dir = sortDir.value === 'asc' ? 1 : -1
  const key = sortBy.value
  return [...filtered].sort((a, b) => {
    if (key === 'filename') {
      return a.filename.localeCompare(b.filename) * dir
    }
    const av = a[key] ?? 0
    const bv = b[key] ?? 0
    return (av - bv) * dir
  })
})

const clearingStars = ref(false)
async function handleClearMyStars() {
  if (!confirm('Clear all your stars in this library? History kept.')) return
  clearingStars.value = true
  try {
    await clearMyStars()
  } finally {
    clearingStars.value = false
  }
}

// ── Lightbox ──────────────────────────────────────────────────────────────
const lightboxPhotoId = ref<string | null>(null)
const lightboxPhoto   = computed(() => photos.value.find(p => p.id === lightboxPhotoId.value) ?? null)
const lightboxHistory = computed(() => lightboxPhotoId.value ? getPhotoHistory(lightboxPhotoId.value) : [])

function openLightbox(photoId: string) {
  lightboxPhotoId.value = photoId
  markViewed(photoId) // seeing in fullscreen counts as viewed
}
function closeLightbox() { lightboxPhotoId.value = null }

function navigateLightbox(dir: 1 | -1) {
  const list = filteredPhotos.value
  if (!list.length || !lightboxPhotoId.value) return
  const idx = list.findIndex(p => p.id === lightboxPhotoId.value)
  if (idx === -1) return
  const nextIdx = (idx + dir + list.length) % list.length
  const nextId = list[nextIdx]!.id
  lightboxPhotoId.value = nextId
  markViewed(nextId)
}

function handleSetStars(id: string, stars: number) {
  setStars(id, stars)
  markViewed(id) // starring also counts as viewed
}

const deleteError = ref<string | null>(null)
async function handleDeletePhoto(id: string) {
  try {
    await deletePhoto(id)
    if (lightboxPhotoId.value === id) lightboxPhotoId.value = null
  } catch (err: any) {
    deleteError.value = err?.data?.message ?? err?.message ?? 'Delete failed'
  }
}

// ── Upload ────────────────────────────────────────────────────────────────
const { trigger: uploadTrigger } = useUploadTrigger()
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

// Duplicate detection
const duplicateQueue = ref<File[]>([])
const pendingFiles   = ref<File[]>([])
const showDuplicateModal = ref(false)

watch(uploadTrigger, () => {
  fileInputRef.value?.click()
})

async function handleFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (fileInputRef.value) fileInputRef.value.value = ''
  if (!files.length) return

  const existingNames = new Set(photos.value.map(p => p.filename))
  const dupes = files.filter(f => existingNames.has(f.name))
  const fresh = files.filter(f => !existingNames.has(f.name))

  if (dupes.length > 0) {
    duplicateQueue.value = dupes
    pendingFiles.value   = fresh
    showDuplicateModal.value = true
    return
  }
  await doUpload(files)
}

async function confirmDuplicates(replaceAll: boolean) {
  showDuplicateModal.value = false
  const toUpload = replaceAll
    ? [...pendingFiles.value, ...duplicateQueue.value]
    : pendingFiles.value
  duplicateQueue.value = []
  pendingFiles.value   = []
  if (toUpload.length) await doUpload(toUpload)
}

async function doUpload(files: File[]) {
  uploading.value = true
  uploadError.value = null
  try {
    for (const file of files) {
      await uploadPhoto(file)
    }
  } catch (err: any) {
    uploadError.value = err?.data?.message ?? err?.message ?? 'Upload failed.'
  } finally {
    uploading.value = false
  }
}

// ── Library meta ──────────────────────────────────────────────────────────
const { get: getLibrary, listClients, revokeClient } = useLibraries()

type DisplayedMember =
  | { kind: 'registered'; id: string; email: string; name: string }
  | { kind: 'pending'; invitationId: string; email: string; name: string }

const members = ref<DisplayedMember[]>([])
const { revoke: revokeInvitation } = useInvitations()

async function loadMembers() {
  try {
    const res = await listClients(libraryId)
    members.value = [
      ...res.members.map(m => ({ kind: 'registered' as const, id: m.id, email: m.email, name: m.name })),
      ...res.pending.map(p => ({ kind: 'pending' as const, invitationId: p.invitationId, email: p.email, name: p.name })),
    ]
  } catch {
    members.value = []
  }
}

const memberUserIds = computed(() =>
  members.value.filter((m): m is Extract<DisplayedMember, { kind: 'registered' }> => m.kind === 'registered').map(m => m.id),
)
const memberInvitationIds = computed(() =>
  members.value.filter((m): m is Extract<DisplayedMember, { kind: 'pending' }> => m.kind === 'pending').map(m => m.invitationId),
)

async function handleRevokePending(invitationId: string, name: string) {
  if (!confirm(`Revoke invitation for ${name}? They won't be able to register with that code.`)) return
  try {
    await revokeInvitation(invitationId)
    members.value = members.value.filter(m => m.kind === 'registered' || m.invitationId !== invitationId)
    addMemberFeedback.value = { kind: 'success', text: `Invitation for ${name} revoked.` }
  } catch (err: unknown) {
    addMemberFeedback.value = { kind: 'error', text: err instanceof Error ? err.message : 'Could not revoke.' }
  }
}

async function handleRemoveMember(id: string, name: string) {
  if (!confirm(`Remove ${name} from this collection? Their stars on these photos will be cleared.`)) return
  try {
    const res = await revokeClient(libraryId, id)
    members.value = members.value.filter(m => m.kind === 'pending' || m.id !== id)
    await fetchPhotos()
    const cleared = res?.clearedStars ?? 0
    addMemberFeedback.value = {
      kind: 'success',
      text: cleared > 0
        ? `${name} removed. ${cleared} star${cleared !== 1 ? 's' : ''} cleared.`
        : `${name} removed.`,
    }
  } catch (err: unknown) {
    addMemberFeedback.value = { kind: 'error', text: err instanceof Error ? err.message : 'Could not remove member.' }
  }
}
const library = ref<{ name: string; description: string }>({
  name: 'Loading…',
  description: '',
})
if (import.meta.client) {
  loadMembers()
  getLibrary(libraryId)
    .then((lib) => {
      library.value = {
        name: lib.name,
        description: lib.shootDate
          ? `Shooting session — ${new Date(lib.shootDate).toLocaleDateString()}`
          : 'Rate your favourite shots.',
      }
    })
    .catch(() => {
      library.value = { name: 'Library', description: 'Not accessible or not found.' }
    })
}

// ── Add-a-model modal (photographer only) ─────────────────────────────────
const { isPhotographer } = useRole()
const { addMember } = useCollections()
const showAddMember = ref(false)
const addMemberFeedback = ref<{ kind: 'success' | 'error', text: string } | null>(null)

async function handlePickMember(payload: PickedMember) {
  try {
    await addMember(libraryId, {
      userId: payload.userId,
      invitationId: payload.invitationId,
      name: payload.name,
      readyToShare: false,
    })
    const verb = payload.invitationId ? 'invitation re-linked' : 'added to the collection'
    addMemberFeedback.value = { kind: 'success', text: `${payload.name} ${verb}.` }
    showAddMember.value = false
    await loadMembers()
  } catch (err: any) {
    addMemberFeedback.value = { kind: 'error', text: err?.data?.message ?? (err instanceof Error ? err.message : 'Could not add member.') }
  }
}

async function handleInviteMember(payload: InvitedMember) {
  // AddMemberControls already created the invitation server-side because libraryId is passed.
  addMemberFeedback.value = { kind: 'success', text: `Invitation email sent to ${payload.email}.` }
  showAddMember.value = false
  await loadMembers()
}
</script>

<template>
  <!-- Hidden file input for upload -->
  <input
    ref="fileInputRef"
    type="file"
    accept="image/*"
    multiple
    style="display:none"
    @change="handleFiles"
  />

  <!-- Duplicate confirmation modal -->
  <Transition name="lightbox">
    <div
      v-if="showDuplicateModal"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <div class="modal-card">
        <header class="modal-head">
          <div>
            <h2 class="modal-title">Duplicate photos</h2>
            <p class="modal-sub">
              {{ duplicateQueue.length }} file{{ duplicateQueue.length !== 1 ? 's' : '' }} already exist in this library.
            </p>
          </div>
        </header>
        <ul class="dupe-list">
          <li v-for="f in duplicateQueue" :key="f.name" class="dupe-item">
            <span class="material-symbols-outlined dupe-icon" aria-hidden="true">image</span>
            <span class="dupe-name">{{ f.name }}</span>
          </li>
        </ul>
        <div class="confirm-actions">
          <UiButton variant="ghost" size="md" @click="confirmDuplicates(false)">
            Skip duplicates
          </UiButton>
          <UiButton variant="primary" size="md" icon="upload" @click="confirmDuplicates(true)">
            Replace all
          </UiButton>
        </div>
      </div>
    </div>
  </Transition>

  <!-- Upload feedback -->
  <Transition name="lightbox">
    <div v-if="uploadError || uploading" class="member-toast">
      <UiAlert :variant="uploading ? 'info' : 'error'">
        {{ uploading ? 'Uploading photos…' : uploadError }}
      </UiAlert>
      <button v-if="!uploading" class="toast-close" aria-label="Dismiss" @click="uploadError = null">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
      </button>
    </div>
  </Transition>

  <!-- Page header -->
  <header class="page-header">
    <div>
      <h1 class="page-title">{{ library.name }}</h1>
      <p class="page-desc">{{ library.description }}</p>
    </div>

    <div class="stats-wrap">
      <UiButton
        v-if="starredPhotos.length > 0"
        variant="ghost"
        size="sm"
        icon="clear_all"
        class="add-model-btn"
        :loading="clearingStars"
        @click="handleClearMyStars"
      >
        Clear my stars
      </UiButton>

      <UiButton
        v-if="isPhotographer"
        variant="secondary"
        size="sm"
        icon="person_add"
        class="add-model-btn"
        @click="showAddMember = true"
      >
        Add a model
      </UiButton>

      <div v-if="isPhotographer" class="members-field" aria-label="Models in this collection">
        <span class="members-label">
          <span class="material-symbols-outlined" style="font-size:14px">groups</span>
          Models
        </span>
        <ul v-if="members.length > 0" class="members-list">
          <li
            v-for="m in members"
            :key="m.kind === 'registered' ? m.id : m.invitationId"
            class="member-chip"
            :class="m.kind === 'pending' ? 'member-chip--pending' : 'member-chip--registered'"
            :title="m.kind === 'pending' ? `${m.email} — invitation pending` : m.email"
          >
            <span
              v-if="m.kind === 'pending'"
              class="material-symbols-outlined member-dot"
              aria-hidden="true"
              style="font-size:12px"
            >hourglass_empty</span>
            <span class="member-name">{{ m.name || m.email }}</span>
            <button
              v-if="m.kind === 'registered'"
              type="button"
              class="member-remove"
              :aria-label="`Remove ${m.name || m.email}`"
              @click="handleRemoveMember(m.id, m.name || m.email)"
            >
              <span class="material-symbols-outlined" style="font-size:13px">close</span>
            </button>
            <button
              v-else
              type="button"
              class="member-remove"
              :aria-label="`Revoke invitation for ${m.name || m.email}`"
              @click="handleRevokePending(m.invitationId, m.name || m.email)"
            >
              <span class="material-symbols-outlined" style="font-size:13px">close</span>
            </button>
          </li>
        </ul>
        <span v-else class="members-empty">None yet</span>
      </div>

      <LibraryStats
        :total="totalCount"
        :starred="starredPhotos.length"
        :pending="pendingCount"
      />
    </div>
  </header>

  <!-- Add-a-model toast -->
  <Transition name="lightbox">
    <div v-if="addMemberFeedback" class="member-toast">
      <UiAlert :variant="addMemberFeedback.kind">{{ addMemberFeedback.text }}</UiAlert>
      <button class="toast-close" aria-label="Dismiss" @click="addMemberFeedback = null">
        <span class="material-symbols-outlined" style="font-size:16px">close</span>
      </button>
    </div>
  </Transition>

  <!-- Add-a-model modal -->
  <Transition name="lightbox">
    <div
      v-if="showAddMember"
      class="modal-backdrop"
      role="dialog"
      aria-modal="true"
      @click.self="showAddMember = false"
    >
      <div class="modal-card">
        <header class="modal-head">
          <div>
            <h2 class="modal-title">Add a model</h2>
            <p class="modal-sub">Pick from your previous models or invite a new one.</p>
          </div>
          <UiButton
            variant="ghost"
            size="sm"
            icon="close"
            icon-only
            aria-label="Close"
            @click="showAddMember = false"
          />
        </header>

        <AddMemberControls
          compact
          :library-id="libraryId"
          :exclude-user-ids="memberUserIds"
          :exclude-invitation-ids="memberInvitationIds"
          @pick="handlePickMember"
          @invite="handleInviteMember"
          @skip="showAddMember = false"
        />
      </div>
    </div>
  </Transition>

  <!-- Filters -->
  <LibraryFilters
    :total-count="totalCount"
    :filtered-count="filteredPhotos.length"
  />

  <!-- Masonry grid / empty state -->
  <PhotoMasonryGrid
    v-if="filteredPhotos.length > 0"
    :photos="filteredPhotos"
    @set-stars="handleSetStars"
    @open="openLightbox"
    @delete="handleDeletePhoto"
  />
  <div v-else class="empty-state">
    <span class="material-symbols-outlined empty-icon">filter_list_off</span>
    <p class="empty-title">No photos match this filter</p>
    <button class="empty-clear" @click="clearFilters">Clear filters</button>
  </div>

  <!-- Floating selection bar -->
  <LibraryFloatingSelectionBar
    :starred-photos="starredPhotos"
    @submit="submitSelection"
  />

  <!-- Lightbox -->
  <Transition name="lightbox">
    <PhotoLightbox
      v-if="lightboxPhoto"
      :photo="lightboxPhoto"
      :history="lightboxHistory"
      @close="closeLightbox"
      @set-stars="handleSetStars"
      @next="navigateLightbox(1)"
      @prev="navigateLightbox(-1)"
    />
  </Transition>
</template>

<style scoped>
.page-header {
  @apply mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6;
}

.stats-wrap {
  @apply flex items-center justify-center sm:justify-end gap-3;
}

.page-title {
  @apply text-2xl sm:text-4xl font-extrabold font-headline tracking-tight mb-1.5 sm:mb-2;
  @apply text-on-surface dark:text-slate-100;
}

.page-desc {
  @apply text-sm sm:text-base font-body;
  @apply text-on-surface-variant dark:text-slate-400;
}

/* Empty state */
.empty-state {
  @apply flex flex-col items-center gap-3 py-24 text-center;
}

.empty-icon {
  @apply text-on-surface-variant/20 dark:text-white/15;
  font-size: 48px !important;
}

.empty-title {
  @apply text-sm font-semibold text-on-surface-variant dark:text-slate-500;
}

.empty-clear {
  @apply px-4 py-2 rounded-full text-sm font-semibold;
  @apply text-primary border border-primary/30;
  @apply hover:bg-primary/5 transition-colors;
}

/* Lightbox transition */
.lightbox-enter-active,
.lightbox-leave-active {
  transition: opacity 0.2s ease;
}
.lightbox-enter-from,
.lightbox-leave-to {
  opacity: 0;
}

/* Add-a-model action */
.add-model-btn { @apply flex-shrink-0; }

/* Members field next to add-model button */
.members-field {
  @apply flex items-center gap-2 flex-wrap;
  @apply px-3 py-1.5 rounded-xl;
  @apply bg-slate-100/70 dark:bg-slate-800/60;
  @apply border border-outline-variant/20 dark:border-white/5;
  max-width: 320px;
}

.members-label {
  @apply flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider;
  @apply text-on-surface-variant dark:text-slate-400;
}

.members-list {
  @apply flex items-center gap-1.5 flex-wrap;
}

.member-chip {
  @apply flex items-center gap-1 pl-2.5 pr-1 py-0.5 rounded-full;
  @apply text-xs font-medium;
}

.member-chip--registered {
  @apply bg-primary/10 dark:bg-primary/20 text-primary dark:text-sky-300;
}

.member-chip--pending {
  @apply bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300;
}

.member-name {
  @apply max-w-[120px] truncate;
}

.member-dot {
  @apply opacity-80;
}

.member-remove {
  @apply p-0.5 rounded-full transition-colors;
  @apply hover:bg-red-500/15 hover:text-red-500;
}

.member-chip--registered .member-remove {
  @apply text-primary/70 dark:text-sky-300/70;
}
.member-chip--pending .member-remove {
  @apply text-amber-700/70 dark:text-amber-300/70;
}

.members-empty {
  @apply text-xs italic text-on-surface-variant/60 dark:text-slate-500;
}

/* Toast */
.member-toast {
  @apply flex items-start gap-2 mb-4 max-w-xl;
}
.toast-close {
  @apply p-1 rounded-full text-on-surface-variant/70 hover:bg-black/5 dark:hover:bg-white/10;
  @apply transition-colors;
}

/* Add-a-model modal */
.modal-backdrop {
  @apply fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6;
  background: rgba(8, 13, 30, 0.45);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal-card {
  @apply w-full sm:max-w-lg flex flex-col gap-5 p-5 sm:p-6;
  @apply rounded-t-3xl sm:rounded-3xl;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow:
    0 32px 80px rgba(0, 40, 120, 0.18),
    0 8px 24px rgba(0, 40, 120, 0.10);
}
.dark .modal-card {
  background: rgba(8, 13, 30, 0.92);
  border-color: rgba(255, 255, 255, 0.08);
}

.modal-head {
  @apply flex items-start justify-between gap-3;
}

.modal-title {
  @apply text-lg sm:text-xl font-headline font-bold;
  @apply text-on-surface dark:text-slate-100;
}

.modal-sub {
  @apply text-xs sm:text-sm mt-0.5;
  @apply text-on-surface-variant/85 dark:text-slate-400;
}

.dupe-list {
  @apply flex flex-col gap-1.5 max-h-48 overflow-y-auto;
}

.dupe-item {
  @apply flex items-center gap-2.5 px-3 py-2 rounded-xl;
  @apply bg-amber-50/60 dark:bg-amber-900/15;
  @apply border border-amber-200/60 dark:border-amber-800/40;
}

.dupe-icon {
  @apply text-amber-600 dark:text-amber-400 flex-shrink-0;
  font-size: 16px !important;
}

.dupe-name {
  @apply text-xs font-mono truncate text-on-surface dark:text-slate-200;
}

.confirm-actions {
  @apply flex justify-end gap-2 pt-1;
}
</style>
