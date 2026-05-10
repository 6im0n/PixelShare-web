<script setup lang="ts">
const { isDark, toggle: toggleDark } = useColorMode()
const year = new Date().getFullYear()
</script>

<template>
  <div class="auth-root">
    <!-- Mesh gradient background -->
    <div class="auth-bg" />

    <!-- Dark mode toggle -->
    <button class="dark-toggle" :aria-label="isDark ? 'Light mode' : 'Dark mode'" @click="toggleDark">
      <span class="material-symbols-outlined" style="font-size:18px">
        {{ isDark ? 'light_mode' : 'dark_mode' }}
      </span>
    </button>

    <!-- Centered content -->
    <div class="auth-center">
      <!-- Brand -->
      <div class="brand-block">
        <img src="/pixelshare_icon.svg" alt="" class="brand-icon-img">
        <span class="brand-name">PixelShare</span>
      </div>

      <!-- Page content (login or register card) -->
      <slot />

      <!-- Footer -->
      <p class="auth-footer">
        © {{ year }} PixelShare · <a href="#" class="footer-link">Privacy</a> · <a href="#" class="footer-link">Terms</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-root {
  @apply relative min-h-screen flex flex-col font-body;
  @apply text-on-surface dark:text-slate-100;
  @apply transition-colors duration-300;
}

/* Layered mesh gradient background */
.auth-bg {
  @apply fixed inset-0 -z-10;
  background:
    radial-gradient(ellipse at 15% 20%, rgba(0, 88, 188, 0.13) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(64, 94, 150, 0.10) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 60%, rgba(0, 112, 235, 0.05) 0%, transparent 70%),
    #f0f4fb;
}

.dark .auth-bg {
  background:
    radial-gradient(ellipse at 15% 20%, rgba(0, 88, 188, 0.28) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 80%, rgba(64, 94, 150, 0.22) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 60%, rgba(0, 40, 120, 0.18) 0%, transparent 70%),
    #060a18;
}

/* Dark mode toggle */
.dark-toggle {
  @apply absolute top-5 right-5 z-10;
  @apply p-2 rounded-full transition-colors duration-200;
  @apply text-on-surface-variant/60 dark:text-white/40;
  @apply hover:bg-black/5 dark:hover:bg-white/10;
}

/* Center column */
.auth-center {
  @apply flex flex-col items-center justify-center flex-1 px-4 py-12;
  @apply gap-6;
}

/* Brand above card */
.brand-block {
  @apply flex items-center gap-2.5;
}

.brand-icon-img {
  @apply w-9 h-9 object-contain;
}

.brand-name {
  @apply text-xl font-bold tracking-widest font-headline text-on-surface dark:text-white;
}

/* Footer */
.auth-footer {
  @apply text-[11px] text-on-surface-variant/40 dark:text-white/25 text-center;
}

.footer-link {
  @apply hover:text-on-surface-variant/70 dark:hover:text-white/40 transition-colors;
}
</style>
