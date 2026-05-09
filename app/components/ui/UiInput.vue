<script setup lang="ts">
/**
 * UiInput — form field with integrated label, leading icon,
 * optional password visibility toggle, and error message.
 *
 * Props:
 *   modelValue — v-model binding
 *   label      — field label text (optional)
 *   type       — input type (default 'text'); when 'password', renders the show/hide toggle
 *   icon       — Material Symbol name for leading icon
 *   placeholder
 *   error      — error message string; if set, shows red border + message below
 *   id         — forwarded to <input> id (and <label> for=)
 *   autocomplete
 *   required / disabled / minlength / maxlength — forwarded via $attrs
 */
const props = withDefaults(defineProps<{
  modelValue?:   string
  label?:        string
  type?:         string
  icon?:         string
  placeholder?:  string
  error?:        string
  id?:           string
  autocomplete?: string
}>(), {
  type: 'text',
})

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const showPass = ref(false)

const inputType = computed(() => {
  if (props.type !== 'password') return props.type
  return showPass.value ? 'text' : 'password'
})
</script>

<template>
  <div class="field">
    <!-- Label row — supports default slot for right-aligned extra content -->
    <div v-if="label || $slots.labelRight" class="field-label-row">
      <label v-if="label" :for="id" class="field-label">{{ label }}</label>
      <slot name="labelRight" />
    </div>

    <!-- Input wrapper -->
    <div class="input-wrap" :class="error && 'input-wrap--error'">
      <!-- Leading icon -->
      <span
        v-if="icon"
        class="material-symbols-outlined input-icon"
        aria-hidden="true"
      >{{ icon }}</span>

      <!-- Native input -->
      <input
        :id="id"
        :value="modelValue"
        :type="inputType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="input"
        :class="[icon && 'input--has-icon', (type === 'password') && 'input--has-toggle']"
        v-bind="$attrs"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />

      <!-- Password visibility toggle -->
      <button
        v-if="type === 'password'"
        type="button"
        class="pass-toggle"
        :aria-label="showPass ? 'Hide password' : 'Show password'"
        @click="showPass = !showPass"
      >
        <span class="material-symbols-outlined" style="font-size:16px">
          {{ showPass ? 'visibility_off' : 'visibility' }}
        </span>
      </button>
    </div>

    <!-- Error message -->
    <Transition name="field-err">
      <p v-if="error" class="field-error">{{ error }}</p>
    </Transition>

    <!-- Optional helper slot -->
    <slot name="helper" />
  </div>
</template>

<style scoped>
/* ── Field wrapper ──────────────────────────────────────── */
.field {
  @apply flex flex-col gap-1.5;
}

.field-label-row {
  @apply flex items-center justify-between;
}

.field-label {
  @apply text-xs font-semibold tracking-wide;
  @apply text-on-surface dark:text-white/70;
}

/* ── Input wrapper ──────────────────────────────────────── */
.input-wrap {
  @apply relative flex items-center;
}

/* ── Leading icon ───────────────────────────────────────── */
.input-icon {
  @apply absolute left-3.5 pointer-events-none;
  @apply text-on-surface-variant/40 dark:text-white/25;
  font-size: 17px !important;
}

/* ── Native input ───────────────────────────────────────── */
.input {
  @apply w-full py-3 rounded-xl text-sm;
  @apply font-body text-on-surface dark:text-white;
  @apply outline-none transition-all duration-200;
  /* default (no leading icon, no toggle) */
  @apply px-4;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.10);
}

.dark .input {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.10);
}

.input.input--has-icon {
  @apply pl-10;
}

.input.input--has-toggle {
  @apply pr-10;
}

.input::placeholder {
  @apply text-on-surface-variant/35 dark:text-white/20;
}

.input:focus {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.15);
  background: rgba(255, 255, 255, 0.9);
}

.dark .input:focus {
  border-color: rgba(173, 198, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.25);
  background: rgba(255, 255, 255, 0.08);
}

/* Error state */
.input-wrap--error .input {
  border-color: rgba(220, 38, 38, 0.6);
}

.input-wrap--error .input:focus {
  border-color: #dc2626;
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.15);
}

/* ── Password toggle ────────────────────────────────────── */
.pass-toggle {
  @apply absolute right-3.5;
  @apply text-on-surface-variant/40 dark:text-white/25;
  @apply hover:text-on-surface-variant dark:hover:text-white/60;
  @apply transition-colors duration-150;
}

/* ── Error message ──────────────────────────────────────── */
.field-error {
  @apply text-xs text-red-600 dark:text-red-400 mt-0.5;
}

/* Transition */
.field-err-enter-active, .field-err-leave-active { transition: all 0.15s ease; }
.field-err-enter-from, .field-err-leave-to { opacity: 0; transform: translateY(-3px); }
</style>
