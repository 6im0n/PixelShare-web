<script setup lang="ts">
import type { SortBy, SortDir } from '~/composables/useLibraryFilters'

const props = defineProps<{
  totalCount:    number
  filteredCount: number
}>()

const {
  filterStars, filterNewOnly, filterUnstarred, filterName,
  sortBy, sortDir,
  hasActiveFilters,
  setStarFilter, toggleNewOnly, toggleUnstarred,
  setSortBy, setSortDir,
  clearAll,
} = useLibraryFilters()

const sortOpen = ref(false)
const sortRoot = ref<HTMLElement | null>(null)

const sortByOptions: { value: SortBy; label: string }[] = [
  { value: 'uploadedAt',        label: 'Date added' },
  { value: 'filename',          label: 'Name' },
  { value: 'myStars',           label: 'Model stars' },
  { value: 'photographerStars', label: 'Photographer stars' },
]

const sortDirOptions: { value: SortDir; label: string; icon: string }[] = [
  { value: 'desc', label: 'Highest first', icon: 'arrow_downward' },
  { value: 'asc',  label: 'Lowest first',  icon: 'arrow_upward'   },
]

const currentSortLabel = computed(() =>
  sortByOptions.find(o => o.value === sortBy.value)?.label ?? 'Sort'
)

function pickSortBy(by: SortBy) {
  setSortBy(by)
}

function pickSortDir(dir: SortDir) {
  setSortDir(dir)
  sortOpen.value = false
}

function handleClickOutside(e: MouseEvent) {
  if (!sortRoot.value) return
  if (!sortRoot.value.contains(e.target as Node)) sortOpen.value = false
}

function handleEscape(e: KeyboardEvent) {
  if (e.key === 'Escape') sortOpen.value = false
}

watch(sortOpen, (open) => {
  if (!import.meta.client) return
  if (open) {
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
  } else {
    document.removeEventListener('mousedown', handleClickOutside)
    document.removeEventListener('keydown', handleEscape)
  }
})

