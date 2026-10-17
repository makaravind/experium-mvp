# Offline Pages: Every Route and Any `/s/<code>` Open Offline

**GitHub**: [#81](https://github.com/makaravind/experium-ai-tour-app/issues/81)
**Milestone**: m5-pwa-offline — PWA + Offline
**Status**: DONE — merged to `main` as `df3b87c` (2026-10-17)
**Follow-ups**: #82 (map tiles offline)

---

## Context

After #64's precache, offline works only on the exact page that was loaded online. Verified 2026-10-17 on a production build (Chromium, real service worker): a fresh visitor lands on `/` (the ticket-counter link), precaches, goes offline.

| Offline action | Result |
|---|---|
| Reload the same `/s/<code>` | works (the only case `e2e/offline-precache.spec.ts` covers) |
| Phone-camera QR scan → `/s/<code>` | browser error page |
| Second QR scan, different code (even after entering via `/s/`) | browser error page |
| Reopen `/` (manifest `start_url`, tab killed by the OS) | browser error page |
| Cold `/map` | browser error page |
| Map tab 5+ min after loading Home | browser error page |
| Any tab from an exhibit page opened offline | browser error page |

Causes:
1. The SW precaches build chunks and `public/` files only. `/`, `/map`, `/scan`, `/collection` have no cached document.
2. The `/s/*` rule (`exhibit-shell-cache`, `app/sw.ts`) is a `NetworkFirst` keyed by exact URL with `maxEntries: 1`, filled only by an online visit. #64's "one cached shell covers every exhibit" doesn't hold.
3. An offline tab tap: Next's RSC fetch fails, Next logs "Falling back to browser navigation" and does a full navigation, which hits cause 1. Link prefetches only stay fresh for 5 minutes (`staleTimes.static`), so this is the normal case in the park.

---

## Architecture Decisions

### Cache every page document at service-worker install

**Decision**: `app/sw.ts` adds an `install` listener that fills a new `pages-cache` with `/`, `/map`, `/scan`, `/collection` and `/s/_shell`, fetched with `cache: 'reload'`.

**Why**: AppGate already waits for `navigator.serviceWorker.ready` before precaching, and `ready` means install finished, so the documents are in place before the gate clears. No AppGate or `lib/precache.ts` change. Every deploy ships a new SW whose install refetches the documents, so they always match the build chunks in the active SW's precache. `cache: 'reload'` skips the HTTP cache.

**`/s/_shell` is prerendered**: a server `app/(map)/s/[code]/layout.tsx` exports `generateStaticParams` → `[{ code: '_shell' }]`, so install fetches static HTML instead of waiting on a serverless render (AppGate gives the SW only 4s to take control before it starts the audio download). Other codes still render on demand (`dynamicParams` stays `true`).

**Alternatives considered**: Serwist precache (`additionalPrecacheEntries`) — rejected: its route answers cache-first, so online visitors would get the previous deploy's pages until the SW updates. AppGate fetching the documents — rejected: a page `fetch()` isn't a navigation, so the SW rule wouldn't store it. Precaching each `/s/<code>` from the dataset (~50 documents) — rejected: new codes need a refresh, and one shell already covers unknown codes.

### Navigations: `NetworkFirst` on `pages-cache`, one key per route

**Decision**: Replace the `/s/*` rule with one rule for every navigation: `NetworkFirst({ cacheName: 'pages-cache', networkTimeoutSeconds: 3 })` plus a `cacheKeyWillBeUsed` plugin that keys `/s/*` as `/s/_shell` and every other page by pathname, query dropped.

**Why**: Online navigation stays as today (network first), and each online visit refreshes that route's cached copy. Offline, or after 3s on a dead connection, the cached copy answers. Dropping the query makes `/s/<code>?scan=1` and `/?src=x` hit the same entries.

**Consequences**: An offline tab tap is a full page load from cache (Next's own fallback), not a client-side transition, so audio playing on the old page stops. Acceptable for v1. RSC payloads stay uncached.

### The exhibit page reads its code from the URL

**Decision**: `app/(map)/s/[code]/page.tsx` derives `code` from `usePathname()` instead of `useParams()`.

**Why**: The cached shell was rendered for another code (`_shell`, or the last exhibit visited online). `useParams()` comes from that server-rendered tree, so it would return the wrong code and show the wrong exhibit. Next 15.5 seeds the router's pathname from `location.href` in the browser (`create-initial-router-state.js`). The page already renders nothing until mounted, so there's no hydration mismatch.

### Turn off the plugin's reload-on-`online`

**Decision**: `next.config.ts` passes `reloadOnOnline: false` to `withSerwist`.

**Why**: Found while writing the e2e. `@serwist/next` injects its own register script into the client bundle, and its `reloadOnOnline` defaults to `true`: `addEventListener("online", () => location.reload())` was in the production `main` chunk. #64 set `reloadOnOnline={false}` on `SerwistProvider`, but that prop doesn't reach the plugin's script. So every time signal came back in the park, the page reloaded: audio stopped and the sheet reset. Product call: fix it here.

**Consequences**: Playwright's `setOffline` fires stray `online` events during offline navigations. With the reload gone they're harmless, so the e2e needs no workaround for them, and the stale-prefetch test fails again if the reload ever comes back.

### DebugPanel Reset keeps `pages-cache`

**Decision**: Remove `'exhibit-shell-cache'` from `PRECACHE_CACHE_NAMES` in `components/DebugPanel.tsx`. Don't add `pages-cache`.

**Why**: `pages-cache` belongs to the SW install, like the build precache. Only the next SW install refills it, so deleting it on Reset would make post-Reset offline testing lie. A real fresh visitor gets it at install anyway.

---

## Implementation Plan

1. **`app/sw.ts`**: `PAGES_CACHE` + `PAGES` constants, `install` listener, the navigation rule replacing the `exhibit-shell-cache` rule.
2. **`app/(map)/s/[code]/page.tsx`**: `code` from `usePathname()` (decoded third segment), drop `useParams`. New server **`layout.tsx`** beside it prerenders `/s/_shell` (`generateStaticParams`).
3. **`components/DebugPanel.tsx`**: drop `'exhibit-shell-cache'` from the reset list.
4. **`e2e/offline-precache.spec.ts`**: its online-reload comment names `exhibit-shell-cache`; make it true again.
5. **`e2e/offline-pages.spec.ts`** (new): see Test Plan.
6. **`next.config.ts`**: `reloadOnOnline: false` in `withSerwist`.

Steps 1–4 and step 5 run in parallel; 5 must fail on `main` first.

---

## Code References

- `app/sw.ts` — Serwist config; the `/s/*` `NetworkFirst` rule being replaced; `.pmtiles` rule (untouched, #82)
- `app/(map)/s/[code]/page.tsx` — `useParams` read; new `layout.tsx` beside it prerenders `/s/_shell`
- `next.config.ts` — `withSerwist` options (`reloadOnOnline`)
- `app/(map)/layout.tsx` — `usePathname()` for `isExhibitPage` (already URL-based)
- `components/DebugPanel.tsx` — `PRECACHE_CACHE_NAMES`, used by Reset and No-precache
- `components/onboarding/AppGate.tsx` — `waitForServiceWorker()` before the first precache fetch
- `e2e/offline-precache.spec.ts`, `e2e/gate-helpers.ts` — fresh-visitor init script, dataset mock, audio seed

---

## Acceptance Criteria (Technical)

- [ ] After a precache that started on `/`, offline cold opens of `/`, `/map`, `/scan`, `/collection` render the app, not a browser error page
- [ ] Offline `/s/<code>` opens for any code, including codes never visited online: a cached exhibit shows its own content, an unknown code shows "Can't verify this code right now"
- [ ] After visiting exhibit A online, offline `/s/<B>` shows B, not A
- [ ] Offline tab taps work after Next's prefetch goes stale
- [ ] Online navigation is network first; no behaviour change online
- [ ] Regaining connectivity doesn't reload the page (no `online` → `location.reload()` in the client bundle)
- [ ] Existing e2e, vitest, lint and `tsc` pass

---

## Test Plan

`e2e/offline-pages.spec.ts`, production build only (`E2E_PROD=1`), Chromium only, same skip pattern as `offline-precache.spec.ts`:

1. **Home-entry visitor**: fresh visitor opens `/`, precache finishes, offline; cold `/`, `/map`, `/scan`, `/collection` each render; `/s/baobab-forest` shows the exhibit; an unknown `/s/` code shows the "can't verify" message.
2. **Stale prefetch**: `page.clock.install()`, precache from `/`, offline, `clock.fastForward('06:00')`; Map tab → `/map` renders; Home tab → `/` renders.
3. **Right exhibit from the shared shell**: dataset mocked with two exhibits, audio seeded in Cache Storage; open exhibit A online, offline, cold `/s/<B>` shows B's name and not A's.

All three must fail on `main` (error pages; test 3 by error page there, by the wrong exhibit if step 2 is skipped).

---

## Out of Scope

- Map tiles offline — #82
- Dead-connection tab taps: the RSC fetch has no timeout, so a tap on a connected-but-dead network can hang before Next falls back. Follow up if seen on device.
- The orphan `exhibit-shell-cache` (one entry) left on existing devices
