<script setup lang="ts">
import AddMemberControls, { type PickedMember, type InvitedMember } from '~/components/collection/AddMemberControls.vue'

definePageMeta({ layout: 'library' })

const { isPhotographer } = useRole()
const { data, status } = useAuth()

watchEffect(() => {
  if (status.value === 'loading' || !data.value) return
  if (!isPhotographer.value) navigateTo('/')
})

const { createCollection } = useCollections()

// ─── Form state ────────────────────────────────────────────────────────────
const name        = ref('')
const description = ref('')
const submitting  = ref(false)
const formError   = ref('')
const nameError   = ref('')

interface DraftMember {
  key:           string
  userId?:       string
  invitationId?: string
  name:          string
  email?:        string
  avatarUrl?:    string
  hint?:         string
  readyToShare:  boolean
}

const members = ref<DraftMember[]>([])
const showAddPanel = ref(true)

const excludeUserIds = computed(() =>
  members.value.map(m => m.userId).filter((v): v is string => Boolean(v))
)

const excludeInvitationIds = computed(() =>
  members.value.map(m => m.invitationId).filter((v): v is string => Boolean(v))
)

function newKey() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function onPick(payload: PickedMember) {
  members.value = [{
    key:          newKey(),
    userId:       payload.userId,
    invitationId: payload.invitationId,
    name:         payload.name,
    email:        payload.email,
    avatarUrl:    payload.avatarUrl,
    hint:         payload.invitationId && !payload.userId
      ? 'Pending invitation — will be re-attached to this collection'
      : undefined,
    readyToShare: false,
  }]
  showAddPanel.value = false
}

function onInvite(payload: InvitedMember) {
  members.value = [{
    key:          newKey(),
    invitationId: payload.invitationId,
    email:        payload.email,
    name:         payload.name,
    hint:         'Will be invited by email when collection is created',
    readyToShare: false,
  }]
  showAddPanel.value = false
}

function removeMember(key: string) {
  members.value = members.value.filter(m => m.key !== key)
}