onBeforeUnmount(() => {
  if (!import.meta.client) return
  document.removeEventListener('mousedown', handleClickOutside)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="filters-bar">
    <div class="name-search">
      <span class="material-symbols-outlined search-icon" aria-hidden="true">search</span>
      <input
        v-model="filterName"
        type="text"
        placeholder="Search by name"
        class="name-input"
      />
      <button
        v-if="filterName"
        class="clear-name-btn"
        aria-label="Clear"
        @click="filterName = ''"
      >
        <span class="material-symbols-outlined" style="font-size:14px">close</span>
      </button>
    </div>

    <div class="filters-scroll">
      <!-- ── Star filters ────────────────────────────────── -->
      <div class="filter-group">
        <span class="group-label">Stars</span>

        <UiButton
          variant="chip"
          :active="filterStars === null && !filterUnstarred"
          @click="clearAll"
        >
          All
        </UiButton>

        <UiButton
          v-for="n in 5"
          :key="n"
          variant="chip"
          color="amber"
          :active="filterStars === n"
          @click="setStarFilter(n)"
        >
          <span
            class="material-symbols-outlined filled-icon"
            :class="filterStars === n ? 'text-amber-400' : 'text-amber-400/60'"
            style="font-size:12px"
          >star</span>
          {{ n }}
        </UiButton>
      </div>

      <div class="separator" />

      <!-- ── Toggle filters ──────────────────────────────── -->
      <div class="filter-group">
        <UiButton
          variant="chip"
          color="emerald"
          :active="filterNewOnly"
          @click="toggleNewOnly"
        >
          <span class="material-symbols-outlined" style="font-size:13px">fiber_new</span>
          New
        </UiButton>

        <UiButton
          variant="chip"
          :active="filterUnstarred"
          @click="toggleUnstarred"
        >
          <span class="material-symbols-outlined" style="font-size:13px">star_border</span>
          Unstarred
        </UiButton>
      </div>
    </div>

    <!-- ── Sort dropdown ─────────────────────────────────── -->
    <div ref="sortRoot" class="sort-wrap">
      <UiButton
        variant="chip"
        :active="sortOpen"
        :aria-expanded="sortOpen"
        aria-haspopup="menu"
        @click="sortOpen = !sortOpen"
      >
        <span class="material-symbols-outlined" style="font-size:13px">swap_vert</span>
        <span class="sort-label">{{ currentSortLabel }}</span>
        <span
          class="material-symbols-outlined"
          style="font-size:13px"
        >{{ sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</span>
      </UiButton>

      <Transition name="menu">
        <div v-if="sortOpen" class="sort-menu" role="menu">
          <p class="menu-section-label">Sort by</p>
          <button
            v-for="opt in sortByOptions"
            :key="opt.value"
            type="button"
            role="menuitemradio"
            :aria-checked="sortBy === opt.value"
            class="menu-item"
            :class="sortBy === opt.value && 'menu-item--active'"
            @click="pickSortBy(opt.value)"
          >
            <span class="menu-item-label">{{ opt.label }}</span>
            <span
              v-if="sortBy === opt.value"
              class="material-symbols-outlined filled-icon text-primary"
              style="font-size:16px"
            >check</span>
          </button>

          <div class="menu-divider" />

          <p class="menu-section-label">Order</p>
          <button
            v-for="opt in sortDirOptions"
            :key="opt.value"
            type="button"
            role="menuitemradio"
            :aria-checked="sortDir === opt.value"
            class="menu-item"
            :class="sortDir === opt.value && 'menu-item--active'"
            @click="pickSortDir(opt.value)"
          >
            <span class="material-symbols-outlined" style="font-size:15px">{{ opt.icon }}</span>
            <span class="menu-item-label">{{ opt.label }}</span>
            <span
              v-if="sortDir === opt.value"
              class="material-symbols-outlined filled-icon text-primary ml-auto"
              style="font-size:16px"
            >check</span>
          </button>
        </div>
      </Transition>
    </div>

    <!-- ── Clear + count ─────────────────────────────────── -->
    <div class="filters-end">
      <Transition name="fade">
        <UiButton v-if="hasActiveFilters" variant="ghost" size="sm" @click="clearAll">
          <span class="material-symbols-outlined" style="font-size:13px">close</span>
          Clear
        </UiButton>
      </Transition>

      <span class="photo-count">
        <span :class="hasActiveFilters ? 'text-primary font-bold' : ''">{{ filteredCount }}</span>
        <span class="text-on-surface-variant dark:text-white/35">/{{ totalCount }}</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.filters-bar {
  @apply flex items-center gap-2 mb-6 sm:mb-8 pb-1;
}

.name-search {
  @apply relative flex items-center flex-shrink-0;
  @apply rounded-full border border-outline-variant/40 dark:border-white/10;
  @apply bg-surface-container-low/60 dark:bg-white/5;
  @apply px-3 py-1.5 gap-1.5;
}

.search-icon {
  @apply text-on-surface-variant/60 dark:text-white/40;
  font-size: 16px !important;
}

.name-input {
  @apply bg-transparent outline-none text-sm w-32 sm:w-44;
  @apply text-on-surface dark:text-slate-100;
  @apply placeholder:text-on-surface-variant/50 dark:placeholder:text-white/30;
}

.clear-name-btn {
  @apply p-0.5 rounded-full text-on-surface-variant/70;
  @apply hover:bg-black/5 dark:hover:bg-white/10 transition-colors;
}

.filters-scroll {
  @apply flex items-center gap-2 min-w-0 flex-1;
  @apply overflow-x-auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.filters-scroll::-webkit-scrollbar { display: none; }

.filter-group {
  @apply flex items-center gap-1.5 flex-shrink-0;
}

.group-label {
  @apply text-[10px] font-bold uppercase tracking-widest;
  @apply text-on-surface-variant/50 dark:text-white/30;
  @apply hidden sm:block mr-0.5 flex-shrink-0;
}

.separator {
  @apply w-px h-4 bg-outline-variant/30 dark:bg-white/10 flex-shrink-0 mx-0.5;
}

.filters-end {
  @apply flex items-center gap-2 ml-auto flex-shrink-0;
}

.photo-count {
  @apply text-xs font-mono text-on-surface dark:text-slate-300 pr-1;
}

/* ── Sort dropdown ─────────────────────────────────────────── */
.sort-wrap {
  @apply relative flex-shrink-0;
}

.sort-label {
  @apply hidden xs:inline;
}

.sort-menu {
  @apply absolute right-0 z-20 mt-2 w-56 origin-top-right p-1.5;
  @apply rounded-2xl border border-outline-variant/40 dark:border-white/10;
  @apply bg-surface-container dark:bg-slate-800;
  @apply shadow-xl shadow-black/10 dark:shadow-black/40;
  @apply backdrop-blur-xl;
}

@media (max-width: 479px) {
  .sort-menu {
    @apply left-0 right-auto;
  }
}

.menu-section-label {
  @apply px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-widest;
  @apply text-on-surface-variant/60 dark:text-white/35;
}

.menu-item {
  @apply w-full flex items-center gap-2 px-2.5 py-2 rounded-xl;
  @apply text-sm font-medium text-on-surface dark:text-slate-200;
  @apply hover:bg-surface-container-high dark:hover:bg-slate-700/60;
  @apply transition-colors duration-150;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50;
}

.menu-item--active {
  @apply text-primary dark:text-primary-fixed-dim;
}

.menu-item-label {
  @apply flex-1 text-left;
}

.menu-divider {
  @apply my-1 mx-1 h-px bg-outline-variant/40 dark:bg-white/10;
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.menu-enter-active, .menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from, .menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}
</style>
