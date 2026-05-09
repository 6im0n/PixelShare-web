<script setup lang="ts">
import type { LibraryPhoto, RatingEntry } from '~/composables/useLibraryPhotos'

const props = defineProps<{
  photo: LibraryPhoto
  history: RatingEntry[]
}>()

const emit = defineEmits<{
  close: []
  setStars: [id: string, stars: number]
  next: []
  prev: []
}>()

// ── Local state ───────────────────────────────────────────────────────────
const greyBg      = ref(false)
const historyOpen = ref(false) // set on mount based on screen width
const isZoomed    = ref(false)

// ── Zoom ──────────────────────────────────────────────────────────────────
const originX = ref(50)
const originY = ref(50)
const imgRef  = ref<{ $el: HTMLElement } | null>(null)
function imgEl(): HTMLElement | null {
  return imgRef.value?.$el ?? null
}
const ZOOM_SCALE = 2.2

// ── Lifecycle ─────────────────────────────────────────────────────────────
onMounted(() => {
  document.body.style.overflow = 'hidden'
  document.addEventListener('keydown', onKey)
  // History panel: open by default on sm+ screens only
  historyOpen.value = window.innerWidth >= 640
})

onUnmounted(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKey)
})

// ── Keyboard ──────────────────────────────────────────────────────────────
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (isZoomed.value) isZoomed.value = false
    else emit('close')
  }
  if (e.key === 'h') historyOpen.value = !historyOpen.value
  if (e.key === 'z') isZoomed.value = !isZoomed.value
  if (isZoomed.value) return
  if (e.key === 'ArrowRight') emit('next')
  if (e.key === 'ArrowLeft') emit('prev')
}

// ── Zoom ──────────────────────────────────────────────────────────────────
function onImageClick(e: MouseEvent) {
  const el = imgEl()
  if (!el) return
  if (!isZoomed.value) {
    const rect = el.getBoundingClientRect()
    originX.value = ((e.clientX - rect.left) / rect.width) * 100
    originY.value = ((e.clientY - rect.top) / rect.height) * 100
  }
  isZoomed.value = !isZoomed.value
}

function onMouseMove(e: MouseEvent) {
  const el = imgEl()
  if (!isZoomed.value || !el) return
  const rect = el.getBoundingClientRect()
  originX.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width)  * 100))
  originY.value = Math.max(0, Math.min(100, ((e.clientY - rect.top)  / rect.height) * 100))
}

function handleContainerClick() {
  if (isZoomed.value) isZoomed.value = false
  else emit('close')
}

// ── Helpers ───────────────────────────────────────────────────────────────
function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

const sortedHistory = computed(() => [...props.history].reverse())
</script>

