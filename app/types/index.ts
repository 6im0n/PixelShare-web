// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'photographer' | 'model'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl?: string
  createdAt: string
}

export interface AuthSession {
  user: User
  token: string
}

// ─── Library ────────────────────────────────────────────────────────────────

export interface Library {
  id: string
  name: string
  description?: string
  coverUrl?: string
  photoCount: number
  createdAt: string
  updatedAt: string
  ownerId: string
  // Access info for the current user (populated by API)
  access?: LibraryAccess
}

export interface LibraryAccess {
  userId: string
  libraryId: string
  grantedAt: string
  selectionSubmitted: boolean
  selectionSubmittedAt?: string
}

// ─── Photo ──────────────────────────────────────────────────────────────────

export interface Photo {
  id: string
  libraryId: string
  filename: string
  thumbnailUrl: string   // served through the API, not a direct storage URL
  width: number
  height: number
  size: number
  mimeType: string
  uploadedAt: string
  // Star state for the current user
  starredByMe: boolean
  // Aggregated star info (populated when the viewer has permission to see both sides)
  starredByPhotographer?: boolean
  starredByModel?: boolean
}

// ─── Stars ──────────────────────────────────────────────────────────────────

export interface Star {
  userId: string
  photoId: string
  createdAt: string
}

// ─── Invitation ──────────────────────────────────────────────────────────────

export interface Invitation {
  id: string
  token: string
  email?: string
  createdAt: string
  expiresAt?: string
  usedAt?: string
  createdByUserId: string
  libraries: Library[]
}

// ─── Public Share Link ───────────────────────────────────────────────────────

export interface ShareLink {
  id: string
  token: string
  libraryId?: string
  photoId?: string
  hasPassword: boolean
  expiresAt?: string
  createdAt: string
}

// ─── API Responses ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface ApiError {
  statusCode: number
  message: string
}