<script setup lang="ts">
import type { User } from '~/types'

type Mode = 'pick' | 'invite' | 'skip'

export interface PickedMember {
  userId: string
  name:   string
  email:  string
  avatarUrl?: string
}

export interface InvitedMember {
  invitationToken: string
  name:            string
  url:             string
}

const props = defineProps<{
  /** User ids already added to the collection (hidden from the picker). */
  excludeUserIds?: string[]
  /** Library id passed to invitation creation when the collection already exists. */
  libraryId?: string
  /** Compact layout for use inside modals / popovers. */
  compact?: boolean
}>()

const emit = defineEmits<{
  'pick':   [member: PickedMember]
  'invite': [member: InvitedMember]
  'skip':   []
}>()

const { listKnownModels, inviteModel } = useModels()

const mode  = ref<Mode>('pick')
const error = ref('')

const knownModels = ref<User[]>([])
const loadingKnown = ref(false)
const search = ref('')

const filteredModels = computed(() => {
  const exclude = new Set(props.excludeUserIds ?? [])
  const q = search.value.trim().toLowerCase()
  return knownModels.value
    .filter(m => !exclude.has(m.id))
    .filter(m => !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
})

async function loadKnownModels() {
  loadingKnown.value = true
  try {
    knownModels.value = await listKnownModels()
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Could not load models.'
  } finally {
    loadingKnown.value = false
  }
}
onMounted(loadKnownModels)

function pick(model: User) {
  emit('pick', {
    userId: model.id,
    name:   model.name,
    email:  model.email,
    avatarUrl: model.avatarUrl,
  })
}

// ─── Invite flow ──────────────────────────────────────────────────────────
const inviteEmail = ref('')
const inviteName  = ref('')
const inviting    = ref(false)
const inviteSent  = ref(false)

async function submitInvite() {
  error.value = ''
  if (!inviteEmail.value) {
    error.value = 'Please enter an email address.'
    return
  }
  inviting.value = true
  try {
    await inviteModel(inviteEmail.value, inviteName.value || undefined)
    inviteSent.value = true
    emit('invite', { invitationToken: '', name: inviteName.value.trim() || inviteEmail.value, url: '' })
    inviteEmail.value = ''
    inviteName.value  = ''
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Could not generate invitation link.'
  } finally {
    inviting.value = false
  }
}

function chooseMode(next: Mode) {
  error.value = ''
  mode.value = next
  if (next === 'skip') emit('skip')
}
</script>

<template>
  <div class="add-controls" :class="compact && 'add-controls--compact'">
    <!-- Mode selector -->
    <div class="mode-row" role="tablist">
      <UiButton
        variant="chip"
        :active="mode === 'pick'"
        icon="person_search"
        @click="chooseMode('pick')"
      >
        Pick existing
      </UiButton>
      <UiButton
        variant="chip"
        :active="mode === 'invite'"
        icon="mail"
        @click="chooseMode('invite')"
      >
        Invite new
      </UiButton>
      <UiButton
        variant="chip"
        :active="mode === 'skip'"
        icon="block"
        @click="chooseMode('skip')"
      >
        Skip
      </UiButton>
    </div>

    <Transition name="add-err">
      <UiAlert v-if="error" variant="error">{{ error }}</UiAlert>
    </Transition>

    <!-- Pick existing model -->
    <div v-if="mode === 'pick'" class="pane">
      <UiInput
        v-model="search"
        icon="search"
        placeholder="Search models by name or email"
      />

      <div v-if="loadingKnown" class="hint">Loading models…</div>

      <div v-else-if="filteredModels.length === 0" class="hint">
        No matching models. Try inviting a new one.
      </div>

      <ul v-else class="model-list">
        <li v-for="model in filteredModels" :key="model.id">
          <button type="button" class="model-btn" @click="pick(model)">
            <span class="model-avatar">
              <img v-if="model.avatarUrl" :src="model.avatarUrl" :alt="model.name" />
              <span v-else>{{ model.name.charAt(0).toUpperCase() }}</span>
            </span>
            <span class="model-text">
              <span class="model-name">{{ model.name }}</span>
              <span class="model-email">{{ model.email }}</span>
            </span>
            <span class="material-symbols-outlined model-add" aria-hidden="true">add</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Invite new model -->
    <form v-else-if="mode === 'invite'" class="pane" @submit.prevent="submitInvite">
      <UiAlert v-if="inviteSent" variant="success">Invitation sent! They'll receive an email with a sign-up link.</UiAlert>
      <UiInput
        v-model="inviteEmail"
        label="Email address"
        type="email"
        icon="mail"
        placeholder="model@example.com"
        autocomplete="email"
        required
      />
      <UiInput
        v-model="inviteName"
        label="Name (optional)"
        icon="person_add"
        placeholder="Casey Rivera"
        autocomplete="off"
      />
      <UiButton
        type="submit"
        variant="primary"
        size="md"
        icon="send"
        :loading="inviting"
        :disabled="!inviteEmail"
      >
        Send invitation email
      </UiButton>
      <p class="hint">They'll receive a sign-up link by email.</p>
    </form>

    <!-- Skip -->
    <div v-else class="pane">
      <p class="hint">No member will be added. You can always add one later from the collection page.</p>
    </div>
  </div>
</template>

<style scoped>
.add-controls {
  @apply flex flex-col gap-4;
}
.add-controls--compact { @apply gap-3; }

.mode-row {
  @apply flex flex-wrap gap-2;
}

.pane {
  @apply flex flex-col gap-3;
}

.hint {
  @apply text-xs text-on-surface-variant/80 dark:text-slate-400;
}

/* Model list */
.model-list {
  @apply flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1;
}

.model-btn {
  @apply w-full flex items-center gap-3 px-2.5 py-2 rounded-2xl text-left;
  @apply bg-surface-container-low/60 dark:bg-white/5;
  @apply border border-outline-variant/15 dark:border-white/10;
  @apply hover:bg-surface-container dark:hover:bg-white/10;
  @apply transition-colors;
}

.model-avatar {
  @apply w-9 h-9 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0;
  @apply bg-primary-container/40 dark:bg-primary/30;
  @apply text-on-primary-container dark:text-on-primary text-sm font-bold font-headline;
}
.model-avatar img { @apply w-full h-full object-cover; }

.model-text { @apply flex flex-col min-w-0 flex-1; }

.model-name {
  @apply text-sm font-semibold truncate text-on-surface dark:text-slate-100;
}

.model-email {
  @apply text-xs truncate text-on-surface-variant/80 dark:text-slate-400;
}

.model-add {
  @apply text-on-surface-variant/60 dark:text-slate-500;
  font-size: 18px !important;
}

.model-btn:hover .model-add {
  @apply text-primary dark:text-primary-fixed-dim;
}

/* Transitions */
.add-err-enter-active, .add-err-leave-active { transition: all 0.2s ease; }
.add-err-enter-from, .add-err-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
