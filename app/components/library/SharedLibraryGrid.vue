<script setup lang="ts">
import type { Library } from '~/types'
import type { SubmissionStatus } from '~/composables/useSharedLibraries'

const props = defineProps<{
  libraries: Library[]
  showSubmissionStatus: boolean
  statusOf?: (library: Library) => SubmissionStatus
}>()

function fmtUpdated(iso: string) {
  const date = new Date(iso)
  const diffDays = Math.round((Date.now() - date.getTime()) / 86_400_000)
  if (diffDays <= 0)  return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7)   return `${diffDays} days ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div v-if="libraries.length > 0" class="library-grid">
    <NuxtLink
      v-for="library in libraries"
      :key="library.id"
      :to="`/libraries/${library.id}`"
      class="card group"
    >
      <div class="cover">
        <img
          v-if="library.coverUrl"
          :src="library.coverUrl"
          :alt="library.name"
          class="cover-img"
          loading="lazy"
        />
        <div v-else class="cover-fallback">
          <span class="material-symbols-outlined">photo_library</span>
        </div>

        <SubmissionStatusBadge
          v-if="showSubmissionStatus && statusOf"
          :status="statusOf(library)"
          size="sm"
          class="status-badge"
        />
      </div>

      <div class="body">
        <h3 class="name">{{ library.name }}</h3>
        <p class="meta">
          <span class="meta-item">
            <span class="material-symbols-outlined meta-icon">image</span>
            {{ library.photoCount }} photos
          </span>
          <span class="meta-dot">·</span>
          <span class="meta-item">{{ fmtUpdated(library.updatedAt) }}</span>
        </p>
      </div>
    </NuxtLink>
  </div>

  <div v-else class="empty">
    <span class="material-symbols-outlined empty-icon">folder_off</span>
    <p class="empty-title">No shared libraries yet</p>
  </div>
</template>

<style scoped>
.library-grid {
  @apply grid gap-4 sm:gap-6;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
}

@media (min-width: 640px) {
  .library-grid { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
}

/* ── Card ─────────────────────────────────────────────────── */
.card {
  @apply block rounded-2xl overflow-hidden;
  @apply bg-surface-container-lowest dark:bg-slate-900/70;
  @apply border border-outline-variant/30 dark:border-white/10;
  @apply transition-all duration-300;
  box-shadow:
    0 1px 2px rgba(0, 40, 120, 0.04),
    0 4px 12px rgba(0, 40, 120, 0.04);
}
.card:hover {
  transform: translateY(-2px);
  border-color: rgba(0, 88, 188, 0.25);
  box-shadow:
    0 8px 24px rgba(0, 40, 120, 0.10),
    0 2px 6px rgba(0, 40, 120, 0.06);
}
.dark .card:hover {
  border-color: rgba(173, 198, 255, 0.20);
  box-shadow:
    0 8px 24px rgba(0, 0, 0, 0.45),
    0 2px 6px rgba(0, 0, 0, 0.30);
}

/* ── Cover ────────────────────────────────────────────────── */
.cover {
  @apply relative aspect-[4/3] overflow-hidden;
  @apply bg-surface-container dark:bg-slate-800;
}

.cover-img {
  @apply w-full h-full object-cover;
  @apply transition-transform duration-500;
}
.card:hover .cover-img {
  transform: scale(1.04);
}

.cover-fallback {
  @apply w-full h-full flex items-center justify-center;
  @apply text-on-surface-variant/40 dark:text-white/20;
}
.cover-fallback .material-symbols-outlined { font-size: 40px; }

.status-badge {
  @apply absolute top-3 right-3;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ── Body ─────────────────────────────────────────────────── */
.body {
  @apply px-4 py-3 sm:px-5 sm:py-4 flex flex-col gap-1;
}

.name {
  @apply text-base sm:text-[17px] font-headline font-bold tracking-tight;
  @apply text-on-surface dark:text-slate-100;
  @apply truncate;
}

.meta {
  @apply flex items-center gap-1.5 text-xs;
  @apply text-on-surface-variant dark:text-slate-400;
}

.meta-item {
  @apply inline-flex items-center gap-1;
}

.meta-icon { font-size: 14px !important; }

.meta-dot {
  @apply text-outline-variant dark:text-white/20;
}

/* ── Empty state ──────────────────────────────────────────── */
.empty {
  @apply flex flex-col items-center gap-3 py-20 text-center;
}

.empty-icon {
  @apply text-on-surface-variant/20 dark:text-white/15;
  font-size: 48px !important;
}

.empty-title {
  @apply text-sm font-semibold text-on-surface-variant dark:text-slate-500;
}
</style>
