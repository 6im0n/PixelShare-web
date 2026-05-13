<script setup lang="ts">
import type { UploadItem } from '~/composables/useUploadQueue'

const props = defineProps<{
  libraryId: string
  concurrency?: number
  maxFileSize?: number
}>()

const emit = defineEmits<{
  (e: 'complete', photoIds: string[]): void
  (e: 'unauthorized'): void
}>()

const queue = useUploadQueue({
  libraryId: props.libraryId,
  concurrency: props.concurrency,
  maxFileSize: props.maxFileSize,
  onAuthError: () => emit('unauthorized'),
  onComplete: (ids) => emit('complete', ids),
})

const {
  items,
  aggregatePercent,
  totalBytes,
  sentBytes,
  bytesPerSecond,
  etaSeconds,
  isActive,
  doneCount,
  errorCount,
  pendingCount,
  uploadingCount,
  addFiles,
  cancelAll,
  retry,
  retryAll,
  removeItem,
  clearFinished,
} = queue

const inputRef = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)

function pickFiles() {
  inputRef.value?.click()
}

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  if (inputRef.value) inputRef.value.value = ''
  if (files.length) addFiles(files)
}

function onDrop(e: DragEvent) {
  dragOver.value = false
  const dt = e.dataTransfer
  if (!dt) return
  const files = Array.from(dt.files).filter(f => f.type.startsWith('image/'))
  if (files.length) addFiles(files)
}

function onDragOver(e: DragEvent) {
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
  dragOver.value = true
}

function humanSize(bytes: number): string {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(0)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  return `${(mb / 1024).toFixed(2)} GB`
}

function humanSpeed(bps: number): string {
  if (!bps) return '—'
  return `${humanSize(bps)}/s`
}

function humanEta(s: number | null): string {
  if (s === null) return '—'
  if (s < 1) return '<1s'
  if (s < 60) return `${Math.ceil(s)}s`
  const m = Math.floor(s / 60)
  const r = Math.ceil(s % 60)
  return `${m}m ${r}s`
}

function itemPercent(it: UploadItem): number {
  if (it.size === 0) return it.status === 'done' ? 100 : 0
  return Math.min(100, (it.bytesSent / it.size) * 100)
}

function statusLabel(s: UploadItem['status']): string {
  switch (s) {
    case 'pending':   return 'Queued'
    case 'uploading': return 'Uploading'
    case 'done':      return 'Done'
    case 'error':     return 'Failed'
    case 'canceled':  return 'Canceled'
  }
}

defineExpose({ pickFiles, addFiles })
</script>

