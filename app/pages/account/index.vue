<script setup lang="ts">
definePageMeta({ layout: 'library' })

const { updateName, updateEmail, updatePassword } = useAccount()

const { data, signOut } = useAuth()
const initialName = computed(() => data.value?.name ?? '')
const initialEmail = computed(() => data.value?.email ?? '')

type Feedback = { variant: 'success' | 'error'; message: string } | null

const name           = ref(data.value?.name ?? '')
const nameLoading    = ref(false)
const nameFeedback   = ref<Feedback>(null)

const email          = ref(data.value?.email ?? '')
const emailLoading   = ref(false)
const emailFeedback  = ref<Feedback>(null)

const currentPass    = ref('')
const newPass        = ref('')
const confirmPass    = ref('')
const passLoading    = ref(false)
const passFeedback   = ref<Feedback>(null)

const initials = computed(() => {
  const source = name.value.trim() || data.value?.name || data.value?.email || ''
  return source.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
})

const nameDirty   = computed(() => name.value.trim() !== initialName.value.trim())
const emailDirty  = computed(() => email.value.trim() !== initialEmail.value.trim())
const passReady   = computed(() => Boolean(currentPass.value && newPass.value && confirmPass.value))

async function saveName() {
  nameFeedback.value = null
  nameLoading.value = true
  try {
    await updateName(name.value)
    nameFeedback.value = { variant: 'success', message: 'Name updated.' }
  } catch (err) {
    nameFeedback.value = { variant: 'error', message: (err as Error).message }
  } finally {
    nameLoading.value = false
  }
}

async function saveEmail() {
  emailFeedback.value = null
  emailLoading.value = true
  try {
    await updateEmail(email.value)
    emailFeedback.value = {
      variant: 'success',
      message: 'Check your inbox to confirm your new address.',
    }
  } catch (err) {
    emailFeedback.value = { variant: 'error', message: (err as Error).message }
  } finally {
    emailLoading.value = false
  }
}

async function savePassword() {
  passFeedback.value = null
  passLoading.value = true
  try {
    await updatePassword({
      current: currentPass.value,
      next:    newPass.value,
      confirm: confirmPass.value,
    })
    passFeedback.value = { variant: 'success', message: 'Password updated.' }
    currentPass.value = ''
    newPass.value     = ''
    confirmPass.value = ''
  } catch (err) {
    passFeedback.value = { variant: 'error', message: (err as Error).message }
  } finally {
    passLoading.value = false
  }
}
</script>