<template>
  <Teleport to="body">
    <div class="lightbox" role="dialog" aria-modal="true">

      <!-- ── Backdrop ────────────────────────────────────── -->
      <div class="backdrop-blur" />
      <div
        class="backdrop-color"
        :class="greyBg ? 'backdrop-color--grey' : ''"
        @click="handleContainerClick"
      />

      <!-- ── Top bar ─────────────────────────────────────── -->
      <header class="topbar">
        <div class="topbar-left">
          <!-- History toggle -->
          <button
            class="topbar-icon-btn"
            :class="historyOpen ? 'topbar-icon-btn--active' : ''"
            :aria-label="historyOpen ? 'Hide history panel (H)' : 'Show history panel (H)'"
            @click.stop="historyOpen = !historyOpen"
          >
            <span class="material-symbols-outlined" style="font-size:18px">history</span>
          </button>

          <div class="topbar-divider" />
          <span class="topbar-filename">{{ photo.filename }}</span>
          <span class="topbar-meta">{{ photo.fileSize }} · {{ photo.fileType }}</span>

          <!-- Zoom badge -->
          <span v-if="isZoomed" class="zoom-badge">
            <span class="material-symbols-outlined" style="font-size:11px">zoom_in</span>
            2×
          </span>
        </div>

        <div class="topbar-right">
          <!-- Grey BG toggle -->
          <button
            class="grey-bg-btn"
            :class="greyBg ? 'grey-bg-btn--active' : ''"
            @click.stop="greyBg = !greyBg"
          >
            <span class="material-symbols-outlined" style="font-size:15px">crop_square</span>
            <span class="grey-bg-label">Grey BG</span>
          </button>

          <!-- Close -->
          <button class="topbar-icon-btn" aria-label="Close (Esc)" @click.stop="emit('close')">
            <span class="material-symbols-outlined" style="font-size:20px">close</span>
          </button>
        </div>
      </header>

      <!-- ── Body ──────────────────────────────────────────── -->
      <div class="lb-body">

        <!-- History panel -->
        <Transition name="slide-panel">
          <aside v-if="historyOpen" class="history-panel">
            <div class="history-header">
              <div class="history-title">
                <span class="material-symbols-outlined text-white/50" style="font-size:14px">history</span>
                <span class="history-title-text">Rating History</span>
              </div>
              <button class="history-close-btn" aria-label="Hide history (H)" @click.stop="historyOpen = false">
                <span class="material-symbols-outlined" style="font-size:15px">chevron_left</span>
              </button>
            </div>

            <div class="history-scroll">
              <div v-if="sortedHistory.length === 0" class="history-empty">
                <span class="material-symbols-outlined text-white/20" style="font-size:32px">star_border</span>
                <p class="history-empty-text">No ratings yet</p>
              </div>

              <div v-else class="history-list">
                <div v-for="(entry, i) in sortedHistory" :key="i" class="history-entry">
                  <div
                    v-if="i < sortedHistory.length - 1"
                    class="history-line"
                  />
                  <div
                    class="history-dot"
                    :class="entry.by === 'photographer' ? 'history-dot--photographer' : 'history-dot--model'"
                  />
                  <div class="history-entry-top">
                    <span
                      class="history-by"
                      :class="entry.by === 'photographer' ? 'history-by--photographer' : 'history-by--model'"
                    >
                      {{ entry.by === 'photographer' ? 'Photographer' : 'You' }}
                    </span>
                  </div>
                  <div class="history-time">{{ fmt(entry.at) }}</div>
                  <div class="history-stars">
                    <template v-if="entry.previousStars > 0 && entry.previousStars !== entry.stars">
                      <div class="history-prev-stars">
                        <span
                          v-for="s in 5" :key="s"
                          class="material-symbols-outlined"
                          :class="s <= entry.previousStars ? 'filled-icon text-white' : 'text-white/20'"
                          style="font-size:10px"
                        >star</span>
                      </div>
                      <span class="material-symbols-outlined text-white/35" style="font-size:12px">arrow_forward</span>
                    </template>
                    <div class="history-cur-stars">
                      <span
                        v-for="s in 5" :key="s"
                        class="material-symbols-outlined"
                        :class="s <= entry.stars ? 'filled-icon text-amber-400' : 'text-white/20'"
                        style="font-size:10px"
                      >star</span>
                    </div>
                    <span v-if="entry.previousStars === 0" class="history-first-label">First</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </Transition>

        <!-- ── Photo area ─────────────────────────────────── -->
        <div
          class="photo-area"
          :class="isZoomed ? 'photo-area--zoomed' : ''"
          @mousemove="onMouseMove"
          @click.self="handleContainerClick"
        >
          <UiAuthedImg
            ref="imgRef"
            :path="photo.originalUrl"
            :alt="photo.filename"
            class="photo-img"
            :class="isZoomed ? 'photo-img--zoomed' : ''"
            :style="{
              transform: isZoomed ? `scale(${ZOOM_SCALE})` : 'scale(1)',
              transformOrigin: `${originX}% ${originY}%`,
              transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }"
            @click.stop="onImageClick"
          />
        </div>
      </div>

      <!-- ── Rating bar ─────────────────────────────────────── -->
      <footer class="rating-bar">
        <UiStarRating
          :model-value="photo.myStars"
          size="lg"
          show-label
          @update:model-value="emit('setStars', photo.id, $event)"
        />
      </footer>

    </div>
  </Teleport>
</template>

<style scoped>
/* ── Shell ─────────────────────────────────────────────────── */
.lightbox {
  @apply fixed inset-0 z-[100] flex flex-col;
}

.backdrop-blur {
  @apply absolute inset-0 backdrop-blur-2xl;
}

.backdrop-color {
  @apply absolute inset-0 transition-colors duration-500;
  background-color: rgb(10 10 10 / 0.92);
}

.backdrop-color--grey {
  background-color: rgb(61 61 61 / 0.95);
}

/* ── Top bar ───────────────────────────────────────────────── */
.topbar {
  @apply relative z-10 h-11 flex items-center justify-between px-3 sm:px-4 flex-shrink-0;
  @apply border-b border-white/[0.1] bg-black/40 backdrop-blur-sm;
}

.topbar-left {
  @apply flex items-center gap-2 sm:gap-3 min-w-0;
}

