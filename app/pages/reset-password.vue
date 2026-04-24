<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

const api   = useApi()
const route = useRoute()

const password  = ref('')
const password2 = ref('')
const loading   = ref(false)
const error     = ref('')
const done      = ref(false)

const token = computed(() => route.query.token as string | undefined)

const mismatch = computed(() => password2.value && password.value !== password2.value)
const weak     = computed(() => password.value.length > 0 && password.value.length < 8)
const canSubmit = computed(() => token.value && password.value.length >= 8 && password.value === password2.value)

async function handleSubmit() {
  if (!canSubmit.value) return
  loading.value = true
  error.value   = ''
  try {
    await api.post('/auth/reset-password', { token: token.value, password: password.value })
    done.value = true
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiCard>
    <div class="card-header">
      <h1 class="card-title">Set new password</h1>
      <p class="card-subtitle">Enter a new password for your account.</p>
    </div>

    <template v-if="!token">
      <div class="status-body">
        <span class="material-symbols-outlined status-icon text-red-500">error</span>
        <p class="status-text">Invalid reset link. Please request a new one.</p>
        <NuxtLink to="/forgot-password" class="auth-link">Request reset</NuxtLink>
      </div>
    </template>

    <template v-else-if="done">
      <div class="status-body">
        <span class="material-symbols-outlined status-icon text-emerald-500">check_circle</span>
        <p class="status-text">Password updated! You can now sign in with your new password.</p>
        <NuxtLink to="/login" class="auth-link">Sign in</NuxtLink>
      </div>
    </template>

    <template v-else>
      <form class="form" @submit.prevent="handleSubmit">
        <Transition name="err">
          <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
        </Transition>

        <UiInput
          id="password"
          v-model="password"
          label="New password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          autocomplete="new-password"
          required
          :error="weak ? 'Minimum 8 characters' : undefined"
        />

        <UiInput
          id="password2"
          v-model="password2"
          label="Confirm password"
          type="password"
          icon="lock"
          placeholder="••••••••"
          autocomplete="new-password"
          required
          :error="mismatch ? 'Passwords do not match' : undefined"
        />

        <UiButton
          variant="primary"
          size="lg"
          type="submit"
          full
          :loading="loading"
          :disabled="!canSubmit"
          class="mt-1"
        >
          {{ loading ? 'Saving…' : 'Set new password' }}
        </UiButton>
      </form>

      <p class="card-footer">
        <NuxtLink to="/login" class="auth-link">Back to sign in</NuxtLink>
      </p>
    </template>
  </UiCard>
</template>

<style scoped>
.card-header { @apply flex flex-col gap-1; }

.card-title {
  @apply text-2xl font-extrabold font-headline tracking-tight;
  @apply text-on-surface dark:text-white;
}

.card-subtitle {
  @apply text-sm text-on-surface-variant dark:text-white/45;
}

.form { @apply flex flex-col gap-4; }

.status-body { @apply flex flex-col items-center gap-4 py-4 text-center; }

.status-icon { font-size: 48px !important; }

.status-text {
  @apply text-sm text-on-surface-variant dark:text-white/45 max-w-xs leading-relaxed;
}

.card-footer {
  @apply text-center text-xs text-on-surface-variant/60 dark:text-white/35;
}

.auth-link {
  @apply text-primary dark:text-primary-fixed-dim font-semibold;
  @apply hover:underline transition-colors;
}

.err-enter-active, .err-leave-active { transition: all 0.2s ease; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
