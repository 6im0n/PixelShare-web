/**
 * Applies saved dark/light preference before first paint to avoid flash.
 */
export default defineNuxtPlugin(() => {
  const stored = localStorage.getItem('pixelshare-color-mode')
  if (stored === 'dark') {
    document.documentElement.classList.add('dark')
    const isDark = useState('color-mode-dark', () => false)
    isDark.value = true
  }
})