<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false, middleware: ['guest'] })

const api = useApi()

const email   = ref('')
const loading = ref(false)
const error   = ref('')
const sent    = ref(false)

async function handleSubmit() {
  if (!email.value) return
  loading.value = true
  error.value   = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    sent.value = true
  } catch (e: any) {
    const status = e?.status ?? e?.response?.status
    if (status === 429) {
      error.value = e?.data?.message ?? 'Please wait 10 minutes before requesting another reset email.'
    } else {
      error.value = e?.data?.message ?? 'Something went wrong. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UiCard>
    <div class="card-header">
      <h1 class="card-title">Reset your password</h1>
      <p class="card-subtitle">Enter your email and we'll send you a reset link.</p>
    </div>

    <template v-if="sent">
      <div class="sent-body">
        <span class="material-symbols-outlined sent-icon">mark_email_read</span>
        <p class="sent-text">
          If an account exists for <strong>{{ email }}</strong>, a password reset link has been sent. Check your inbox.
        </p>
        <NuxtLink to="/login" class="auth-link">Back to sign in</NuxtLink>
      </div>
    </template>

    <template v-else>
      <form class="form" @submit.prevent="handleSubmit">
        <Transition name="err">
          <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
        </Transition>

        <UiInput
          id="email"
          v-model="email"
          label="Email"
          type="email"
          icon="mail"
          placeholder="you@example.com"
          autocomplete="email"
          required
        />

        <UiButton
          variant="primary"
          size="lg"
          type="submit"
          full
          :loading="loading"
          :disabled="!email"
          class="mt-1"
        >
          {{ loading ? 'Sending…' : 'Send reset link' }}
        </UiButton>
      </form>

      <p class="card-footer">
        Remembered it?
        <NuxtLink to="/login" class="auth-link">Sign in</NuxtLink>
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

.sent-body { @apply flex flex-col items-center gap-4 py-4 text-center; }

.sent-icon {
  font-size: 48px !important;
  @apply text-emerald-500;
}

.sent-text {
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
