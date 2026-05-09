<script setup lang="ts">
defineProps<{
  libraryName: string
  libraryId: string
  photographerName: string
}>()

const { sidebarOpen } = useLayoutState()
const { isPhotographer } = useRole()
</script>

<template>
  <!-- Mobile backdrop — tap to close -->
  <Transition name="fade-bg">
    <div
      v-if="sidebarOpen"
      class="mobile-backdrop"
      @click="sidebarOpen = false"
    />
  </Transition>

  <!-- Sidebar panel -->
  <aside class="sidebar" :class="sidebarOpen ? 'sidebar--open' : ''">
    <!-- Collapse button -->
    <button
      class="collapse-btn"
      aria-label="Collapse sidebar"
      @click="sidebarOpen = false"
    >
      <span class="material-symbols-outlined" style="font-size:16px">chevron_left</span>
    </button>

    <!-- Library identity -->
    <div class="sidebar-body">
      <div class="library-identity">
        <div class="library-icon">
          <span class="material-symbols-outlined filled-icon">photo_library</span>
        </div>
        <div class="library-info">
          <h2 class="library-name">{{ libraryName }}</h2>
          <p class="library-by">
            <template v-if="isPhotographer">
              <span class="font-semibold text-primary">Your library</span>
            </template>
            <template v-else>
              by <span class="font-semibold">{{ photographerName }}</span>
            </template>
          </p>
        </div>
      </div>

      <!-- ── Model navigation ── -->
      <nav v-if="!isPhotographer" class="sidebar-nav">
        <NuxtLink :to="`/libraries/${libraryId}`" class="nav-item" active-class="nav-item--active">
          <span class="material-symbols-outlined filled-icon">star</span>
          My Selection
        </NuxtLink>
        <NuxtLink to="/" class="nav-item nav-item--plain">
          <span class="material-symbols-outlined">photo_library</span>
          All Libraries
        </NuxtLink>
      </nav>

      <!-- ── Photographer navigation ── -->
      <nav v-if="isPhotographer" class="sidebar-nav">
        <NuxtLink :to="`/libraries/${libraryId}`" class="nav-item" active-class="nav-item--active">
          <span class="material-symbols-outlined filled-icon">photo_library</span>
          All Photos
        </NuxtLink>
        <NuxtLink to="/" class="nav-item nav-item--plain">
          <span class="material-symbols-outlined">apps</span>
          All Libraries
        </NuxtLink>
      </nav>
    </div>

    <!-- ── Photographer: New collection button at the bottom ── -->
    <div v-if="isPhotographer" class="sidebar-footer">
      <NuxtLink to="/collections/new" class="new-collection-btn">
        <span class="material-symbols-outlined" style="font-size:18px">add_circle</span>
        New Collection
      </NuxtLink>
    </div>
  </aside>
</template>

<style scoped>
/* Mobile backdrop */
.mobile-backdrop {
  @apply fixed inset-0 z-30 bg-black/40 md:hidden;
}

/* Sidebar */
.sidebar {
  @apply fixed left-0 top-0 h-full w-64 z-40;
  @apply bg-slate-100/60 dark:bg-slate-900/70 backdrop-blur-2xl;
  @apply border-r border-outline-variant/10 dark:border-white/5;
  @apply flex flex-col;
  @apply transition-all duration-300 ease-in-out;
  @apply -translate-x-full;
}

.sidebar--open {
  @apply translate-x-0;
}

/* Collapse button */
.collapse-btn {
  @apply absolute -right-3.5 top-14 sm:top-20 w-7 h-7;
  @apply bg-white dark:bg-slate-800;
  @apply border border-outline-variant/30 dark:border-white/10;
  @apply rounded-full flex items-center justify-center;
  @apply shadow-sm hover:bg-surface-container dark:hover:bg-slate-700;
  @apply transition-colors z-10;
  @apply text-on-surface-variant dark:text-slate-400;
}

/* Body */
.sidebar-body {
  @apply mt-14 sm:mt-20 flex-1 overflow-y-auto p-6;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.sidebar-body::-webkit-scrollbar { display: none; }

.library-identity {
  @apply flex items-center gap-3 mb-6;
}

.library-icon {
  @apply w-10 h-10 bg-primary rounded-xl flex items-center justify-center;
  @apply text-on-primary flex-shrink-0;
}

.library-info {
  @apply min-w-0;
}

.library-name {
  @apply text-base font-black text-on-surface dark:text-slate-100;
  @apply font-headline leading-tight truncate;
}

.library-by {
  @apply text-[11px] text-on-surface-variant dark:text-slate-400 truncate;
}

/* Navigation */
.sidebar-nav {
  @apply space-y-1 mb-6;
}

.nav-item {
  @apply flex items-center gap-3 px-4 py-3;
  @apply font-headline font-medium text-sm rounded-xl;
  @apply transition-transform;
}

.nav-item--active {
  @apply text-primary bg-white/80 dark:bg-slate-800/80 shadow-sm;
}

.nav-item--plain {
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:translate-x-1;
}

/* Footer */
.sidebar-footer {
  @apply p-4 border-t border-outline-variant/10 dark:border-white/5;
}

.new-collection-btn {
  @apply w-full flex items-center justify-center gap-2;
  @apply px-4 py-3 rounded-xl;
  @apply font-headline font-semibold text-sm;
  @apply bg-primary/10 dark:bg-primary/15 text-primary;
  @apply border border-primary/20 dark:border-primary/30;
  @apply hover:bg-primary/15 dark:hover:bg-primary/25;
  @apply transition-colors duration-200;
}

/* Transitions */
.fade-bg-enter-active, .fade-bg-leave-active { transition: opacity 0.25s ease; }
.fade-bg-enter-from, .fade-bg-leave-to { opacity: 0; }
</style>
