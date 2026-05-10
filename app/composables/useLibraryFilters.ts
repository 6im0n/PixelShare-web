/**
 * Shared filter state for the library grid.
 * useState ensures the filter bar component and the page share the same values.
 */
export type SortBy  = 'myStars' | 'modelStars' | 'photographerStars' | 'uploadedAt' | 'filename'
export type SortDir = 'asc' | 'desc'

export function useLibraryFilters() {
  const filterStars     = useState<number | null>('lib-filter-stars',     () => null)
  const filterNewOnly   = useState<boolean>('lib-filter-new',             () => false)
  const filterUnstarred = useState<boolean>('lib-filter-unstarred',       () => false)
  const filterName      = useState<string>('lib-filter-name',             () => '')
  const sortBy          = useState<SortBy>('lib-sort-by',                 () => 'uploadedAt')
  const sortDir         = useState<SortDir>('lib-sort-dir',               () => 'desc')

  const hasActiveFilters = computed(() =>
    filterStars.value !== null || filterNewOnly.value || filterUnstarred.value || filterName.value.trim() !== ''
  )

  /** Toggle a specific star count. Clicking the same value again clears it. */
  function setStarFilter(n: number) {
    filterStars.value = filterStars.value === n ? null : n
    // Star filter and "unstarred" are mutually exclusive
    if (filterStars.value !== null) filterUnstarred.value = false
  }

  function toggleNewOnly() {
    filterNewOnly.value = !filterNewOnly.value
  }

  function toggleUnstarred() {
    filterUnstarred.value = !filterUnstarred.value
    // Unstarred and star count are mutually exclusive
    if (filterUnstarred.value) filterStars.value = null
  }

  function setSortBy(by: SortBy) {
    sortBy.value = by
  }

  function setSortDir(dir: SortDir) {
    sortDir.value = dir
  }

  function clearAll() {
    filterStars.value     = null
    filterNewOnly.value   = false
    filterUnstarred.value = false
    filterName.value      = ''
  }

  return {
    filterStars,
    filterNewOnly,
    filterUnstarred,
    filterName,
    sortBy,
    sortDir,
    hasActiveFilters,
    setStarFilter,
    toggleNewOnly,
    toggleUnstarred,
    setSortBy,
    setSortDir,
    clearAll,
  }
}
