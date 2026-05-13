<script setup lang="ts">
import type { ApiClient } from '~/composables/useModels'
import type { Invitation } from '~/composables/useInvitations'

definePageMeta({ layout: 'default' })

const { isAdmin } = useRole()
watchEffect(() => { if (!isAdmin.value) navigateTo('/') })

const api = useApi()
const invitationsApi = useInvitations()

// ── Users ─────────────────────────────────────────────────────────────────
interface AdminUser extends ApiClient {
  sharedLibraries?: Array<{ id: string; name: string; grantedAt: string }>
}

const users = ref<AdminUser[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    users.value = await api.get<AdminUser[]>('/account/users')
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to load users.'
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)

const clients = computed(() => users.value.filter(u => u.role === 'client'))
const staff   = computed(() => users.value.filter(u => u.role !== 'client'))

// ── Detail drawer ─────────────────────────────────────────────────────────
const selected = ref<AdminUser | null>(null)
const detailLoading = ref(false)

async function openDetail(user: AdminUser) {
  selected.value = user
  if (!user.sharedLibraries) {
    detailLoading.value = true
    try {
      const libs = await api.get<Array<{ id: string; name: string; grantedAt: string }>>(`/account/users/${user.id}/libraries`)
      const idx = users.value.findIndex(u => u.id === user.id)
      if (idx !== -1) users.value[idx] = { ...users.value[idx]!, sharedLibraries: libs }
      selected.value = users.value[idx] ?? selected.value
    } catch { /* ignore */ } finally {
      detailLoading.value = false
    }
  }
}

// ── Delete ────────────────────────────────────────────────────────────────
const deleteTarget = ref<AdminUser | null>(null)
const deleting = ref(false)

async function confirmDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  try {
    await api.delete(`/account/users/${deleteTarget.value.id}`)
    users.value = users.value.filter(u => u.id !== deleteTarget.value!.id)
    if (selected.value?.id === deleteTarget.value.id) selected.value = null
    deleteTarget.value = null
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Delete failed.'
  } finally {
    deleting.value = false
  }
}

// ── Invitations ───────────────────────────────────────────────────────────
const invitations = ref<Invitation[]>([])
const invitationsLoading = ref(false)

async function loadInvitations() {
  invitationsLoading.value = true
  try {
    invitations.value = await invitationsApi.list()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to load invitations.'
  } finally {
    invitationsLoading.value = false
  }
}

onMounted(loadInvitations)

const pendingInvitations = computed(() =>
  invitations.value.filter(i => i.status === 'pending' || i.status === 'expired'),
)

const showInvite = ref(false)
const inviteEmail = ref('')
const inviteName  = ref('')
const inviting    = ref(false)
const inviteFeedback = ref<{ kind: 'success' | 'error'; text: string } | null>(null)

async function sendInvite() {
  if (!inviteEmail.value || inviteName.value.trim().length < 2) return
  inviting.value = true
  inviteFeedback.value = null
  try {
    const inv = await invitationsApi.create({
      email: inviteEmail.value,
      name: inviteName.value,
    })
    invitations.value = [inv, ...invitations.value]
    inviteFeedback.value = { kind: 'success', text: `Invitation sent to ${inv.email}.` }
    inviteEmail.value = ''
    inviteName.value  = ''
  } catch (e: any) {
    inviteFeedback.value = { kind: 'error', text: e?.data?.message ?? 'Failed to send invite.' }
  } finally {
    inviting.value = false
  }
}

const busyInvitationId = ref<string | null>(null)

async function resendInvitation(inv: Invitation) {
  busyInvitationId.value = inv.id
  try {
    await invitationsApi.resend(inv.id)
    await loadInvitations()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to resend.'
  } finally {
    busyInvitationId.value = null
  }
}

async function revokeInvitation(inv: Invitation) {
  if (!confirm(`Revoke invitation for ${inv.email}? The code stops working immediately.`)) return
  busyInvitationId.value = inv.id
  try {
    await invitationsApi.revoke(inv.id)
    invitations.value = invitations.value.filter(i => i.id !== inv.id)
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to revoke.'
  } finally {
    busyInvitationId.value = null
  }
}

function fmt(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}
function initials(name: string, email: string) {
  const src = name || email
  return src.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
}
</script>

