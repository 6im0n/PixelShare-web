<script setup lang="ts">
definePageMeta({ layout: 'library' })

const { list } = useLibraries()
const { isPhotographer } = useRole()

const libraries = ref<Awaited<ReturnType<typeof list>>>([])
const loading = ref(true)
const error = ref<string | null>(null)

onMounted(async () => {
  try {
    libraries.value = await list()
  } catch (e: any) {
    error.value = e?.data?.message ?? 'Failed to load'
  } finally {
    loading.value = false
  }
})

const heading = computed(() => isPhotographer.value ? 'Your libraries' : 'Shared with me')
const subtitle = computed(() =>
  isPhotographer.value
    ? 'All libraries you own.'
    : 'Libraries the photographer has shared with you. Open one to start rating.',
)
</script>

<template>
  <header class="page-header">
    <h1 class="page-title">{{ heading }}</h1>
    <p class="page-desc">{{ subtitle }}</p>
  </header>

  <div v-if="loading" class="empty-state">Loading…</div>
  <UiAlert v-else-if="error" variant="error">{{ error }}</UiAlert>
  <div v-else-if="!libraries.length" class="empty-state">
    <p>No libraries yet.</p>
  </div>
  <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
    <NuxtLink
      v-for="lib in libraries"
      :key="lib.id"
      :to="`/libraries/${lib.id}`"
      class="lib-card"
    >
      <h2 class="lib-name">{{ lib.name }}</h2>
      <p class="lib-meta">by {{ lib.photographerName ?? 'Photographer' }}</p>
      <p class="lib-date">{{ lib.shootDate ? new Date(lib.shootDate).toLocaleDateString() : '—' }}</p>
    </NuxtLink>
  </div>
</template>

<style scoped>
.page-header { @apply mb-6 sm:mb-10; }
.page-title { @apply text-2xl sm:text-4xl font-extrabold font-headline tracking-tight mb-1.5; @apply text-on-surface dark:text-slate-100; }
.page-desc { @apply text-sm sm:text-base text-on-surface-variant dark:text-slate-400 max-w-2xl; }
.empty-state { @apply py-12 text-center text-on-surface-variant dark:text-slate-400; }
.lib-card { @apply block p-5 rounded-2xl border border-outline/20 bg-surface-container-low dark:bg-white/5 hover:border-primary/40 hover:bg-primary/5 transition-colors; }
.lib-name { @apply text-lg font-semibold font-headline; }
.lib-meta { @apply text-xs text-on-surface-variant dark:text-slate-400 mt-1; }
.lib-date { @apply text-xs text-on-surface-variant/70 dark:text-slate-500 mt-0.5; }
</style>
