<script setup lang="ts">
const { sidebarOpen } = useLayoutState()
onMounted(() => { sidebarOpen.value = false })
</script>

<template>
  <div class="root">
    <LayoutAppHeader />
    <main class="main">
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
  @apply pt-14 px-4 pb-16 min-h-screen;
  @apply bg-surface dark:bg-slate-950;
}

@media (min-width: 640px) {
  .main { padding-top: 4rem; padding-inline: 1.5rem; }
}
@media (min-width: 1024px) {
  .main { padding-inline: 2.5rem; }
}
</style>
