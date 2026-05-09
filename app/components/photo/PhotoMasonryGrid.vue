<script setup lang="ts">
import type { LibraryPhoto } from '~/composables/useLibraryPhotos'

defineProps<{
  photos: LibraryPhoto[]
}>()

const emit = defineEmits<{
  setStars: [id: string, stars: number]
  open: [id: string]
  delete: [id: string]
}>()
</script>

<template>
  <div class="masonry-grid">
    <PhotoCard
      v-for="photo in photos"
      :key="photo.id"
      :photo="photo"
      @set-stars="(id, stars) => emit('setStars', id, stars)"
      @open="emit('open', $event)"
      @delete="emit('delete', $event)"
    />
  </div>
</template>