<script setup lang="ts">
import type { LibraryPhoto } from '~/composables/useLibraryPhotos'

const props = defineProps<{
  starredPhotos: LibraryPhoto[]
}>()

const emit = defineEmits<{
  submit: []
}>()

const previewPhotos = computed(() => props.starredPhotos.slice(0, 3))
const overflow      = computed(() => Math.max(0, props.starredPhotos.length - 3))
</script>

<template>
  <Transition name="slide-up">
    <div v-if="starredPhotos.length > 0" class="bar-wrap">
      <div class="bar">
        <!-- Thumbnails + label -->
        <div class="bar-info">
          <div class="thumbnails">
            <div
              v-for="photo in previewPhotos"
              :key="photo.id"
              class="thumbnail"
            >
              <img :src="photo.thumbnailUrl" :alt="photo.filename" class="thumbnail-img" />
            </div>
            <div v-if="overflow > 0" class="thumbnail thumbnail--overflow">
              +{{ overflow }}
            </div>
          </div>

          <!-- Desktop label -->
          <div class="bar-label">
            <p class="bar-label-top">My Selection</p>
            <p class="bar-label-count">{{ starredPhotos.length }} Photos Starred</p>
          </div>

          <!-- Mobile count badge -->
          <span class="bar-count-mobile">
            {{ starredPhotos.length }}<span class="material-symbols-outlined filled-icon text-amber-500 ml-0.5" style="font-size:14px">star</span>
          </span>
        </div>

        <!-- Submit -->
        <button class="submit-btn" @click="emit('submit')">
          <span class="submit-full">Submit Selection</span>
          <span class="submit-short">
            <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
            Submit
          </span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bar-wrap {
  @apply fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-none;
  @apply w-[calc(100%-2rem)] sm:w-auto;
}

.bar {
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  @apply bg-white/70 dark:bg-slate-900/80;
  @apply px-4 sm:px-8 py-3 sm:py-4 rounded-full;
  @apply shadow-[0_20px_50px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)];
  @apply flex items-center justify-between sm:justify-start gap-4 sm:gap-10;
  @apply border border-white/20 dark:border-white/10;
  @apply pointer-events-auto;
}

/* Thumbnails */
.bar-info {
  @apply flex items-center gap-3 sm:gap-4;
}

.thumbnails {
  @apply flex -space-x-2 sm:-space-x-3;
}

.thumbnail {
  @apply w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0;
  @apply border-2 border-white dark:border-slate-700;
  @apply overflow-hidden bg-surface-container-high;
}

.thumbnail-img {
  @apply w-full h-full object-cover;
}

.thumbnail--overflow {
  @apply bg-surface-container-high dark:bg-slate-700;
  @apply flex items-center justify-center;
  @apply text-[10px] font-bold text-on-surface-variant dark:text-slate-300;
}

/* Labels */
.bar-label {
  @apply hidden sm:block;
}

.bar-label-top {
  @apply text-[10px] font-bold uppercase tracking-widest;
  @apply text-on-surface-variant dark:text-slate-400 leading-none mb-0.5;
}

.bar-label-count {
  @apply text-sm font-headline font-bold text-primary leading-none;
}

.bar-count-mobile {
  @apply flex items-center text-sm font-headline font-bold text-primary sm:hidden;
}

/* Submit button */
.submit-btn {
  @apply bg-gradient-to-br from-primary to-primary-container text-white;
  @apply px-5 sm:px-8 py-2 sm:py-3 rounded-full;
  @apply font-headline font-bold text-sm;
  @apply shadow-xl shadow-primary/30;
  @apply hover:scale-105 active:scale-95 transition-all duration-200;
}

.submit-full {
  @apply hidden sm:inline;
}

.submit-short {
  @apply flex items-center gap-1 sm:hidden;
}

/* Transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(1.5rem);
}
</style>
