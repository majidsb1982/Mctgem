# Architecture and release notes

## Runtime structure

The app is a dependency-light static web application. `index.html` loads these files in order:

1. `js/core.js` — calendar, local storage, shared helpers
2. `js/pages.js` — page rendering
3. `js/features.js` — feature helpers
4. `js/app.js` — permissions, event wiring, routing and bootstrap

`sw.js` caches the app shell for offline use. When changing local asset paths, update both `index.html` and the service-worker shell list, and increment the cache name.

## Data lifecycle

Data is stored in browser localStorage under `mct:data`. Exported backups are portable snapshots, not live synchronization. The app attempts to preserve a recovery copy under `mct:data:recovery` if the stored JSON cannot be parsed. Browser storage can still be cleared or exhausted; keep encrypted/off-device backups.

## Synchronization roadmap

Live multi-device sync is intentionally not simulated by GitHub commits or static hosting. A safe implementation needs:
- authenticated user identities, not shared local PINs;
- server-side role checks for every read/write;
- a defined conflict strategy for simultaneous edits;
- audit logs and versioned backups;
- encryption in transit, retention rules, and a privacy review.

Do not connect real group data to a backend until these controls are designed and tested.