<template>
  <div class="admin">
    <!-- Header -->
    <header class="page-header">
      <div>
        <h1 class="page-title">Admin — Users</h1>
        <p class="page-sub">{{ users.length }} account{{ users.length !== 1 ? 's' : '' }} total</p>
      </div>
      <UiButton variant="primary" icon="mail" @click="showInvite = true">
        Invite model
      </UiButton>
    </header>

    <UiAlert v-if="error" variant="error" class="mb-4">{{ error }}</UiAlert>

    <!-- Loading -->
    <div v-if="loading" class="hint">Loading…</div>

    <template v-else>
      <!-- Models section -->
      <section class="section">
        <h2 class="section-title">
          <span class="material-symbols-outlined" style="font-size:18px">person</span>
          Models ({{ clients.length }})
        </h2>

        <div v-if="clients.length === 0" class="hint">No models yet.</div>

        <ul class="user-list">
          <li v-for="u in clients" :key="u.id" class="user-row" @click="openDetail(u)">
            <span class="avatar">{{ initials(u.name, u.email) }}</span>
            <div class="user-info">
              <span class="user-name">{{ u.name }}</span>
              <span class="user-email">{{ u.email }}</span>
            </div>
            <div class="user-meta">
              <span class="meta-chip" :class="u.emailVerified ? 'meta-chip--ok' : 'meta-chip--warn'">
                {{ u.emailVerified ? 'Verified' : 'Unverified' }}
              </span>
              <span class="meta-date">Joined {{ fmt(u.createdAt) }}</span>
            </div>
            <button
              class="delete-btn"
              title="Delete account"
              @click.stop="deleteTarget = u"
            >
              <span class="material-symbols-outlined" style="font-size:18px">delete</span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Pending invitations section -->
      <section class="section">
        <h2 class="section-title">
          <span class="material-symbols-outlined" style="font-size:18px">mail</span>
          Pending invitations ({{ pendingInvitations.length }})
        </h2>

        <div v-if="invitationsLoading" class="hint">Loading…</div>
        <div v-else-if="pendingInvitations.length === 0" class="hint">No pending invitations.</div>

        <ul v-else class="user-list">
          <li v-for="inv in pendingInvitations" :key="inv.id" class="user-row user-row--staff">
            <span class="avatar avatar--pending">{{ initials(inv.name, inv.email) }}</span>
            <div class="user-info">
              <span class="user-name">{{ inv.name }}</span>
              <span class="user-email">{{ inv.email }}</span>
            </div>
            <div class="user-meta">
              <span class="meta-chip" :class="inv.status === 'expired' ? 'meta-chip--warn' : 'meta-chip--pending'">
                {{ inv.status === 'expired' ? 'Expired' : 'Pending' }}
              </span>
              <span class="invitation-code">{{ inv.code }}</span>
              <span class="meta-date">Expires {{ fmt(inv.expiresAt) }}</span>
            </div>
            <div class="invitation-actions">
              <button
                class="action-btn"
                title="Resend email"
                :disabled="busyInvitationId === inv.id"
                @click.stop="resendInvitation(inv)"
              >
                <span class="material-symbols-outlined" style="font-size:18px">send</span>
              </button>
              <button
                class="action-btn action-btn--danger"
                title="Revoke"
                :disabled="busyInvitationId === inv.id"
                @click.stop="revokeInvitation(inv)"
              >
                <span class="material-symbols-outlined" style="font-size:18px">close</span>
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Staff section -->
      <section class="section">
        <h2 class="section-title">
          <span class="material-symbols-outlined" style="font-size:18px">admin_panel_settings</span>
          Staff ({{ staff.length }})
        </h2>
        <ul class="user-list">
          <li v-for="u in staff" :key="u.id" class="user-row user-row--staff">
            <span class="avatar avatar--staff">{{ initials(u.name, u.email) }}</span>
            <div class="user-info">
              <span class="user-name">{{ u.name }}</span>
              <span class="user-email">{{ u.email }}</span>
            </div>
            <div class="user-meta">
              <span class="meta-chip meta-chip--role">{{ u.role }}</span>
              <span class="meta-date">Joined {{ fmt(u.createdAt) }}</span>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <!-- ── Detail drawer ───────────────────────────────────────────────── -->
    <Transition name="drawer">
      <div v-if="selected" class="drawer-backdrop" @click.self="selected = null">
        <aside class="drawer">
          <button class="drawer-close" aria-label="Close" @click="selected = null">
            <span class="material-symbols-outlined">close</span>
          </button>

          <div class="drawer-avatar">{{ initials(selected.name, selected.email) }}</div>
          <h2 class="drawer-name">{{ selected.name }}</h2>
          <p class="drawer-email">{{ selected.email }}</p>

          <dl class="drawer-dl">
            <dt>Role</dt>
            <dd><span class="meta-chip meta-chip--role">{{ selected.role }}</span></dd>
            <dt>Joined</dt>
            <dd>{{ fmt(selected.createdAt) }}</dd>
            <dt>Last login</dt>
            <dd>{{ fmt(selected.lastLoginAt) }}</dd>
            <dt>Email</dt>
            <dd>
              <span class="meta-chip" :class="selected.emailVerified ? 'meta-chip--ok' : 'meta-chip--warn'">
                {{ selected.emailVerified ? 'Verified' : 'Unverified' }}
              </span>
            </dd>
          </dl>

          <div class="drawer-section">
            <h3 class="drawer-sub">Shared libraries</h3>
            <div v-if="detailLoading" class="hint">Loading…</div>
            <div v-else-if="!selected.sharedLibraries?.length" class="hint">No libraries shared.</div>
            <ul v-else class="lib-list">
              <li v-for="lib in selected.sharedLibraries" :key="lib.id" class="lib-item">
                <span class="material-symbols-outlined" style="font-size:16px;color:var(--color-primary)">photo_library</span>
                <div>
                  <p class="lib-name">{{ lib.name }}</p>
                  <p class="lib-date">Granted {{ fmt(lib.grantedAt) }}</p>
                </div>
              </li>
            </ul>
          </div>

          <UiButton
            variant="danger"
            icon="delete"
            full
            class="mt-auto"
            @click="deleteTarget = selected; selected = null"
          >
            Delete account
          </UiButton>
        </aside>
      </div>
    </Transition>

    <!-- ── Delete confirm ──────────────────────────────────────────────── -->
    <Transition name="drawer">
      <div v-if="deleteTarget" class="drawer-backdrop" @click.self="deleteTarget = null">
        <aside class="drawer drawer--sm">
          <h2 class="drawer-name">Delete account?</h2>
          <p class="hint">
            <strong>{{ deleteTarget.name }}</strong> ({{ deleteTarget.email }}) will be permanently removed.
            This cannot be undone.
          </p>
          <div class="confirm-actions">
            <UiButton variant="ghost" :disabled="deleting" @click="deleteTarget = null">Cancel</UiButton>
            <UiButton variant="danger" :loading="deleting" @click="confirmDelete">Delete</UiButton>
          </div>
        </aside>
      </div>
    </Transition>

    <!-- ── Invite modal ────────────────────────────────────────────────── -->
    <Transition name="drawer">
      <div v-if="showInvite" class="drawer-backdrop" @click.self="showInvite = false">
        <aside class="drawer drawer--sm">
          <h2 class="drawer-name">Invite a model</h2>
          <p class="hint">They'll receive an email with a unique 8-character code to sign up. The code expires in 7 days.</p>

          <Transition name="fb">
            <UiAlert v-if="inviteFeedback" :variant="inviteFeedback.kind" class="mb-1">
              {{ inviteFeedback.text }}
            </UiAlert>
          </Transition>

          <form class="invite-form" @submit.prevent="sendInvite">
            <UiInput
              v-model="inviteEmail"
              label="Email address"
              type="email"
              icon="mail"
              placeholder="model@example.com"
              required
            />
            <UiInput
              v-model="inviteName"
              label="Name"
              icon="person"
              placeholder="Casey Rivera"
              required
            />
            <p class="invite-hint">The model can change their name when registering.</p>
            <div class="confirm-actions">
              <UiButton variant="ghost" type="button" @click="showInvite = false">Cancel</UiButton>
              <UiButton
                variant="primary"
                type="submit"
                icon="send"
                :loading="inviting"
                :disabled="!inviteEmail || inviteName.trim().length < 2"
              >
                Send invite
              </UiButton>
            </div>
          </form>
        </aside>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin {
  @apply mx-auto w-full max-w-4xl pt-4 pb-16 flex flex-col gap-8;
}

