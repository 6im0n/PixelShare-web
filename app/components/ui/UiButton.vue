<script setup lang="ts">
/**
 * UiButton — universal button component.
 *
 * Variants:
 *   primary   — gradient blue CTA (submit, main actions)
 *   secondary — outlined (secondary actions)
 *   ghost     — transparent with hover bg (icon buttons, nav)
 *   danger    — red (destructive actions)
 *   google    — white glass (OAuth button)
 *   chip      — filter pill / toggle chip
 *
 * Use `icon-only` when the button has no visible text (adjusts padding).
 * Use `color="emerald"` (or amber / red) to tint chip/ghost variants.
 */
withDefaults(defineProps<{
  variant?:  'primary' | 'secondary' | 'ghost' | 'danger' | 'google' | 'chip'
  color?:    'blue' | 'emerald' | 'amber' | 'red'
  size?:     'sm' | 'md' | 'lg'
  icon?:     string    // Material Symbol name — rendered on the left
  iconOnly?: boolean   // removes horizontal text padding (square button)
  loading?:  boolean
  active?:   boolean   // toggled appearance for ghost / chip
  full?:     boolean   // w-full
  type?:     'button' | 'submit' | 'reset'
}>(), {
  variant:  'secondary',
  color:    'blue',
  size:     'md',
  type:     'button',
})
</script>

<template>
  <button
    :type="type"
    :disabled="loading || $attrs.disabled as boolean"
    :class="[
      'btn',
      `btn--${variant}`,
      `btn--${size}`,
      active   && 'btn--active',
      iconOnly && 'btn--icon-only',
      full     && 'w-full',
      color !== 'blue' && variant === 'chip'  && `btn--chip-${color}`,
      color !== 'blue' && variant === 'ghost' && `btn--ghost-${color}`,
    ]"
    v-bind="$attrs"
  >
    <!-- Spinner -->
    <span v-if="loading" class="btn-spinner" aria-hidden="true" />

    <!-- Leading Material Symbol icon -->
    <span
      v-if="icon && !loading"
      class="material-symbols-outlined btn-icon"
      aria-hidden="true"
    >{{ icon }}</span>

    <!-- Slot for custom leading icon (Google SVG, etc.) -->
    <span v-if="$slots.icon && !loading" class="btn-icon" aria-hidden="true">
      <slot name="icon" />
    </span>

    <!-- Button text / content -->
    <slot />
  </button>
</template>

<style scoped>
/* ── Base ──────────────────────────────────────────────────── */
.btn {
  @apply inline-flex items-center justify-center gap-2 font-headline font-semibold;
  @apply select-none cursor-pointer transition-all duration-200;
  @apply disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none;
}

/* ── Sizes ─────────────────────────────────────────────────── */
.btn--sm {
  @apply px-2.5 py-1.5 rounded-xl text-xs;
}
.btn--sm .btn-icon { font-size: 16px !important; }

.btn--md {
  @apply px-4 py-2.5 rounded-xl text-sm;
}
.btn--md .btn-icon { font-size: 18px !important; }

.btn--lg {
  @apply px-5 py-3.5 rounded-2xl text-sm;
}
.btn--lg .btn-icon { font-size: 18px !important; }

/* Icon-only: square padding */
.btn--sm.btn--icon-only { @apply px-1.5; }
.btn--md.btn--icon-only { @apply px-2.5; }
.btn--lg.btn--icon-only { @apply px-3; }

/* ── Primary ───────────────────────────────────────────────── */
.btn--primary {
  @apply text-white;
  background: linear-gradient(135deg, #0058bc 0%, #0070eb 100%);
  box-shadow: 0 4px 16px rgba(0, 88, 188, 0.35), 0 1px 3px rgba(0, 88, 188, 0.2);
}
.btn--primary:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 24px rgba(0, 88, 188, 0.4), 0 2px 6px rgba(0, 88, 188, 0.25);
}
.btn--primary:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0, 88, 188, 0.3);
}

/* Primary emerald (upload / photographer actions) */
.btn--primary.btn--ghost-emerald,
.btn--primary.btn--chip-emerald {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.35);
}

/* ── Secondary ─────────────────────────────────────────────── */
.btn--secondary {
  @apply text-on-surface dark:text-slate-200;
  @apply border border-outline-variant/30 dark:border-white/15;
  @apply bg-surface-container-low dark:bg-slate-800/60;
  @apply hover:bg-surface-container dark:hover:bg-slate-700/60;
  @apply hover:border-outline-variant/60 dark:hover:border-white/25;
}

/* ── Ghost ─────────────────────────────────────────────────── */
.btn--ghost {
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:text-on-surface dark:hover:text-slate-200;
}
.btn--ghost:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
.dark .btn--ghost:hover {
  background-color: rgba(255, 255, 255, 0.08);
}
.btn--ghost.btn--active {
  @apply text-on-surface dark:text-slate-200;
  background-color: rgba(0, 0, 0, 0.06);
}
.dark .btn--ghost.btn--active {
  background-color: rgba(255, 255, 255, 0.10);
}
.btn--ghost--emerald       { @apply text-emerald-600 dark:text-emerald-400; }
.btn--ghost--amber         { @apply text-amber-600  dark:text-amber-400; }

/* ── Danger ────────────────────────────────────────────────── */
.btn--danger {
  @apply text-red-600 dark:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-900/20;
}
.btn--danger.btn--active {
  @apply bg-red-50 dark:bg-red-900/25 text-red-700 dark:text-red-400;
}

/* ── Google OAuth ──────────────────────────────────────────── */
.btn--google {
  @apply text-slate-700 dark:text-slate-200;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.10);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
}
.dark .btn--google {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow: none;
}
.btn--google:hover {
  background: rgba(255, 255, 255, 1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.10);
  transform: translateY(-1px);
}
.dark .btn--google:hover {
  background: rgba(255, 255, 255, 0.10);
  transform: translateY(-1px);
}
.btn--google:active { transform: translateY(0); }

/* ── Chip (filter pill) ────────────────────────────────────── */
.btn--chip {
  @apply rounded-full text-xs font-semibold;
  @apply px-3 py-1.5;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply bg-surface-container-low dark:bg-slate-800/60;
  @apply border border-outline-variant/20 dark:border-white/10;
  @apply hover:border-outline-variant/50 dark:hover:border-white/20;
  @apply hover:bg-surface-container dark:hover:bg-slate-700/60;
}
.btn--chip.btn--active {
  @apply text-primary border-primary/40 dark:border-primary/50;
  background-color: rgba(0, 88, 188, 0.08);
}
.dark .btn--chip.btn--active {
  background-color: rgba(0, 88, 188, 0.2);
}

.btn--chip.btn--chip-emerald {
  @apply text-emerald-700 dark:text-emerald-400;
}
.btn--chip.btn--chip-emerald.btn--active {
  @apply border-emerald-400/40 dark:border-emerald-500/40;
  @apply bg-emerald-50 dark:bg-emerald-900/25;
}

.btn--chip.btn--chip-amber {
  @apply text-amber-700 dark:text-amber-400;
}
.btn--chip.btn--chip-amber.btn--active {
  @apply border-amber-400/40 bg-amber-50 dark:bg-amber-900/25;
}

/* ── Spinner ───────────────────────────────────────────────── */
.btn-spinner {
  @apply w-4 h-4 rounded-full border-2 flex-shrink-0;
  border-color: currentColor;
  border-color: color-mix(in srgb, currentColor 30%, transparent);
  border-top-color: currentColor;
  animation: btn-spin 0.7s linear infinite;
}
@keyframes btn-spin { to { transform: rotate(360deg); } }
</style>
