<script setup lang="ts">
import type { SubmissionStatus } from '~/composables/useSharedLibraries'
import { SUBMISSION_STATUS_LABEL } from '~/composables/useSharedLibraries'

const props = defineProps<{
  status: SubmissionStatus
  size?: 'sm' | 'md'
}>()

const ICON: Record<SubmissionStatus, string> = {
  'not-started': 'radio_button_unchecked',
  'in-progress': 'pending',
  'submitted':   'check_circle',
}
</script>

<template>
  <span class="badge" :class="[`badge--${status}`, `badge--${size ?? 'md'}`]">
    <span class="material-symbols-outlined badge-icon" :class="status === 'submitted' ? 'filled-icon' : ''">
      {{ ICON[status] }}
    </span>
    {{ SUBMISSION_STATUS_LABEL[status] }}
  </span>
</template>

<style scoped>
.badge {
  @apply inline-flex items-center gap-1 font-headline font-semibold;
  @apply rounded-full border;
  @apply whitespace-nowrap;
}

.badge--sm { @apply text-[10px] px-2 py-0.5; }
.badge--md { @apply text-xs    px-2.5 py-1; }

.badge--sm .badge-icon { font-size: 12px !important; }
.badge--md .badge-icon { font-size: 14px !important; }

/* Submitted — primary */
.badge--submitted {
  @apply text-primary border-primary/25;
  background-color: rgba(0, 88, 188, 0.08);
}
.dark .badge--submitted {
  background-color: rgba(0, 88, 188, 0.20);
}

/* In progress — tertiary (warm orange) */
.badge--in-progress {
  @apply text-tertiary border-tertiary/25;
  background-color: rgba(158, 61, 0, 0.08);
}
.dark .badge--in-progress {
  @apply text-tertiary-fixed-dim border-tertiary-fixed-dim/30;
  background-color: rgba(255, 181, 149, 0.10);
}

/* Not started — neutral outline */
.badge--not-started {
  @apply text-on-surface-variant dark:text-slate-400;
  @apply border-outline-variant/40 dark:border-white/10;
  @apply bg-surface-container-low dark:bg-slate-800/60;
}
</style>