// ─── Submit ───────────────────────────────────────────────────────────────
async function handleSubmit() {
  formError.value = ''
  nameError.value = ''

  const trimmed = name.value.trim()
  if (trimmed.length < 2) {
    nameError.value = 'Please give your collection a name (min 2 characters).'
    return
  }

  submitting.value = true
  try {
    const { id, failedMembers } = await createCollection({
      name:        trimmed,
      description: description.value.trim() || undefined,
      members: members.value.map(m => ({
        userId:       m.userId,
        invitationId: m.invitationId,
        email:        m.email,
        name:         m.name,
        readyToShare: m.readyToShare,
      })),
    })
    if (failedMembers.length) {
      const names = failedMembers.map(f => f.name).join(', ')
      formError.value = `Collection created, but could not add: ${names}. You can retry from the library page.`
    }
    await navigateTo(`/libraries/${id}`)
  } catch (err: unknown) {
    formError.value = err instanceof Error ? err.message : 'Could not create the collection.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page">
    <header class="page-header">
      <h1 class="page-title">New collection</h1>
      <p class="page-desc">
        Create a folder for a shoot and decide who can see it. You can always invite more models later.
      </p>
    </header>

    <form class="form" @submit.prevent="handleSubmit">
      <Transition name="form-err">
        <UiAlert v-if="formError" variant="error">{{ formError }}</UiAlert>
      </Transition>

      <!-- Section: details -->
      <section class="section">
        <h2 class="section-title">Details</h2>

        <UiInput
          id="collection-name"
          v-model="name"
          label="Collection name"
          icon="collections_bookmark"
          placeholder="Spring editorial — Mira"
          :error="nameError"
          maxlength="80"
          required
        />

        <div class="field">
          <label for="collection-desc" class="field-label">Description (optional)</label>
          <textarea
            id="collection-desc"
            v-model="description"
            rows="3"
            class="textarea"
            placeholder="Set the scene — location, brief, expectations…"
            maxlength="500"
          />
        </div>
      </section>

      <UiDivider />

      <!-- Section: members -->
      <section class="section">
        <div class="section-head">
          <div>
            <h2 class="section-title">Members</h2>
            <p class="section-hint">
              Add the model now or skip — they only see the collection once you toggle <strong>Ready to share</strong>.
            </p>
          </div>
          <UiButton
            v-if="!showAddPanel"
            variant="secondary"
            size="sm"
            icon="person_add"
            @click="showAddPanel = true"
          >
            Add a model
          </UiButton>
        </div>

        <!-- Members list -->
        <ul v-if="members.length > 0" class="member-list">
          <li v-for="m in members" :key="m.key">
            <CollectionMemberRow
              :name="m.name"
              :email="m.email"
              :avatar-url="m.avatarUrl"
              :hint="m.hint"
              :ready-to-share="m.readyToShare"
              @update:ready-to-share="m.readyToShare = $event"
              @remove="removeMember(m.key)"
            />
          </li>
        </ul>

        <!-- Add controls -->
        <div v-if="showAddPanel" class="add-panel">
          <AddMemberControls
            :exclude-user-ids="excludeUserIds"
            :exclude-invitation-ids="excludeInvitationIds"
            @pick="onPick"
            @invite="onInvite"
            @skip="showAddPanel = false"
          />
        </div>
      </section>

      <!-- Actions -->
      <div class="actions">
        <UiButton
          variant="ghost"
          size="lg"
          type="button"
          :disabled="submitting"
          @click="navigateTo('/')"
        >
          Cancel
        </UiButton>
        <UiButton
          variant="primary"
          size="lg"
          type="submit"
          icon="check"
          :loading="submitting"
          :disabled="!name.trim() || submitting"
        >
          {{ submitting ? 'Creating…' : 'Create collection' }}
        </UiButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
.page {
  @apply mx-auto w-full max-w-3xl flex flex-col gap-6 sm:gap-10;
}

.page-header { @apply flex flex-col gap-1.5; }

.page-title {
  @apply text-2xl sm:text-4xl font-extrabold font-headline tracking-tight;
  @apply text-on-surface dark:text-slate-100;
}

.page-desc {
  @apply text-sm sm:text-base font-body;
  @apply text-on-surface-variant dark:text-slate-400;
}

.form { @apply flex flex-col gap-6 sm:gap-8; }

.section { @apply flex flex-col gap-4; }

.section-head {
  @apply flex items-start justify-between gap-3;
}

.section-title {
  @apply text-lg sm:text-xl font-headline font-bold;
  @apply text-on-surface dark:text-slate-100;
}

.section-hint {
  @apply text-xs sm:text-sm mt-0.5;
  @apply text-on-surface-variant/85 dark:text-slate-400;
}

/* Textarea (mirrors UiInput styling) */
.field { @apply flex flex-col gap-1.5; }

.field-label {
  @apply text-xs font-semibold tracking-wide;
  @apply text-on-surface dark:text-white/70;
}

.textarea {
  @apply w-full px-4 py-3 rounded-xl text-sm font-body resize-none;
  @apply text-on-surface dark:text-white outline-none transition-all duration-200;
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.10);
}
.dark .textarea {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.10);
}
.textarea::placeholder {
  @apply text-on-surface-variant/35 dark:text-white/20;
}
.textarea:focus {
  border-color: #0058bc;
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.15);
  background: rgba(255, 255, 255, 0.9);
}
.dark .textarea:focus {
  border-color: rgba(173, 198, 255, 0.7);
  box-shadow: 0 0 0 3px rgba(0, 88, 188, 0.25);
  background: rgba(255, 255, 255, 0.08);
}

.member-list {
  @apply flex flex-col gap-2;
}

.add-panel {
  @apply p-4 sm:p-5 rounded-3xl;
  @apply bg-surface-container-low/60 dark:bg-white/5;
  @apply border border-outline-variant/20 dark:border-white/10;
}

.actions {
  @apply flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2;
}

/* Transitions */
.form-err-enter-active, .form-err-leave-active { transition: all 0.2s ease; }
.form-err-enter-from, .form-err-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