<template>
  <div class="bulk-upload">
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      multiple
      style="display:none"
      @change="onPick"
    />

    <div
      class="dropzone"
      :class="{ 'dropzone--over': dragOver, 'dropzone--disabled': isActive }"
      @dragenter.prevent="onDragOver"
      @dragover.prevent="onDragOver"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="onDrop"
    >
      <span class="material-symbols-outlined dz-icon" aria-hidden="true">cloud_upload</span>
      <div class="dz-text">
        <p class="dz-title">Drop photos here</p>
        <p class="dz-sub">or pick from your computer · up to 50 MiB each</p>
      </div>
      <UiButton
        variant="primary"
        size="md"
        icon="add_photo_alternate"
        :disabled="isActive"
        @click="pickFiles"
      >
        Choose files
      </UiButton>
    </div>

    <div v-if="items.length > 0" class="queue">
      <div class="queue-head">
        <div class="queue-summary">
          <span class="queue-counts">
            {{ doneCount }} / {{ items.length }} done
            <span v-if="errorCount > 0" class="queue-errors">· {{ errorCount }} failed</span>
            <span v-if="uploadingCount > 0" class="queue-active">· {{ uploadingCount }} uploading</span>
            <span v-if="pendingCount > 0" class="queue-pending">· {{ pendingCount }} queued</span>
          </span>
          <span class="queue-meta">
            {{ humanSize(sentBytes) }} / {{ humanSize(totalBytes) }}
            <span v-if="isActive">· {{ humanSpeed(bytesPerSecond) }} · ETA {{ humanEta(etaSeconds) }}</span>
          </span>
        </div>
        <div class="queue-actions">
          <UiButton
            v-if="errorCount > 0 && !isActive"
            variant="secondary"
            size="sm"
            icon="refresh"
            @click="retryAll"
          >
            Retry failed
          </UiButton>
          <UiButton
            v-if="isActive"
            variant="danger"
            size="sm"
            icon="cancel"
            @click="cancelAll"
          >
            Cancel all
          </UiButton>
          <UiButton
            v-if="!isActive && items.length > 0"
            variant="ghost"
            size="sm"
            icon="clear_all"
            @click="clearFinished"
          >
            Clear
          </UiButton>
        </div>
      </div>

      <div class="agg-bar" :aria-valuenow="aggregatePercent.toFixed(0)" role="progressbar" aria-valuemin="0" aria-valuemax="100">
        <div class="agg-fill" :style="{ width: `${aggregatePercent}%` }" />
      </div>

      <ul class="file-list">
        <li
          v-for="it in items"
          :key="it.id"
          class="file-item"
          :class="`file-item--${it.status}`"
        >
          <span
            class="material-symbols-outlined file-icon"
            :class="`file-icon--${it.status}`"
            aria-hidden="true"
          >
            {{
              it.status === 'done' ? 'check_circle'
              : it.status === 'error' ? 'error'
              : it.status === 'canceled' ? 'block'
              : 'image'
            }}
          </span>
          <div class="file-main">
            <div class="file-row">
              <span class="file-name" :title="it.name">{{ it.name }}</span>
              <span class="file-size">{{ humanSize(it.size) }}</span>
            </div>
            <div class="file-row file-row--sub">
              <span class="file-status">
                {{ statusLabel(it.status) }}
                <span v-if="it.error" class="file-error"> — {{ it.error }}</span>
              </span>
              <span class="file-pct">{{ itemPercent(it).toFixed(0) }}%</span>
            </div>
            <div class="file-bar">
              <div
                class="file-fill"
                :class="`file-fill--${it.status}`"
                :style="{ width: `${itemPercent(it)}%` }"
              />
            </div>
          </div>
          <div class="file-actions">
            <button
              v-if="it.status === 'error' || it.status === 'canceled'"
              type="button"
              class="file-btn"
              aria-label="Retry"
              title="Retry"
              @click="retry(it.id)"
            >
              <span class="material-symbols-outlined" style="font-size:16px">refresh</span>
            </button>
            <button
              v-if="it.status !== 'uploading'"
              type="button"
              class="file-btn"
              aria-label="Remove"
              title="Remove"
              @click="removeItem(it.id)"
            >
              <span class="material-symbols-outlined" style="font-size:16px">close</span>
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.bulk-upload {
  @apply flex flex-col gap-4;
}

/* Dropzone */
.dropzone {
  @apply flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4;
  @apply px-5 py-6 rounded-2xl;
  @apply border-2 border-dashed border-outline-variant/40 dark:border-white/15;
  @apply bg-surface-container-low/60 dark:bg-slate-800/40;
  @apply transition-colors;
}
.dropzone--over {
  @apply border-primary/60 dark:border-sky-400/60;
  @apply bg-primary/5 dark:bg-sky-500/10;
}
.dropzone--disabled {
  @apply opacity-70 pointer-events-none;
}
.dz-icon {
  @apply text-primary/70 dark:text-sky-400/70;
  font-size: 32px !important;
}
.dz-text {
  @apply text-center sm:text-left flex-1;
}
.dz-title {
  @apply text-sm font-semibold text-on-surface dark:text-slate-100;
}
.dz-sub {
  @apply text-xs text-on-surface-variant dark:text-slate-400 mt-0.5;
}

