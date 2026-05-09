# CLAUDE.md — PixelShare Web (Nuxt 3 Frontend)

This file describes the frontend repository of PixelShare, a self-hosted photo-sharing platform for photographers and models.

---

## Project Overview

PixelShare is a self-hosted service where photographers upload shooting sessions and invite models to browse, star-rate, and download photos. This repo is the **Nuxt 3 web frontend** (`PixelShare-web`). The backend lives in a separate repo (`PixelShare-back`: Bun + TypeScript + Fastify + PostgreSQL + Drizzle ORM).

**License:** Open Source  
**Deployment:** Docker Compose, single server (HTTP). TLS is terminated by an external Nginx reverse proxy.

---

## Repository Structure

```
app/
  app.vue                      # Root Nuxt entry — wraps NuxtLayout + NuxtPage
  assets/css/main.css          # Tailwind base + global utilities (glass, masonry)
  components/
    layout/
      AppHeader.vue            # Top navigation bar
      AppSidebar.vue           # Left sidebar (library nav, role toggle, stats)
    library/
      FloatingSelectionBar.vue # Sticky bottom bar — starred count + submit button
      LibraryFilters.vue       # Filter chips (stars, new, unstarred)
      LibraryStats.vue         # Total / starred / pending counters
    photo/
      PhotoCard.vue            # Masonry card — thumbnail, stars overlay, hover actions
      PhotoLightbox.vue        # Full-screen photo viewer with star rating + history panel
      PhotoMasonryGrid.vue     # CSS-columns masonry grid wrapper
    ui/
      UiAlert.vue              # Reusable alert banner
      UiButton.vue             # Reusable button with variants
      UiCard.vue               # Surface card wrapper
      UiDivider.vue            # Horizontal rule
      UiInput.vue              # Text input with label + error state
      UiStarRating.vue         # 1–5 star interactive control
  composables/
    useColorMode.ts            # Light / dark mode toggle (persisted to localStorage)
    useLayoutState.ts          # Sidebar open state + showPhotographerStars toggle
    useLibraryFilters.ts       # Filter state shared between FilterBar and page
    useLibraryPhotos.ts        # Photo list, star mutations, submit selection (mock → API)
    useRole.ts                 # Current user role (model | photographer) — dev toggle
    useViewedPhotos.ts         # Tracks which "new" photos have been opened/starred
  layouts/
    auth.vue                   # Minimal layout for login / register pages
    library.vue                # Full layout: AppHeader + AppSidebar + main content
  pages/
    index.vue                  # Library list / dashboard
    login.vue                  # Login page
    register.vue               # Register page (also used for invitation flow)
    libraries/[id]/index.vue   # Library detail: masonry grid + lightbox + filters
  plugins/
    colorMode.client.ts        # Applies dark class on client before hydration
  types/
    index.ts                   # Shared TypeScript interfaces (User, Library, Photo, etc.)
nuxt.config.ts                 # Nuxt config — modules, runtimeConfig, fonts
tailwind.config.js             # Design tokens, custom screens, font families
```

---

## Stack

| Concern | Choice |
|---------|--------|
| Framework | Nuxt 3 (SSR/SPA, file-based routing) |
| State | Nuxt `useState` (shared across components without Pinia for simple state) |
| Styling | Tailwind CSS v3 + Material Symbols Outlined icons + `@nuxt/icon` |
| Fonts | Manrope (headline), Inter (body/label) via Google Fonts |
| State management | Pinia (`@pinia/nuxt`) — for heavier global stores (auth, etc.) |
| Package manager | Bun |
| Runtime config | `NUXT_PUBLIC_API_BASE` env var (default: `http://localhost:3001`) |

---

## Design Language

**Apple-inspired, clean and minimal.** Every screen should feel effortless on both mobile and desktop.

- Generous whitespace, soft shadows, rounded corners (`rounded-lg`, `rounded-xl`)
- Glassmorphism surfaces: `.glass-panel`, `.etheric-glass` (defined in `main.css`)
- Material Design 3 colour tokens mapped to Tailwind (see `tailwind.config.js`):
  - `primary`, `surface`, `on-surface`, `surface-container-*`, `outline`, etc.