.page-header {
  @apply flex items-center justify-between gap-4;
}

.page-title {
  @apply text-2xl sm:text-3xl font-headline font-extrabold tracking-tight;
  @apply text-on-surface dark:text-white;
}

.page-sub {
  @apply text-sm text-on-surface-variant dark:text-white/50 mt-0.5;
}

.section { @apply flex flex-col gap-3; }

.section-title {
  @apply flex items-center gap-2 text-base font-headline font-bold;
  @apply text-on-surface dark:text-white;
}

.hint {
  @apply text-sm text-on-surface-variant dark:text-white/40;
}

/* User list */
.user-list { @apply flex flex-col gap-2; }

.user-row {
  @apply flex items-center gap-3 px-4 py-3 rounded-2xl cursor-pointer;
  @apply bg-surface-container-low/60 dark:bg-white/5;
  @apply border border-outline-variant/15 dark:border-white/10;
  @apply hover:bg-surface-container dark:hover:bg-white/10 transition-colors;
}

.user-row--staff { @apply cursor-default; }

.avatar {
  @apply w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center;
  @apply bg-primary/15 text-primary font-bold text-sm font-headline;
}

.avatar--staff {
  @apply bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400;
}

.user-info {
  @apply flex flex-col min-w-0 flex-1;
}

