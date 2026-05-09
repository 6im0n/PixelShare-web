let onboardingChecked = false
let onboardingRequired = false

const SKIP = new Set(['/setup', '/verify-email', '/oauth/callback'])

export default defineNuxtRouteMiddleware(async (to) => {
  if (!import.meta.client) return
  if (SKIP.has(to.path)) return

  if (!onboardingChecked) {
    try {
      const config = useRuntimeConfig()
      const status = await $fetch<{ required: boolean }>('/onboarding/status', {
        baseURL: `${config.public.apiBase}/api`,
      })
      onboardingRequired = status.required
      onboardingChecked = true
    } catch {
      onboardingChecked = true
    }
  }
  if (onboardingRequired) return navigateTo('/setup')
})
