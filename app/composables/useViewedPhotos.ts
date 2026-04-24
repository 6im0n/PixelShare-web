/**
 * Tracks which "new" photos the model has already seen.
 * A photo is considered viewed when the model opens it in the lightbox or stars it.
 * Uses Nuxt useState so the state is shared across all components.
 */
export function useViewedPhotos() {
  // Pre-seed with photos that the model already interacted with (myStars > 0 in mock)
  const viewedIds = useState<string[]>('viewed-photo-ids', () => ['2', '4', '7', '8', '12'])

  function markViewed(photoId: string) {
    if (!viewedIds.value.includes(photoId)) {
      viewedIds.value = [...viewedIds.value, photoId]
    }
  }

  function isViewed(photoId: string): boolean {
    return viewedIds.value.includes(photoId)
  }

  return { markViewed, isViewed }
}