.user-name {
  @apply text-sm font-semibold truncate text-on-surface dark:text-white;
}

.user-email {
  @apply text-xs truncate text-on-surface-variant dark:text-white/45;
}

.user-meta {
  @apply hidden sm:flex items-center gap-2 flex-shrink-0;
}

.meta-chip {
  @apply text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full;
}

.meta-chip--ok {
  @apply bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400;
}

.meta-chip--warn {
  @apply bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400;
}

.meta-chip--role {
  @apply bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-fixed-dim;
}

.meta-chip--pending {
  @apply bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400;
}

.avatar--pending {
  @apply bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400;
}

.invitation-code {
  @apply text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded;
  @apply bg-black/5 dark:bg-white/10 text-on-surface dark:text-white/80;
}

.invitation-actions {
  @apply flex items-center gap-1 flex-shrink-0;
}

.action-btn {
  @apply p-1.5 rounded-lg;
  @apply text-on-surface-variant hover:text-primary;
  @apply hover:bg-primary/10 transition-colors;
  @apply disabled:opacity-40 disabled:cursor-not-allowed;
}

.action-btn--danger {
  @apply hover:text-red-500 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-900/20;
}

.invite-hint {
  @apply text-xs text-on-surface-variant/70 dark:text-white/35 -mt-2;
}

.meta-date {
  @apply text-xs text-on-surface-variant dark:text-white/35;
}

.delete-btn {
  @apply p-1.5 rounded-lg flex-shrink-0;
  @apply text-on-surface-variant/40 hover:text-red-500 dark:hover:text-red-400;
  @apply hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors;
}

/* Drawer */
.drawer-backdrop {
  @apply fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end;
  background: rgba(8, 13, 30, 0.4);
  backdrop-filter: blur(6px);
}

.drawer {
  @apply w-full sm:w-96 h-[85vh] sm:h-full flex flex-col gap-5 p-6 overflow-y-auto;
  @apply rounded-t-3xl sm:rounded-none sm:rounded-l-3xl;
  @apply bg-white dark:bg-slate-900;
  @apply border border-outline-variant/15 dark:border-white/10;
}

.drawer--sm {
  @apply sm:w-[420px] sm:h-auto sm:max-h-[80vh] sm:rounded-3xl sm:m-auto;
}

.drawer-close {
  @apply self-end p-1.5 rounded-lg text-on-surface-variant hover:bg-black/5 dark:hover:bg-white/10;
}

.drawer-avatar {
  @apply w-16 h-16 rounded-full flex items-center justify-center mx-auto;
  @apply bg-primary/15 text-primary font-bold text-2xl font-headline;
}

.drawer-name {
  @apply text-xl font-headline font-bold text-center text-on-surface dark:text-white;
}

.drawer-email {
  @apply text-sm text-center text-on-surface-variant dark:text-white/50 -mt-3;
}

.drawer-dl {
  @apply grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm;
}

.drawer-dl dt {
  @apply text-on-surface-variant dark:text-white/40 font-medium;
}

.drawer-dl dd {
  @apply text-on-surface dark:text-white;
}

.drawer-section { @apply flex flex-col gap-2; }

.drawer-sub {
  @apply text-sm font-semibold text-on-surface dark:text-white;
}

.lib-list { @apply flex flex-col gap-1.5; }

.lib-item {
  @apply flex items-start gap-2 px-3 py-2 rounded-xl;
  @apply bg-surface-container-low/60 dark:bg-white/5;
}

.lib-name {
  @apply text-sm font-medium text-on-surface dark:text-white;
}

.lib-date {
  @apply text-xs text-on-surface-variant dark:text-white/40;
}

.confirm-actions {
  @apply flex justify-end gap-2 mt-2;
}

.invite-form { @apply flex flex-col gap-4; }

/* Transitions */
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.fb-enter-active, .fb-leave-active { transition: all 0.2s ease; }
.fb-enter-from, .fb-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
