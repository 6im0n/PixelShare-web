<script setup lang="ts">
/**
 * UiCard — glass morphism card container.
 *
 * The default slot is the card body.
 * Named slots: header, footer
 *
 * Props:
 *   maxWidth — Tailwind max-width class suffix, e.g. 'sm' → max-w-sm (default 'sm')
 *   padding  — Tailwind padding class, e.g. 'p-8' (default 'p-8')
 */
withDefaults(defineProps<{
  maxWidth?: string
  padding?:  string
}>(), {
  maxWidth: 'sm',
  padding:  'p-8',
})
</script>

<template>
  <div class="ui-card" :class="[`max-w-${maxWidth}`, padding]">
    <slot />
  </div>
</template>

<style scoped>
.ui-card {
  @apply w-full flex flex-col gap-5 rounded-3xl;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(40px) saturate(200%);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow:
    0 32px 80px rgba(0, 40, 120, 0.10),
    0 8px 24px rgba(0, 40, 120, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.dark .ui-card {
  background: rgba(8, 13, 30, 0.82);
  border-color: rgba(255, 255, 255, 0.07);
  box-shadow:
    0 32px 80px rgba(0, 0, 0, 0.55),
    0 8px 24px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}
</style>
