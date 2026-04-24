<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false })

const { getSession } = useAuth()
const tokenCookie = useCookie('auth.token')
const refreshTokenCookie = useCookie('auth.refresh-token')
const error = ref<string | null>(null)

onMounted(async () => {
  const frag = window.location.hash.replace(/^#/, '')
  const params = new URLSearchParams(frag)
  const accessToken = params.get('accessToken')
  const rt = params.get('refreshToken')
  if (!accessToken || !rt) {
    error.value = 'Missing OAuth tokens in callback.'
    return
  }
  tokenCookie.value = accessToken
  refreshTokenCookie.value = rt
  window.history.replaceState({}, '', '/oauth/callback')
  await getSession()
  await navigateTo('/')
})
</script>

<template>
  <UiCard>
    <div class="card-header">
      <h1 class="card-title">Signing you in…</h1>
      <p class="card-subtitle">Please wait while we complete the Google sign-in.</p>
    </div>
    <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
  </UiCard>
</template>

<style scoped>
.card-header { @apply flex flex-col gap-1; }
.card-title { @apply text-2xl font-extrabold font-headline tracking-tight; }
.card-subtitle { @apply text-sm text-on-surface-variant dark:text-white/45; }
</style>
