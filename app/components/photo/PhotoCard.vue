<script setup lang="ts">
import type { LibraryPhoto } from '~/composables/useLibraryPhotos'

const props = defineProps<{
  photo: LibraryPhoto
}>()

const emit = defineEmits<{
  setStars: [id: string, stars: number]
  open: [id: string]
  delete: [id: string]
}>()

const { showPhotographerStars } = useLayoutState()
const { isViewed } = useViewedPhotos()
const { isPhotographer } = useRole()

function handleDelete(e: Event) {
  e.stopPropagation()
  if (!confirm(`Delete "${props.photo.filename}"? This removes the file from storage.`)) return
  emit('delete', props.photo.id)
}

const isMutual = computed(() => props.photo.photographerStars > 0 && props.photo.myStars > 0)
const isUnread = computed(() => props.photo.isNew && !isViewed(props.photo.id))

// Current user's own rating — photographer rates too (their rating == photographerStars).
const topStars = computed(() => props.photo.myStars)

function handleSetStars(stars: number) {
  emit('setStars', props.photo.id, stars)
}
</script>

<template>
  <div
    class="masonry-item card group"
    :class="[
      isMutual  ? 'card--mutual'  : '',
      isUnread  ? 'card--unread'  : '',
    ]"
  >

    <!-- ── Image ──────────────────────────────────────────── -->
    <div class="card-image" @click="emit('open', photo.id)">
      <img
        :src="photo.thumbnailUrl"
        :alt="photo.filename"
        class="card-img"
        loading="lazy"
        draggable="false"
      />

      <div class="card-overlay">
        <span class="material-symbols-outlined card-expand-icon">open_in_full</span>
      </div>

      <!-- New / unread badge -->
      <Transition name="fade">
        <div v-if="isUnread" class="new-badge">
          <span class="material-symbols-outlined" style="font-size:10px">fiber_new</span>
          New
        </div>
      </Transition>

      <!-- Photographer badge -->
      <Transition name="fade">
        <div v-if="showPhotographerStars && photo.photographerStars > 0" class="photographer-badge">
          <div class="badge-inner">
            <div class="badge-stars">
              <span
                v-for="s in 5" :key="s"
                class="material-symbols-outlined"
                :class="s <= photo.photographerStars ? 'filled-icon text-amber-400' : 'text-white/25'"
                style="font-size:10px"
              >star</span>
            </div>
            <span class="badge-label">Photographer</span>
          </div>
        </div>
      </Transition>

      <!-- Mutual badge -->
      <div v-if="isMutual" class="mutual-badge">
        <span class="material-symbols-outlined filled-icon text-white" style="font-size:14px">verified</span>
      </div>

      <!-- Delete button (photographer/admin only) -->
      <button
        v-if="isPhotographer"
        type="button"
        class="photo-del-btn"
        aria-label="Delete photo"
        @click="handleDelete"
      >
        <span class="material-symbols-outlined" style="font-size:16px">delete</span>
      </button>
    </div>

    <!-- ── Mobile footer (< 480px) ───────────────────────── -->
    <div class="footer-mobile">
      <h3 class="filename-mobile">{{ photo.filename }}</h3>
      <UiStarRating
        :model-value="topStars"
        :readonly="false"
        size="sm"
        @update:model-value="handleSetStars"
        @click.stop
      />
    </div>

    <!-- ── Desktop footer (≥ 480px) ──────────────────────── -->
    <div class="footer-desktop">
      <div class="meta-row">
        <div class="meta-left">
          <h3 class="filename">{{ photo.filename }}</h3>
          <p class="fileinfo">{{ photo.fileSize }} · {{ photo.fileType }}</p>
        </div>
        <span v-if="topStars > 0" class="stars-badge">
          {{ topStars }}<span class="material-symbols-outlined filled-icon" style="font-size:10px">star</span>
        </span>
      </div>

      <UiStarRating
        :model-value="topStars"
        :readonly="false"
        size="md"
        class="stars-row"
        @update:model-value="handleSetStars"
        @click.stop
      />
    </div>

  </div>
</template>

