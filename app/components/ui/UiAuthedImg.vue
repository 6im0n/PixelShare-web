<script setup lang="ts">
const props = withDefaults(defineProps<{
  path: string
  alt?: string
  width?: number | null
  height?: number | null
  eager?: boolean
}>(), {
  eager: false,
})

const api = useApi()
const blobUrl = ref<string>('')
const error = ref(false)
const visible = ref(props.eager)
const wrapper = ref<HTMLElement | null>(null)

let currentObjectUrl: string | null = null
let observer: IntersectionObserver | null = null
let inflight: AbortController | null = null

const aspectStyle = computed(() => {
  if (props.width && props.height) {
    return { aspectRatio: `${props.width} / ${props.height}` }
  }
  return { aspectRatio: '4 / 3' }
})

async function load(path: string) {
  inflight?.abort()
  const ctrl = new AbortController()
  inflight = ctrl
  error.value = false
  try {
    const blob = await api.getBlob(path, ctrl.signal)
    if (ctrl.signal.aborted) return
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = URL.createObjectURL(blob)
    blobUrl.value = currentObjectUrl
  } catch (e: unknown) {
    if (ctrl.signal.aborted) return
    if (e instanceof DOMException && e.name === 'AbortError') return
    error.value = true
    blobUrl.value = ''
  } finally {
    if (inflight === ctrl) inflight = null
  }
}

watch(
  [() => props.path, visible],
  ([p, v]) => {
    if (p && v) load(p)
  },
  { immediate: true },
)

onMounted(() => {
  if (props.eager || !wrapper.value) return
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          visible.value = true
          observer?.disconnect()
          observer = null
          break
        }
      }
    },
    { rootMargin: '200px 0px' },
  )
  observer.observe(wrapper.value)
})

onBeforeUnmount(() => {
  inflight?.abort()
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
  observer?.disconnect()
})
</script>

<template>
  <img
    v-if="blobUrl"
    :src="blobUrl"
    :alt="alt"
    :width="width ?? undefined"
    :height="height ?? undefined"
    v-bind="$attrs"
    draggable="false"
  />
  <div
    v-else-if="error"
    ref="wrapper"
    class="img-error"
    :style="aspectStyle"
    :aria-label="alt"
  >
    <span class="material-symbols-outlined" style="font-size:24px">broken_image</span>
  </div>
  <div
    v-else
    ref="wrapper"
    class="img-loading"
    :style="aspectStyle"
    :aria-label="alt"
  />
</template>

<style scoped>
.img-error,
.img-loading {
  @apply w-full flex items-center justify-center;
  @apply bg-slate-200/40 dark:bg-slate-800/40;
  @apply text-on-surface-variant/40 dark:text-white/30;
}
</style>