- Typography: `font-headline` (Manrope, heavy weights) + `font-body` / `font-label` (Inter)
- Dark mode via `darkMode: 'class'`; toggled by `useColorMode`; applied before hydration by `colorMode.client.ts`
- Custom breakpoints: `xs:480px sm:640px md:768px lg:1024px xl:1280px 2xl:1536px 3xl:1920px`

---

## API Layer Convention

**No direct `fetch()` calls inside components.** All backend communication goes through composables in `app/composables/`.

- Each composable returns reactive state + mutation functions
- Composables currently use **mock data** — the `// TODO:` comments mark where real API calls will be wired
- The backend base URL is read from `useRuntimeConfig().public.apiBase`
- Photos and thumbnails are **never** accessed via direct storage URLs — always through the backend API (which checks auth + permissions)

### Planned API composables (not yet implemented)
- `useAuth` — login, logout, session (JWT stored in cookie or memory)
- `useLibraries` — list, create, fetch library metadata
- `usePhotos` — fetch paginated photos for a library
- `useStars` — set/clear star rating (POST/DELETE `/libraries/:id/photos/:photoId/star`)
- `useInvitations` — generate and manage single-use invitation links

---

## User Roles

| Role | What they see / can do |
|------|------------------------|
| `admin` | Full access — manage users, libraries, access rights, platform settings |
| `photographer` | Upload files, create libraries, invite models, see both star sets, manage ratings |
| `model` | Browse granted libraries, rate photos (1–5 stars), submit selection, download files |

Role-gated UI is driven by `useRole()` (currently a dev toggle; will be replaced by the auth session role).

---

## Star Rating System

- **1–5 stars** (0 = unrated). Clicking the same value toggles it off (back to 0).
- `useLibraryPhotos` holds `photographerStars` and `myStars` per photo.
- `UiStarRating` is the shared interactive control — used on `PhotoCard` overlay and inside `PhotoLightbox`.
- The photographer's stars are hidden from the model when `showPhotographerStars` (from `useLayoutState`) is `false`.
- Photos where **both sides rated** are visually highlighted (future: filter for this).
- **Model selection submission:** `FloatingSelectionBar` displays a sticky bottom bar with the count of starred photos and a "Submit my selection" button; `submitSelection()` in `useLibraryPhotos` will POST to the API.

---

## Library Page Flow (`pages/libraries/[id]/index.vue`)

1. `useLibraryPhotos(libraryId)` → photo list + star mutations
2. `useLibraryFilters()` → filter state (stars, new-only, unstarred)
3. `useViewedPhotos()` → tracks which "new" photos the model has opened
4. Filtered photo list → `PhotoMasonryGrid` → emits `open` and `set-stars`
5. Clicking a card → `PhotoLightbox` (full-screen, star control, rating history panel)
6. Starring or opening in lightbox → `markViewed(photoId)` (clears the "new" badge)
7. `LibraryFloatingSelectionBar` always visible at bottom → submit selection

---

## Adding a New Page or Feature

1. Add a page file under `app/pages/` (file-based routing)
2. Create a composable in `app/composables/` for any data / state logic
3. Add reusable UI atoms to `app/components/ui/` if needed
4. Feature-specific components go in a named subdirectory (e.g. `components/upload/`)
5. Register no new Nuxt modules unless genuinely needed — prefer composables + components

---

## Deployment

```yaml
# docker-compose.yml (simplified)
services:
  web:   # Nuxt 3 server-side rendered or static export
  api:   # PixelShare-back (Bun + Fastify)
  db:    # PostgreSQL
```

- `NUXT_PUBLIC_API_BASE` must point to the backend URL (internal Docker network or public)
- No TLS in the container — terminated upstream by Nginx

---

## Development Notes

- Run dev server: `bun run dev`
- Build: `bun run build`
- Composables are the primary abstraction — avoid prop-drilling; use `useState` for shared UI state
- Mobile responsiveness is a hard requirement — validate every new component on small screens
- Do not add comments explaining *what* code does; only add one when the *why* is non-obvious