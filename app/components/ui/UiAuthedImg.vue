<script setup lang="ts">
const props = defineProps<{
  path: string
  alt?: string
}>()

const api = useApi()
const blobUrl = ref<string>('')
const error = ref(false)

let currentObjectUrl: string | null = null

async function load(path: string) {
  error.value = false
  try {
    const blob = await api.getBlob(path)
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    currentObjectUrl = URL.createObjectURL(blob)
    blobUrl.value = currentObjectUrl
  } catch {
    error.value = true
    blobUrl.value = ''
  }
}

watch(() => props.path, (p) => { if (p) load(p) }, { immediate: true })

onBeforeUnmount(() => {
  if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
})
</script>

<template>
  <img
    v-if="blobUrl"
    :src="blobUrl"
    :alt="alt"
    v-bind="$attrs"
    draggable="false"
  />
  <div v-else-if="error" class="img-error" :aria-label="alt">
    <span class="material-symbols-outlined" style="font-size:24px">broken_image</span>
  </div>
  <div v-else class="img-loading" :aria-label="alt" />
</template>

<style scoped>
.img-error,
.img-loading {
  @apply w-full aspect-[4/3] flex items-center justify-center;
  @apply bg-slate-200/40 dark:bg-slate-800/40;
  @apply text-on-surface-variant/40 dark:text-white/30;
}
</style>
