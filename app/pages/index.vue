<script setup lang="ts">
definePageMeta({ layout: 'library' })

const { list, remove } = useLibraries()
const { isPhotographer, isAdmin } = useRole()
const { data: authData } = useAuth()

const libraries = ref<Awaited<ReturnType<typeof list>>>([])
const loading = ref(true)
const error = ref<string | null>(null)
const deletingId = ref<string | null>(null)

async function refresh() {
  loading.value = true
  error.value = null
  try {
    libraries.value = await list()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to load libraries'
  } finally {
    loading.value = false
  }
}

function canDelete(lib: { photographerId: string }) {
  if (!isPhotographer.value) return false
  return isAdmin.value || lib.photographerId === authData.value?.id
}

async function handleDelete(libId: string, libName: string, e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (!confirm(`Delete library "${libName}"? Photos + thumbnails will be permanently removed.`)) return
  deletingId.value = libId
  try {
    await remove(libId)
    libraries.value = libraries.value.filter(l => l.id !== libId)
  } catch (err: any) {
    error.value = err?.data?.message ?? 'Delete failed'
  } finally {
    deletingId.value = null
  }
}

if (import.meta.client) void refresh()
</script>

<template>
  <header class="page-header">
    <div>
      <h1 class="page-title">Your libraries</h1>
      <p class="page-desc">All shooting sessions you can access.</p>
    </div>
  </header>

  <div v-if="loading" class="empty-state">Loading…</div>
  <UiAlert v-else-if="error" variant="error">{{ error }}</UiAlert>
  <div v-else-if="!libraries.length" class="empty-state">
    <p class="empty-title">No libraries yet.</p>
  </div>
  <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    <NuxtLink
      v-for="lib in libraries"
      :key="lib.id"
      :to="`/libraries/${lib.id}`"
      class="lib-card"
    >
      <div class="lib-card-head">
        <h2 class="lib-name">{{ lib.name }}</h2>
        <button
          v-if="canDelete(lib)"
          type="button"
          class="lib-del-btn"
          :disabled="deletingId === lib.id"
          :aria-label="`Delete ${lib.name}`"
          @click="handleDelete(lib.id, lib.name, $event)"
        >
          <span class="material-symbols-outlined" style="font-size:16px">delete</span>
        </button>
      </div>
      <p class="lib-meta">
        {{ lib.shootDate ? new Date(lib.shootDate).toLocaleDateString() : '—' }}
      </p>
    </NuxtLink>
  </div>
</template>

<style scoped>
.page-header { @apply mb-6 flex flex-col gap-2; }
.page-title { @apply text-2xl sm:text-4xl font-extrabold font-headline tracking-tight; }
.page-desc { @apply text-sm sm:text-base text-on-surface-variant dark:text-slate-400; }

.lib-card {
  @apply block p-5 rounded-2xl border border-outline/20 bg-surface-container-low dark:bg-white/5;
  @apply hover:border-primary/40 hover:bg-primary/5 transition-colors;
}
.lib-card-head { @apply flex items-start justify-between gap-2; }
.lib-name { @apply text-lg font-semibold font-headline; }
.lib-meta { @apply text-xs text-on-surface-variant dark:text-slate-400 mt-1; }

.lib-del-btn {
  @apply p-1.5 rounded-full text-on-surface-variant/70;
  @apply hover:bg-red-50 hover:text-red-600;
  @apply dark:hover:bg-red-900/30 dark:hover:text-red-400;
  @apply transition-colors flex-shrink-0;
}
.lib-del-btn:disabled { @apply opacity-50 cursor-not-allowed; }

.empty-state { @apply py-12 text-center text-on-surface-variant dark:text-slate-400; }
.empty-title { @apply text-sm font-semibold; }
</style>