<style scoped>
/* ── Card ──────────────────────────────────────────────────── */
.card {
  @apply relative overflow-hidden rounded-xl cursor-pointer;
  @apply bg-surface-container-lowest dark:bg-slate-800;
  @apply transition-all duration-300;
}

.card--mutual {
  @apply ring-2 ring-amber-400 ring-offset-2 dark:ring-offset-slate-900;
}

.card--unread {
  @apply ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900;
}

/* Unread takes priority over mutual visually — if both, mutual wins */
.card--mutual.card--unread {
  @apply ring-amber-400;
}

/* New badge */
.new-badge {
  @apply absolute bottom-3 right-3;
  @apply flex items-center gap-1;
  @apply bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wide;
  @apply px-2 py-1 rounded-full shadow-lg;
}

/* Lift effect only on real pointer devices — disabled on touch/mobile */
@media (hover: hover) {
  .card:hover {
    @apply -translate-y-1.5 shadow-2xl shadow-black/15;
  }
  .dark .card:hover {
    box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.4);
  }
}

/* ── Image ─────────────────────────────────────────────────── */
.card-image {
  @apply relative overflow-hidden;
}

.card-img {
  @apply w-full h-auto block select-none;
}

.card-overlay {
  @apply absolute inset-0 bg-transparent flex items-center justify-center;
  @apply transition-colors duration-300;
}

@media (hover: hover) {
  .card:hover .card-overlay {
    background-color: rgb(0 0 0 / 0.1);
  }
}

.card-expand-icon {
  @apply text-white opacity-0 drop-shadow-lg;
  @apply transition-opacity duration-300;
  font-size: 36px !important;
}

@media (hover: hover) {
  .card:hover .card-expand-icon {
    @apply opacity-80;
  }
}

/* Badges */
.photographer-badge {
  @apply absolute top-3 left-3;
}

.badge-inner {
  @apply flex items-center gap-1.5 bg-black/45 backdrop-blur-sm rounded-full px-2.5 py-1;
}

.badge-stars {
  @apply flex gap-0.5;
}

.badge-label {
  @apply text-white text-[9px] font-bold uppercase tracking-wide leading-none;
}

.mutual-badge {
  @apply absolute top-3 right-3 bg-amber-400 rounded-full p-1.5 shadow-lg;
}

.photo-del-btn {
  @apply absolute bottom-3 left-3 p-1.5 rounded-full;
  @apply bg-black/50 text-white/85 backdrop-blur-sm;
  @apply opacity-0 transition-opacity duration-200;
  @apply hover:bg-red-600 hover:text-white;
}
@media (hover: hover) {
  .card:hover .photo-del-btn { opacity: 1; }
}
@media (hover: none) {
  .photo-del-btn { opacity: 1; }
}

/* ── Mobile footer ─────────────────────────────────────────── */
.footer-mobile {
  @apply flex items-center justify-between px-3 py-2 gap-2;
}

@media (min-width: 480px) {
  .footer-mobile { display: none; }
}

.filename-mobile {
  @apply font-headline font-semibold text-xs truncate min-w-0;
  @apply text-on-surface dark:text-slate-100;
}

/* ── Desktop footer ────────────────────────────────────────── */
.footer-desktop {
  display: none;
  @apply px-4 py-3;
}

@media (min-width: 480px) {
  .footer-desktop { display: block; }
}

.meta-row {
  @apply flex justify-between items-start mb-2.5;
}

.meta-left {
  @apply min-w-0 pr-2;
}

.filename {
  @apply font-headline font-bold text-sm truncate;
  @apply text-on-surface dark:text-slate-100;
}

.fileinfo {
  @apply text-xs text-on-surface-variant dark:text-slate-400;
}

.stars-badge {
  @apply flex-shrink-0 text-[10px] font-bold text-amber-500;
  @apply bg-amber-50 dark:bg-amber-900/30 rounded-full px-2 py-0.5;
  @apply leading-none flex items-center gap-0.5 mt-0.5;
}

.stars-row {
  @apply w-full;
}

/* ── Transition ────────────────────────────────────────────── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