/* Queue */
.queue {
  @apply flex flex-col gap-3 p-4 rounded-2xl;
  @apply bg-surface-container-low/70 dark:bg-slate-800/60;
  @apply border border-outline-variant/20 dark:border-white/5;
}
.queue-head {
  @apply flex flex-col sm:flex-row sm:items-center justify-between gap-2;
}
.queue-summary {
  @apply flex flex-col gap-0.5;
}
.queue-counts {
  @apply text-sm font-semibold text-on-surface dark:text-slate-100;
}
.queue-errors  { @apply text-red-600 dark:text-red-400 font-medium; }
.queue-active  { @apply text-primary dark:text-sky-400 font-medium; }
.queue-pending { @apply text-on-surface-variant dark:text-slate-400 font-medium; }
.queue-meta {
  @apply text-xs text-on-surface-variant dark:text-slate-400 font-mono;
}
.queue-actions {
  @apply flex items-center gap-2 flex-wrap;
}

/* Aggregate progress */
.agg-bar {
  @apply w-full h-2 rounded-full overflow-hidden;
  @apply bg-outline-variant/20 dark:bg-white/10;
}
.agg-fill {
  @apply h-full transition-[width] duration-200 ease-out;
  background: linear-gradient(90deg, #0058bc 0%, #0070eb 100%);
}

/* File list */
.file-list {
  @apply flex flex-col gap-2 max-h-96 overflow-y-auto pr-1;
}
.file-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-xl;
  @apply bg-white/60 dark:bg-slate-900/40;
  @apply border border-outline-variant/15 dark:border-white/5;
}
.file-item--error {
  @apply bg-red-50/70 dark:bg-red-900/15;
  @apply border-red-200/60 dark:border-red-800/40;
}
.file-item--done {
  @apply bg-emerald-50/60 dark:bg-emerald-900/15;
  @apply border-emerald-200/50 dark:border-emerald-800/40;
}
.file-icon {
  @apply text-on-surface-variant dark:text-slate-400 flex-shrink-0;
  font-size: 20px !important;
}
.file-icon--done     { @apply text-emerald-600 dark:text-emerald-400; }
.file-icon--error    { @apply text-red-600 dark:text-red-400; }
.file-icon--canceled { @apply text-on-surface-variant/60 dark:text-slate-500; }

.file-main {
  @apply flex-1 min-w-0 flex flex-col gap-1;
}
.file-row {
  @apply flex items-center justify-between gap-2 text-xs;
}
.file-row--sub {
  @apply text-on-surface-variant dark:text-slate-400;
}
.file-name {
  @apply truncate font-medium text-on-surface dark:text-slate-100;
}
.file-size {
  @apply text-on-surface-variant dark:text-slate-400 font-mono flex-shrink-0;
}
.file-status {
  @apply truncate;
}
.file-error {
  @apply text-red-600 dark:text-red-400 font-medium;
}
.file-pct {
  @apply font-mono flex-shrink-0;
}
.file-bar {
  @apply w-full h-1 rounded-full overflow-hidden;
  @apply bg-outline-variant/20 dark:bg-white/10;
}
.file-fill {
  @apply h-full transition-[width] duration-150 ease-out;
  background: linear-gradient(90deg, #0058bc 0%, #0070eb 100%);
}
.file-fill--done     { background: linear-gradient(90deg, #10b981 0%, #059669 100%); }
.file-fill--error    { background: #ef4444; }
.file-fill--canceled { background: rgba(148, 163, 184, 0.5); }

.file-actions {
  @apply flex items-center gap-1 flex-shrink-0;
}
.file-btn {
  @apply p-1.5 rounded-lg transition-colors;
  @apply text-on-surface-variant dark:text-slate-400;
  @apply hover:bg-black/5 dark:hover:bg-white/10;
  @apply hover:text-on-surface dark:hover:text-slate-200;
}
</style>
