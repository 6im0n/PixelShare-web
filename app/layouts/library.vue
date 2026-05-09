<script setup lang="ts">
const route = useRoute()
const libraryId = computed(() => route.params.id as string ?? '')

const { sidebarOpen } = useLayoutState()
const { get: getLibrary } = useLibraries()

const libraryName = ref('…')
const photographerName = ref('…')

watch(libraryId, async (id) => {
  if (!id) return
  try {
    const lib = await getLibrary(id)
    libraryName.value = lib.name
    photographerName.value = lib.photographerName ?? 'Photographer'
  } catch {
    libraryName.value = 'Library'
    photographerName.value = ''
  }
}, { immediate: true })

onMounted(() => {
  sidebarOpen.value = window.innerWidth >= 768
})
</script>

<template>
  <div class="root">
    <LayoutAppHeader :library-name="libraryName" />

    <LayoutAppSidebar
      :library-name="libraryName"
      :library-id="libraryId"
      :photographer-name="photographerName"
    />

    <main class="main" :class="sidebarOpen ? 'main--sidebar-open' : ''">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.root {
  @apply bg-background dark:bg-slate-950 text-on-background dark:text-slate-100;
  @apply font-body min-h-screen selection:bg-primary/10 transition-colors duration-300;
}

.main {
  @apply pt-14 px-4 pb-40 min-h-screen;
  @apply bg-surface dark:bg-slate-950;
  @apply transition-all duration-300 ease-in-out;
}

@media (min-width: 640px) {
  .main { padding-top: 4rem; padding-inline: 1.5rem; }
}
@media (min-width: 768px) {
  .main { padding-inline: 2.5rem; }
  .main--sidebar-open { margin-left: 16rem; }
}
@media (min-width: 1024px) {
  .main { padding-inline: 2.5rem; }
}
</style>