.topbar-right {
  @apply flex items-center gap-1 flex-shrink-0;
}

.topbar-icon-btn {
  @apply p-1.5 rounded-lg transition-all duration-200;
  @apply text-white/55 hover:text-white hover:bg-white/10;
}

.topbar-icon-btn--active {
  @apply text-white bg-white/15 shadow-sm;
}

.topbar-divider {
  @apply w-px h-4 bg-white/15 flex-shrink-0;
}

.topbar-filename {
  @apply text-white font-headline font-semibold text-sm truncate;
}

.topbar-meta {
  @apply text-white/50 text-xs hidden sm:inline flex-shrink-0;
}

.zoom-badge {
  @apply flex items-center gap-1 bg-white/15 text-white/80;
  @apply text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0;
}

.grey-bg-btn {
  @apply flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold;
  @apply transition-all duration-200;
  @apply text-white/55 hover:bg-white/10 hover:text-white;
}

.grey-bg-btn--active {
  @apply bg-white/20 text-white shadow-sm;
}

.grey-bg-label {
  @apply hidden sm:inline;
}

/* ── Body ──────────────────────────────────────────────────── */
.lb-body {
  @apply relative z-10 flex flex-1 min-h-0;
}

/* ── History panel ─────────────────────────────────────────── */
.history-panel {
  @apply w-48 sm:w-56 flex-shrink-0 flex flex-col overflow-hidden;
  @apply border-r border-white/[0.1] bg-black/45 backdrop-blur-sm;
}

.history-header {
  @apply flex items-center justify-between px-4 py-3 flex-shrink-0;
  @apply border-b border-white/[0.08];
}

.history-title {
  @apply flex items-center gap-2;
}

.history-title-text {
  @apply text-white/70 text-[10px] uppercase tracking-widest font-bold;
}

.history-close-btn {
  @apply text-white/40 hover:text-white/80 transition-colors p-0.5 rounded;
}

.history-scroll {
  @apply flex-1 overflow-y-auto px-4 py-4;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.history-scroll::-webkit-scrollbar { display: none; }

.history-empty {
  @apply flex flex-col items-center gap-2 mt-8 text-center;
}

.history-empty-text {
  @apply text-white/35 text-xs;
}

.history-list {
  @apply space-y-5;
}

.history-entry {
  @apply relative pl-5;
}

.history-line {
  @apply absolute left-[5px] top-5 bottom-[-20px] w-px bg-white/10;
}

.history-dot {
  @apply absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full border-2;
}

.history-dot--photographer {
  @apply bg-amber-400 border-amber-600;
}

.history-dot--model {
  @apply bg-blue-400 border-blue-600;
}

.history-entry-top {
  @apply mb-0.5;
}

.history-by {
  @apply text-[10px] font-bold uppercase tracking-wide;
}

.history-by--photographer {
  @apply text-amber-400;
}

.history-by--model {
  @apply text-blue-400;
}

.history-time {
  @apply text-white/35 text-[9px] mb-1.5;
}

.history-stars {
  @apply flex items-center gap-1.5;
}

.history-prev-stars {
  @apply flex gap-px opacity-40;
}

.history-cur-stars {
  @apply flex gap-px;
}

.history-first-label {
  @apply text-[8px] font-bold uppercase tracking-wide text-white/30 ml-0.5;
}

/* ── Photo area ────────────────────────────────────────────── */
.photo-area {
  @apply flex-1 min-w-0 min-h-0 flex items-center justify-center p-4 sm:p-6 overflow-hidden;
  cursor: zoom-in;
}

.photo-area--zoomed {
  cursor: zoom-out;
}

.photo-img {
  @apply max-h-full max-w-full object-contain select-none block;
  @apply shadow-[0_8px_64px_rgba(0,0,0,0.7)] rounded-sm;
  cursor: zoom-in;
}

.photo-img--zoomed {
  cursor: zoom-out;
}

/* ── Rating bar ────────────────────────────────────────────── */
.rating-bar {
  @apply relative z-10 h-14 flex-shrink-0;
  @apply border-t border-white/[0.1] bg-black/40 backdrop-blur-sm;
  @apply flex items-center justify-center gap-2;
}

/* Force white-toned text inside the always-dark rating bar */
.rating-bar :deep(.star-label) {
  color: rgba(255, 255, 255, 0.45);
}

.rating-bar :deep(.star--empty) {
  color: rgba(255, 255, 255, 0.20);
}

/* ── Transitions ───────────────────────────────────────────── */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  width: 0 !important;
  opacity: 0;
}
</style>
