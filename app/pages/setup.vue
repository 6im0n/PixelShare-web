<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

const api = useApi()
const { signIn } = useAuth()

const status = ref<'checking' | 'ready' | 'done'>('checking')
const key = ref('')
const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    const s = await api.get<{ required: boolean }>('/onboarding/status')
    status.value = s.required ? 'ready' : 'done'
  } catch {
    status.value = 'ready'
  }
})

async function submit() {
  error.value = null
  loading.value = true
  try {
    await api.post('/onboarding/setup', {
      key: key.value,
      name: name.value,
      email: email.value,
      password: password.value,
    })
    await signIn({ email: email.value, password: password.value }, { redirect: false })
    // Full reload — clears module-level onboardingRequired flag in middleware
    window.location.href = '/'
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Setup failed.'
    loading.value = false
  }
}
</script>

<template>
  <UiCard>
    <!-- Already done -->
    <template v-if="status === 'done'">
      <div class="card-header">
        <h1 class="card-title">Setup complete</h1>
        <p class="card-subtitle">An admin account already exists. Please sign in.</p>
      </div>
      <NuxtLink to="/login" class="login-link">Go to sign in →</NuxtLink>
    </template>

    <!-- Loading -->
    <template v-else-if="status === 'checking'">
      <p class="card-subtitle">Checking…</p>
    </template>

    <!-- Setup form -->
    <template v-else>
      <div class="card-header">
        <h1 class="card-title">Initial Setup</h1>
        <p class="card-subtitle">Create the first administrator account. Use the setup key printed in the server console.</p>
      </div>

      <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>

      <form class="form" @submit.prevent="submit">
        <UiInput
          id="setup-key"
          v-model="key"
          label="Setup key"
          icon="key"
          placeholder="6-character key from server console"
          required
        />
        <UiInput
          id="setup-name"
          v-model="name"
          label="Your name"
          icon="person"
          placeholder="Your full name"
          autocomplete="name"
          required
        />
        <UiInput
          id="setup-email"
          v-model="email"
          label="Email"
          type="email"
          icon="mail"
          placeholder="admin@example.com"
          autocomplete="email"
          required
        />
        <UiInput
          id="setup-password"
          v-model="password"
          label="Password"
          type="password"
          icon="lock"
          placeholder="At least 8 characters"
          autocomplete="new-password"
          minlength="8"
          required
        />
        <UiButton variant="primary" type="submit" :loading="loading" class="w-full justify-center">
          {{ loading ? 'Creating account…' : 'Create admin account' }}
        </UiButton>
      </form>
    </template>
  </UiCard>
</template>

<style scoped>
.card-header { @apply flex flex-col gap-1 mb-4; }
.card-title { @apply text-2xl font-extrabold font-headline tracking-tight; }
.card-subtitle { @apply text-sm text-on-surface-variant dark:text-white/45; }
.form { @apply flex flex-col gap-4; }
.login-link { @apply text-sm font-semibold text-primary hover:underline; }
</style>
