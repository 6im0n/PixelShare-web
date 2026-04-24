const trigger = ref(0)

export function useUploadTrigger() {
  function requestUpload() {
    trigger.value++
  }
  return { trigger: readonly(trigger), requestUpload }
}
