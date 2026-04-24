<script setup lang="ts">
/**
 * UiAlert — contextual alert / message box.
 *
 * Variants:
 *   error   — red  (default)
 *   success — green
 *   warning — amber
 *   info    — blue
 *
 * Usage:
 *   <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
 *   <UiAlert variant="success" icon="check_circle">Saved!</UiAlert>
 */
withDefaults(defineProps<{
  variant?: 'error' | 'success' | 'warning' | 'info'
  icon?:    string
}>(), {
  variant: 'error',
})

const defaultIcon: Record<string, string> = {
  error:   'error',
  success: 'check_circle',
  warning: 'warning',
  info:    'info',
}
</script>

<template>
  <div class="alert" :class="`alert--${variant}`">
    <span
      class="material-symbols-outlined alert-icon"
      aria-hidden="true"
      style="font-size:15px"
    >{{ icon ?? defaultIcon[variant] }}</span>
    <slot />
  </div>
</template>

<style scoped>
.alert {
  @apply flex items-center gap-2 px-3.5 py-3 rounded-xl;
  @apply text-xs font-medium;
}

/* ── Error ──────────────────────────────────────────────── */
.alert--error {
  @apply text-red-700 dark:text-red-400;
  @apply bg-red-50 dark:bg-red-900/20;
  @apply border border-red-200 dark:border-red-800/50;
}

/* ── Success ────────────────────────────────────────────── */
.alert--success {
  @apply text-emerald-700 dark:text-emerald-400;
  @apply bg-emerald-50 dark:bg-emerald-900/20;
  @apply border border-emerald-200 dark:border-emerald-800/50;
}

/* ── Warning ────────────────────────────────────────────── */
.alert--warning {
  @apply text-amber-700 dark:text-amber-400;
  @apply bg-amber-50 dark:bg-amber-900/20;
  @apply border border-amber-200 dark:border-amber-800/50;
}

/* ── Info ───────────────────────────────────────────────── */
.alert--info {
  @apply text-blue-700 dark:text-blue-400;
  @apply bg-blue-50 dark:bg-blue-900/20;
  @apply border border-blue-200 dark:border-blue-800/50;
}

/* Icon baseline alignment */
.alert-icon {
  @apply flex-shrink-0 self-start mt-px;
}
</style>
