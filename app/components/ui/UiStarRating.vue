<script setup lang="ts">
/**
 * UiStarRating — interactive 1-to-5 star rating widget.
 *
 * Emits 'update:modelValue' when the user clicks a star.
 * Clicking the same star that is already active resets to 0 (unrated).
 *
 * Props:
 *   modelValue — current rating 0–5 (0 = unrated)
 *   readonly   — disables interaction (display only)
 *   size       — 'sm' | 'md' | 'lg'  (controls icon font size)
 *   showLabel  — show text label to the right (e.g. "3 / 5")
 */
const props = withDefaults(defineProps<{
  modelValue?: number
  readonly?:   boolean
  size?:       'sm' | 'md' | 'lg'
  showLabel?:  boolean
}>(), {
  modelValue: 0,
  size:       'md',
})

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const hovered = ref(0)

const iconSize: Record<string, string> = {
  sm: '14px',
  md: '18px',
  lg: '22px',
}

function handleClick(n: number) {
  if (props.readonly) return
  // clicking the active star resets to 0
  emit('update:modelValue', n === props.modelValue ? 0 : n)
}

function handleHover(n: number) {
  if (!props.readonly) hovered.value = n
}

function handleLeave() {
  hovered.value = 0
}

// The displayed fill level: hover preview beats actual value
const displayValue = computed(() => hovered.value || props.modelValue)

function starColor(value: number): string {
  if (value >= 4) return 'text-amber-400'
  if (value === 3) return 'text-amber-400'
  if (value === 2) return 'text-amber-400/70'
  return 'text-amber-400/50'
}
</script>

<template>
  <div
    class="star-rating"
    :class="[`star-rating--${size}`, readonly && 'star-rating--readonly']"
    @mouseleave="handleLeave"
  >
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star-btn"
      :aria-label="`Rate ${n} star${n > 1 ? 's' : ''}`"
      :tabindex="readonly ? -1 : 0"
      @click="handleClick(n)"
      @mouseenter="handleHover(n)"
    >
      <span
        class="material-symbols-outlined"
        :class="[
          n <= displayValue ? 'filled-icon star--filled' : 'star--empty',
          n <= displayValue && displayValue > 0 ? starColor(displayValue) : '',
        ]"
        :style="{ fontSize: iconSize[size] }"
        aria-hidden="true"
      >star</span>
    </button>

    <span v-if="showLabel && modelValue > 0" class="star-label">
      {{ modelValue }}&thinsp;/&thinsp;5
    </span>
  </div>
</template>

<style scoped>
.star-rating {
  @apply inline-flex items-center gap-0.5;
}

.star-rating--readonly {
  @apply pointer-events-none;
}

/* Gap by size */
.star-rating--sm { gap: 1px; }
.star-rating--md { gap: 2px; }
.star-rating--lg { @apply gap-1; }

.star-btn {
  @apply p-0 leading-none transition-transform duration-100;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded;
}

.star-rating:not(.star-rating--readonly) .star-btn:hover {
  transform: scale(1.2);
}

.star--filled {
  /* color is applied via class from starColor() */
}

.star--empty {
  @apply text-on-surface-variant/20 dark:text-white/15;
}

.star-label {
  @apply ml-1.5 text-xs font-mono text-on-surface-variant dark:text-slate-400;
}
</style>
