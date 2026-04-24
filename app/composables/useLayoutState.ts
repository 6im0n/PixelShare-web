/**
 * Shared UI state across the library layout.
 * Uses Nuxt's useState so all components read the same reactive value
 * without prop-drilling or an event bus.
 */
export function useLayoutState() {
  /** Whether the left sidebar is visible. Starts closed; layout opens it on desktop via onMounted. */
  const sidebarOpen = useState('sidebar-open', () => false)

  /** Whether the photographer's star rating is shown on photo cards */
  const showPhotographerStars = useState('show-photographer-stars', () => true)

  return { sidebarOpen, showPhotographerStars }
}
