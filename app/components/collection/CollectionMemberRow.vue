<script setup lang="ts">
const props = defineProps<{
  name:           string
  email?:         string
  avatarUrl?:     string
  /** Optional sub-label (e.g. invitation status) shown under the name. */
  hint?:          string
  /** Bound v-model:readyToShare. */
  readyToShare:   boolean
}>()

const emit = defineEmits<{
  'update:readyToShare': [value: boolean]
  'remove':              []
}>()

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p.charAt(0).toUpperCase()).join('') || '?'
})

function toggleReady() {
  emit('update:readyToShare', !props.readyToShare)
}
</script>

<template>
  <div class="row">
    <!-- Avatar / initials -->
    <div class="avatar">
      <img v-if="avatarUrl" :src="avatarUrl" :alt="name" class="avatar-img" />
      <span v-else class="avatar-initials">{{ initials }}</span>
    </div>

    <!-- Identity -->
    <div class="identity">
      <span class="name">{{ name }}</span>
      <span v-if="email || hint" class="meta">{{ hint || email }}</span>
    </div>

    <!-- Ready toggle -->
    <button
      type="button"
      class="ready"
      :class="readyToShare && 'ready--on'"
      :aria-pressed="readyToShare"
      @click="toggleReady"
    >
      <span class="ready-track"><span class="ready-thumb" /></span>
      <span class="ready-label">{{ readyToShare ? 'Ready to share' : 'Not yet' }}</span>
    </button>

    <!-- Remove -->
    <UiButton
      variant="ghost"
      color="red"
      size="sm"
      icon="close"
      icon-only
      aria-label="Remove member"
      @click="emit('remove')"
    />
  </div>
</template>

<style scoped>
.row {
  @apply flex items-center gap-3 sm:gap-4 px-3 py-2.5 rounded-2xl;
  @apply bg-surface-container-low/70 dark:bg-white/5;
  @apply border border-outline-variant/20 dark:border-white/10;
  @apply transition-colors;
}

.row:hover {
  @apply bg-surface-container/80 dark:bg-white/10;
}

/* Avatar */
.avatar {
  @apply relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0;
  @apply bg-primary-container/40 dark:bg-primary/30;
  @apply flex items-center justify-center;
}
.avatar-img      { @apply w-full h-full object-cover; }
.avatar-initials {
  @apply text-sm font-headline font-bold;
  @apply text-on-primary-container dark:text-on-primary;
}

/* Identity */
.identity { @apply flex flex-col min-w-0 flex-1; }

.name {
  @apply text-sm font-semibold truncate;
  @apply text-on-surface dark:text-slate-100;
}

.meta {
  @apply text-xs truncate;
  @apply text-on-surface-variant/80 dark:text-slate-400;
}

/* Toggle */
.ready {
  @apply hidden sm:flex items-center gap-2 px-1 py-1 rounded-full;
  @apply text-xs font-semibold select-none cursor-pointer;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply transition-colors;
}

.ready-track {
  @apply relative w-9 h-5 rounded-full transition-colors;
  background-color: rgba(0, 0, 0, 0.12);
}
.dark .ready-track { background-color: rgba(255, 255, 255, 0.15); }

.ready-thumb {
  @apply absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}

.ready--on { @apply text-emerald-700 dark:text-emerald-400; }
.ready--on .ready-track { background-color: #10b981; }
.ready--on .ready-thumb { transform: translateX(16px); }

.ready-label { @apply hidden md:inline; }
</style>
