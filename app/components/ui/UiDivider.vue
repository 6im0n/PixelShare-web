<script setup lang="ts">
/**
 * UiDivider — horizontal rule with optional centred label.
 *
 * Usage:
 *   <UiDivider />           — plain line
 *   <UiDivider label="or" /> — line with text
 */
defineProps<{ label?: string }>()
</script>

<template>
  <div class="divider">
    <span class="divider-line" />
    <span v-if="label" class="divider-text">{{ label }}</span>
    <span class="divider-line" />
  </div>
</template>

<style scoped>
.divider {
  @apply flex items-center gap-3;
}

.divider-line {
  @apply flex-1 h-px;
  background-color: rgba(0, 0, 0, 0.08);
}

.dark .divider-line {
  background-color: rgba(255, 255, 255, 0.10);
}

.divider-text {
  @apply text-xs font-medium flex-shrink-0;
  @apply text-on-surface-variant/50 dark:text-white/25;
}
</style>
