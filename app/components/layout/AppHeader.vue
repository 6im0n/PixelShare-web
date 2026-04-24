<script setup lang="ts">
defineProps<{
  libraryName?: string
}>()

const emit = defineEmits<{
  submit: []
}>()

const { sidebarOpen, showPhotographerStars } = useLayoutState()
const { isDark, toggle: toggleDark } = useColorMode()
const { isPhotographer, isAdmin } = useRole()
const route = useRoute()

const { data } = useAuth()
const initials = computed(() => {
  const name = data.value?.name ?? data.value?.email ?? '?'
  return name.split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('')
})

const { requestUpload } = useUploadTrigger()

// Upload button only relevant when inside a library
const inLibrary = computed(() => route.path.startsWith('/libraries/'))
</script>

<template>
  <header class="app-header">
    <!-- Left: sidebar toggle + brand + nav -->
    <div class="header-left">
      <button
        class="icon-btn"
        :aria-label="sidebarOpen ? 'Close sidebar' : 'Open sidebar'"
        @click="sidebarOpen = !sidebarOpen"
      >
        <span class="material-symbols-outlined">{{ sidebarOpen ? 'menu_open' : 'menu' }}</span>
      </button>

      <span class="brand">PixelShare (Demo only)</span>

      <nav class="header-nav">
        <NuxtLink to="/" class="nav-btn" active-class="nav-btn--active">Libraries</NuxtLink>
        <NuxtLink v-if="isAdmin" to="/admin" class="nav-btn" active-class="nav-btn--active">Users</NuxtLink>
      </nav>
    </div>

    <!-- Right: controls -->
    <div class="header-right">
      <!-- Photographer stars toggle (both roles) -->
      <button
        class="photo-stars-btn"
        :class="showPhotographerStars ? 'photo-stars-btn--active' : ''"
        :aria-label="showPhotographerStars ? 'Hide photographer stars' : 'Show photographer stars'"
        @click="showPhotographerStars = !showPhotographerStars"
      >
        <span class="material-symbols-outlined" style="font-size:18px">
          {{ showPhotographerStars ? 'visibility' : 'visibility_off' }}
        </span>
        <span class="photo-stars-label">
          {{ isPhotographer ? 'My stars' : 'Photographer stars' }}
        </span>
      </button>

      <!-- Dark mode toggle -->
      <button
        class="icon-btn"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleDark"
      >
        <span class="material-symbols-outlined">{{ isDark ? 'light_mode' : 'dark_mode' }}</span>
      </button>

      <div class="divider" />

      <!-- Photographer: Upload button — only when inside a library -->
      <button v-if="isPhotographer && inLibrary" class="upload-btn" @click="requestUpload">
        <span class="material-symbols-outlined" style="font-size:16px">upload</span>
        <span class="action-label">Upload Photos</span>
      </button>

      <!-- Model: Submit Selection button — only when inside a library -->
      <button v-else-if="!isPhotographer && inLibrary" class="submit-btn" @click="emit('submit')">
        <span class="material-symbols-outlined" style="font-size:16px">check_circle</span>
        <span class="action-label">Submit Selection</span>
      </button>

      <!-- Avatar — links to account settings -->
      <NuxtLink to="/account" class="avatar" aria-label="Account settings">
        {{ initials }}
      </NuxtLink>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  @apply fixed top-0 w-full z-50;
  @apply bg-slate-50/80 dark:bg-slate-950/85 backdrop-blur-xl;
  @apply border-b border-outline-variant/10 dark:border-white/5;
  @apply flex justify-between items-center;
  @apply px-3 h-14 transition-colors duration-300;
}

@media (min-width: 640px) {
  .app-header { padding-inline: 1.5rem; height: 4rem; }
}

/* Left */
.header-left {
  @apply flex items-center gap-3 sm:gap-6;
}

.brand {
  @apply text-lg sm:text-xl font-bold tracking-widest font-headline;
  @apply text-on-surface dark:text-slate-100;
}

.header-nav {
  @apply hidden md:flex items-center gap-1;
}

.nav-btn {
  @apply font-headline text-sm tracking-tight px-3 py-1.5 rounded-lg transition-colors;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:bg-slate-200/50 dark:hover:bg-slate-800/50;
}

.nav-btn--active {
  @apply text-primary font-semibold bg-primary/5 dark:bg-primary/10;
  @apply hover:bg-primary/5 dark:hover:bg-primary/10;
}

/* Right */
.header-right {
  @apply flex items-center gap-1 sm:gap-1.5;
}

.icon-btn {
  @apply p-2 rounded-lg transition-colors;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:bg-slate-200/60 dark:hover:bg-slate-800/60;
}

.photo-stars-btn {
  @apply flex items-center gap-1.5 px-2 sm:px-3 py-2 rounded-lg;
  @apply font-label text-xs font-medium transition-colors;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:bg-slate-200/50 dark:hover:bg-slate-800/50;
}

.photo-stars-btn--active {
  @apply bg-amber-50 dark:bg-amber-900/25;
  @apply text-amber-600 dark:text-amber-400;
  @apply hover:bg-amber-100 dark:hover:bg-amber-900/40;
}

.photo-stars-label {
  @apply hidden sm:inline;
}

.divider {
  @apply w-px h-5 bg-outline-variant/20 dark:bg-white/10 mx-0.5 sm:mx-1;
}

/* Upload button (photographer) */
.upload-btn {
  @apply flex items-center gap-1.5 sm:gap-2;
  @apply bg-gradient-to-br from-emerald-500 to-emerald-600 text-white;
  @apply px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl;
  @apply font-headline font-semibold text-sm;
  @apply shadow-lg shadow-emerald-500/20;
  @apply hover:scale-95 active:scale-90 transition-transform duration-200;
}

/* Submit button (model) */
.submit-btn {
  @apply flex items-center gap-1.5 sm:gap-2;
  @apply bg-gradient-to-br from-primary to-primary-container text-on-primary;
  @apply px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl;
  @apply font-headline font-semibold text-sm;
  @apply shadow-lg shadow-primary/20;
  @apply hover:scale-95 active:scale-90 transition-transform duration-200;
}

.action-label {
  @apply hidden sm:inline;
}

.avatar {
  @apply w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20;
  @apply flex items-center justify-center;
  @apply text-primary font-bold text-sm font-headline select-none ml-0.5 sm:ml-1;
  @apply transition-all duration-200 cursor-pointer;
  @apply hover:bg-primary/30 hover:scale-105 active:scale-95;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40;
}
</style>
