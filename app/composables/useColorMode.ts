/**
 * Dark mode toggle — persists to localStorage, toggles `dark` class on <html>.
 * Uses Nuxt useState so the reactive value is shared across all components.
 */
export function useColorMode() {
  const isDark = useState('color-mode-dark', () => false)

  function toggle() {
    isDark.value = !isDark.value
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', isDark.value)
      localStorage.setItem('pixelshare-color-mode', isDark.value ? 'dark' : 'light')
    }
  }

  return { isDark, toggle }
}