<template>
  <div class="account">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">
        <span class="material-symbols-outlined" style="font-size:18px">arrow_back</span>
      </button>
      <div class="avatar-large" aria-hidden="true">{{ initials || '·' }}</div>
      <div class="page-titles">
        <h1 class="page-title">Account</h1>
        <p class="page-sub">Manage your profile, sign-in email, and password.</p>
      </div>
    </header>

    <div class="sections">
      <!-- Profile ──────────────────────────────────────────────────── -->
      <UiCard max-width="full" padding="p-6 sm:p-8">
        <div class="section-head">
          <h2 class="section-title">Profile</h2>
          <p class="section-sub">The name shown to photographers and models you collaborate with.</p>
        </div>

        <UiDivider />

        <form class="form" @submit.prevent="saveName">
          <Transition name="fb">
            <UiAlert v-if="nameFeedback" :variant="nameFeedback.variant">
              {{ nameFeedback.message }}
            </UiAlert>
          </Transition>

          <UiInput
            id="account-name"
            v-model="name"
            label="Display name"
            icon="person"
            placeholder="Your full name"
            autocomplete="name"
            required
          />

          <div class="form-actions">
            <UiButton
              variant="primary"
              type="submit"
              :loading="nameLoading"
              :disabled="!nameDirty || !name.trim()"
            >
              {{ nameLoading ? 'Saving…' : 'Save changes' }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- Email ────────────────────────────────────────────────────── -->
      <UiCard max-width="full" padding="p-6 sm:p-8">
        <div class="section-head">
          <h2 class="section-title">Email</h2>
          <p class="section-sub">
            Used to sign in and receive notifications. A confirmation link may be sent
            to your new address before the change takes effect.
          </p>
        </div>

        <UiDivider />

        <form class="form" @submit.prevent="saveEmail">
          <Transition name="fb">
            <UiAlert v-if="emailFeedback" :variant="emailFeedback.variant">
              {{ emailFeedback.message }}
            </UiAlert>
          </Transition>

          <UiInput
            id="account-email"
            v-model="email"
            label="Email address"
            type="email"
            icon="mail"
            placeholder="you@example.com"
            autocomplete="email"
            required
          />

          <div class="form-actions">
            <UiButton
              variant="primary"
              type="submit"
              :loading="emailLoading"
              :disabled="!emailDirty || !email.trim()"
            >
              {{ emailLoading ? 'Saving…' : 'Update email' }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- Password ─────────────────────────────────────────────────── -->
      <UiCard max-width="full" padding="p-6 sm:p-8">
        <div class="section-head">
          <h2 class="section-title">Password</h2>
          <p class="section-sub">Use at least 8 characters. You'll stay signed in on this device.</p>
        </div>

        <UiDivider />

        <form class="form" @submit.prevent="savePassword">
          <Transition name="fb">
            <UiAlert v-if="passFeedback" :variant="passFeedback.variant">
              {{ passFeedback.message }}
            </UiAlert>
          </Transition>

          <UiInput
            id="account-current-pass"
            v-model="currentPass"
            label="Current password"
            type="password"
            icon="lock"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />

          <div class="grid-two">
            <UiInput
              id="account-new-pass"
              v-model="newPass"
              label="New password"
              type="password"
              icon="key"
              placeholder="At least 8 characters"
              autocomplete="new-password"
              minlength="8"
              required
            />
            <UiInput
              id="account-confirm-pass"
              v-model="confirmPass"
              label="Confirm new password"
              type="password"
              icon="key"
              placeholder="Repeat new password"
              autocomplete="new-password"
              minlength="8"
              required
            />
          </div>

          <div class="form-actions">
            <UiButton
              variant="primary"
              type="submit"
              :loading="passLoading"
              :disabled="!passReady"
            >
              {{ passLoading ? 'Updating…' : 'Update password' }}
            </UiButton>
          </div>
        </form>
      </UiCard>

      <!-- Session ─────────────────────────────────────────────────── -->
      <UiCard max-width="full" padding="p-6 sm:p-8">
        <div class="section-head">
          <h2 class="section-title">Session</h2>
          <p class="section-sub">Sign out of your account on this device.</p>
        </div>

        <UiDivider />

        <div class="form-actions">
          <UiButton
            variant="ghost"
            icon="logout"
            @click="signOut({ callbackUrl: '/login' })"
          >
            Sign out
          </UiButton>
        </div>
      </UiCard>
    </div>
  </div>
</template>

<style scoped>
.account {
  @apply mx-auto w-full max-w-3xl pt-4 pb-12;
  @apply flex flex-col gap-8;
}

.page-header {
  @apply flex items-center gap-4;
}

.back-btn {
  @apply p-2 rounded-lg text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/5 transition-colors;
}

.avatar-large {
  @apply w-14 h-14 rounded-full bg-primary/15 text-primary;
  @apply flex items-center justify-center font-headline font-bold text-xl;
  @apply ring-1 ring-inset ring-primary/20;
}

.page-titles { @apply flex flex-col gap-0.5; }

.page-title {
  @apply text-2xl sm:text-3xl font-headline font-extrabold tracking-tight;
  @apply text-on-surface dark:text-white;
}

.page-sub {
  @apply text-sm text-on-surface-variant dark:text-white/55;
}

.sections {
  @apply flex flex-col gap-5 sm:gap-6;
}

.section-head { @apply flex flex-col gap-1; }

.section-title {
  @apply text-lg font-headline font-bold tracking-tight;
  @apply text-on-surface dark:text-white;
}

.section-sub {
  @apply text-sm text-on-surface-variant dark:text-white/50;
}

.form { @apply flex flex-col gap-4; }

.grid-two {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.form-actions {
  @apply flex justify-end pt-1;
}

/* Feedback transition */
.fb-enter-active, .fb-leave-active { transition: all 0.2s ease; }
.fb-enter-from, .fb-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
