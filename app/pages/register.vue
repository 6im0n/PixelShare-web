<script setup lang="ts">
definePageMeta({ layout: 'auth', auth: false, middleware: ['guest'] })

const name       = ref('')
const email      = ref('')
const password   = ref('')
const loading    = ref(false)
const error      = ref('')

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return 0
  let s = 0
  if (p.length >= 8)             s++
  if (/[A-Z]/.test(p))          s++
  if (/[0-9]/.test(p))          s++
  if (/[^A-Za-z0-9]/.test(p))   s++
  return s
})

const strengthLabel = computed(() => ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength.value] ?? '')
const strengthColor = computed(() => ['', 'bg-red-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-400'][passwordStrength.value] ?? '')

const { signIn } = useAuth()
const authStore = useAuthStore()
const config = useRuntimeConfig()

async function handleRegister() {
  if (!name.value || !email.value || !password.value) return
  loading.value = true
  error.value   = ''
  try {
    await $fetch('/auth/register', {
      baseURL: `${config.public.apiBase}/api`,
      method: 'POST',
      body: { name: name.value, email: email.value, password: password.value, role: 'client' },
    })
    await signIn({ email: email.value, password: password.value }, { redirect: false })
    await navigateTo('/')
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Registration failed. Please try again.'
  } finally {
    loading.value = false
  }
}

function handleGoogle() {
  authStore.startGoogleOAuth()
}
</script>

<template>
  <UiCard>
    <!-- Header -->
    <div class="card-header">
      <h1 class="card-title">Create account</h1>
      <p class="card-subtitle">Join PixelShare to start collaborating</p>
    </div>

    <!-- Google button -->
    <UiButton variant="google" size="lg" full @click="handleGoogle">
      <template #icon>
        <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      </template>
      Continue with Google
    </UiButton>

    <!-- Divider -->
    <UiDivider label="or" />

    <!-- Form -->
    <form class="form" @submit.prevent="handleRegister">
      <!-- Error -->
      <Transition name="err">
        <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
      </Transition>

      <!-- Full name -->
      <UiInput
        id="name"
        v-model="name"
        label="Full name"
        type="text"
        icon="person"
        placeholder="Alex Dubois"
        autocomplete="name"
        required
      />

      <!-- Email -->
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

      <!-- Password -->
      <div class="field-password">
        <UiInput
          id="password"
          v-model="password"
          label="Password"
          type="password"
          icon="lock"
          placeholder="Min. 8 characters"
          autocomplete="new-password"
          minlength="8"
          required
        />

        <!-- Password strength -->
        <Transition name="fade">
          <div v-if="password" class="strength-wrap">
            <div class="strength-bar">
              <div
                v-for="i in 4" :key="i"
                class="strength-seg"
                :class="i <= passwordStrength ? strengthColor : 'bg-black/8 dark:bg-white/10'"
              />
            </div>
            <span class="strength-label" :class="strengthColor.replace('bg-', 'text-')">
              {{ strengthLabel }}
            </span>
          </div>
        </Transition>
      </div>

      <!-- Submit -->
      <UiButton
        variant="primary"
        size="lg"
        type="submit"
        full
        :loading="loading"
        :disabled="!name || !email || !password || password.length < 8"
        class="mt-1"
      >
        {{ loading ? 'Creating account…' : 'Create account' }}
      </UiButton>

      <p class="terms-note">
        By creating an account you agree to our
        <a href="#" class="terms-link">Terms of Service</a> and
        <a href="#" class="terms-link">Privacy Policy</a>.
      </p>
    </form>

    <!-- Footer link -->
    <p class="card-footer">
      Already have an account?
      <NuxtLink to="/login" class="auth-link">Sign in</NuxtLink>
    </p>
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

/* Password field + strength bar grouped */
.field-password { @apply flex flex-col gap-1; }

/* Password strength */
.strength-wrap { @apply flex items-center gap-2 mt-1; }

.strength-bar { @apply flex gap-1 flex-1; }

.strength-seg {
  @apply flex-1 h-1 rounded-full transition-colors duration-300;
}

/* bg-black/8 is non-standard in @apply — inline */
.strength-seg:not([class*="bg-red"]):not([class*="bg-amber"]):not([class*="bg-blue"]):not([class*="bg-emerald"]) {
  background-color: rgba(0, 0, 0, 0.08);
}

.dark .strength-seg:not([class*="bg-red"]):not([class*="bg-amber"]):not([class*="bg-blue"]):not([class*="bg-emerald"]) {
  background-color: rgba(255, 255, 255, 0.10);
}

.strength-label {
  @apply text-[10px] font-bold uppercase tracking-wide w-10 text-right flex-shrink-0;
}

.terms-note {
  @apply text-[11px] text-center text-on-surface-variant/45 dark:text-white/25 leading-relaxed;
}

.terms-link {
  @apply text-on-surface-variant/65 dark:text-white/40 underline;
  @apply hover:text-primary dark:hover:text-primary-fixed-dim transition-colors;
}

.card-footer {
  @apply text-center text-xs text-on-surface-variant/60 dark:text-white/35;
}

.auth-link {
  @apply text-primary dark:text-primary-fixed-dim font-semibold;
  @apply hover:underline transition-colors;
}

/* Transitions */
.err-enter-active, .err-leave-active { transition: all 0.2s ease; }
.err-enter-from, .err-leave-to { opacity: 0; transform: translateY(-4px); }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
