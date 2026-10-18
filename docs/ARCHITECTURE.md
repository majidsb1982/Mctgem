# Architecture and release notes

## Runtime structure

The app is a static single-page application built with Vite and React 19. There is no backend: every read and write happens against `localStorage`.

```
index.html          pre-paint theme script + boot screen
src/main.tsx        mounts <App/> inside <ErrorBoundary/>, registers the service worker (production only)
src/App.tsx         screen state, theme/accent application, state persistence
src/components/     Header, Nav, PersianDatePicker, ErrorBoundary
src/components/ui/  shared primitives (Button, Card, Sheet, SegmentedTabs, Field, …)
src/screens/        one component per screen (home, attend, entry, fees, members, …)
src/utils/          jalali calendar, storage, audio, report text, demo data
public/             manifest.webmanifest, icon.svg, sw.js, fonts/*.woff2
```

Screen switching is string state in `App.tsx` (`home`, `attend`, `entry`, `fees`, `members`, `homework`, `reports`, `period`, `settings`, `more`) — there is no router, so every screen must stay reachable from the bottom navigation or the "more" screen.

## Design tokens

`src/index.css` defines the visual system:

- `@custom-variant dark (&:where(.dark, .dark *))` binds Tailwind's `dark:` variant to the `.dark` class that `App.tsx` toggles. Without this line dark mode silently falls back to `prefers-color-scheme`.
- Raw values live as CSS custom properties (`--accent`, `--bg`, `--surface`, `--ink`, …) and are mapped to utilities through `@theme inline` (`bg-accent`, `text-ink`, `border-line`, `rounded-card`).
- Accent themes are selected with `data-accent="blue|teal|purple|warm"` on `<html>`. Two accent tokens exist on purpose: `--accent` for fills and `--accent-ink` for text/icons, which is lifted in dark mode to keep contrast.
- Values must stay complete colors (`oklch()`), never channel triplets — Tailwind compiles `bg-accent/10` to `color-mix()`, which breaks otherwise.

When adding UI, prefer tokens (`bg-surface`, `text-muted`, `border-line`, `text-accent-ink`) over raw palette classes (`bg-slate-900`, `text-blue-600`). Raw palette classes bypass the accent themes.

## Data lifecycle

Data is stored in browser localStorage under `mct:data` (schema version `v: 24`). `loadState()` normalizes missing or malformed fields and falls back to a clean initial state, so adding optional fields is safe. Exported backups are portable snapshots, not live synchronization.

Browser storage can be cleared or exhausted; keep encrypted/off-device backups.

## Offline shell

`public/sw.js` precaches the stable shell (`/`, `/index.html`, manifest, icon, fonts) and serves hashed `/assets/*` cache-first with a background refresh. Navigations are network-first with a cached-shell fallback. The worker never calls `registration.unregister()`; bump `VERSION` when changing cache behaviour.

## Synchronization roadmap

Live multi-device sync is intentionally not simulated by GitHub commits or static hosting. A safe implementation needs:

- authenticated user identities, not shared local PINs;
- server-side role checks for every read/write;
- a defined conflict strategy for simultaneous edits;
- audit logs and versioned backups;
- encryption in transit, retention rules, and a privacy review.

Do not connect real group data to a backend until these controls are designed and tested.
