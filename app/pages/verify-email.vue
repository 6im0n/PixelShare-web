<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

const route = useRoute()
const api = useApi()

const status = ref<'loading' | 'success' | 'error'>('loading')
const message = ref('')

const icon = computed(() => {
  if (status.value === 'success') return 'check_circle'
  if (status.value === 'error') return 'error'
  return 'hourglass_empty'
})
const iconClass = computed(() => {
  if (status.value === 'success') return 'text-emerald-500'
  if (status.value === 'error') return 'text-red-500'
  return 'text-primary'
})
const title = computed(() => {
  if (status.value === 'success') return 'Email verified!'
  if (status.value === 'error') return 'Verification failed'
  return 'Verifying…'
})

onMounted(async () => {
  const token = route.query.token as string | undefined
  if (!token) {
    status.value = 'error'
    message.value = 'No verification token found in the URL.'
    return
  }
  try {
    await api.post('/auth/verify-email', { token })
    status.value = 'success'
    message.value = 'Your email has been verified. You can now sign in.'
  } catch (err: any) {
    status.value = 'error'
    message.value = err?.data?.message ?? 'Invalid or expired verification link.'
  }
})
</script>

<template>
  <UiCard>
    <div class="card-body">
      <span class="material-symbols-outlined icon" :class="iconClass">{{ icon }}</span>
      <h1 class="title">{{ title }}</h1>
      <p class="sub">{{ message || 'Verifying your email…' }}</p>
      <NuxtLink v-if="status !== 'loading'" to="/login" class="login-link">
        Back to sign in
      </NuxtLink>
    </div>
  </UiCard>
</template>

<style scoped>
.card-body { @apply flex flex-col items-center gap-4 py-4 text-center; }
.icon { font-size: 48px !important; }
.title { @apply text-2xl font-extrabold font-headline; }
.sub { @apply text-sm text-on-surface-variant dark:text-white/45 max-w-xs; }
.login-link { @apply text-sm font-semibold text-primary hover:underline mt-2; }
</style>
