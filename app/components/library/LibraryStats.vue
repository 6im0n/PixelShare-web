<script setup lang="ts">
defineProps<{
  total: number
  starred: number
  pending: number
}>()
</script>

<template>
  <div class="stats">
    <div class="counts">
      <div class="stat">
        <span class="stat-label">Library</span>
        <span class="stat-value">{{ total }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Starred</span>
        <span class="stat-value">
          {{ starred }}
          <span class="material-symbols-outlined filled-icon text-amber-500" style="font-size:12px">star</span>
        </span>
      </div>
      <div class="stat">
        <span class="stat-label">Pending</span>
        <span class="stat-value">{{ pending }}</span>
      </div>
    </div>

    <span class="status-badge">
      <span class="status-dot" />
      <span class="status-label-full">{{ starred }} Starred</span>
      <span class="status-label-short">{{ starred }}</span>
    </span>
  </div>
</template>

<style scoped>
.stats {
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.3);
  @apply rounded-2xl p-1 sm:p-1.5;
  @apply flex items-center gap-1 sm:gap-1.5 shadow-sm self-start sm:self-auto;
}

.counts {
  @apply flex items-center gap-3 sm:gap-5 px-3 sm:px-4 py-1.5 sm:py-2;
  @apply border-r border-white/20 dark:border-white/10 mr-1 sm:mr-1.5;
}

.stat {
  @apply flex flex-col;
}

.stat-label {
  @apply text-[9px] sm:text-[10px] uppercase tracking-wider font-bold leading-none mb-0.5 sm:mb-1;
  @apply text-on-surface-variant/60 dark:text-white/35;
}

.stat-value {
  @apply text-xs sm:text-sm font-headline font-extrabold leading-none flex items-center gap-0.5 sm:gap-1;
  @apply text-on-surface dark:text-white/90;
}

.status-badge {
  @apply px-2 sm:px-3 py-1 sm:py-1.5 bg-primary/10 rounded-xl;
  @apply text-[10px] sm:text-xs font-bold text-primary;
  @apply flex items-center gap-1 sm:gap-1.5 border border-primary/10;
}

.status-dot {
  @apply w-1.5 h-1.5 rounded-full bg-primary animate-pulse;
}

.status-label-full {
  @apply hidden sm:inline;
}

.status-label-short {
  @apply sm:hidden;
}
</style>
