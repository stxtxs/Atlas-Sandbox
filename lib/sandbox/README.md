# The Atlas tutorial

A public, guided tour of Atlas Explore, Raise and Scout. It runs the **real
Atlas product components** (copied from `client/`) on **made-up sample data**.
There is no backend, no database, no sign-in and no paywall, and nothing
leaves the browser.

## How it fits together

| Piece | Where |
| --- | --- |
| Tier chooser | `app/page.tsx` (`/`). `/preview/<tier>` deep-links into a tour. |
| Product pages | `app/(dashboard)/*`: the client's real pages, plus `data-tour` anchors. |
| Frame | `components/shell/tutorial-shell.tsx`: AtlasShell with no sidebar and no top bar, plus the tour panel (Get Atlas, theme and Exit in its footer). |
| Tour panel (coach) | `components/features/walkthrough/*`: guard, highlight, advance, contents menu. |
| Tours | `lib/sandbox/tours/{explore,raise,scout}-tour.ts`: chapters of steps (`tour-types.ts`). |
| State | `lib/sandbox/store.ts`: tier, step and per-tier sample workspace, in this browser only. |
| "Backend" | `lib/sandbox/mock-api.ts` `mockFetch`, the only thing product code talks to. |
| Sample data | `fixtures/world.ts` (the one fictional world) plus the route tables below. |

`mockFetch` answers `/api/*` from the tier's own routes first
(`explore-routes.ts`, `raise-routes.ts`, `scout-routes.ts`), then the shared
ones (`analytics-routes.ts`, `core-routes.ts`, `watchlist-routes.ts`).
Anything unanswered gets an empty list. Any URL that isn't `/api/*` throws.
It is reached through `lib/query-client.ts` (SWR fetcher and `apiRequest`)
and the two streams (`components/chat/chat-core.tsx`,
`components/features/deck-analysis/deck-analysis-detail.tsx`).

The tier being toured is what the mocked `GET /api/profiles/me` returns as
`user_type`. Every real page that branches on tier (home, recommended, deck,
watchlist board…) renders that tier's version on its own.

## Writing a tour step

A step says exactly what to do, and only its target can be used (the guard
swallows everything else). Advance kinds:

- `next`: a button in the panel, for reading steps.
- `click`: on the target, or on `on`. With `simulate`, the app never sees the click.
- `type`: the target field holds `value`. The panel shows the text to type.
- `request`: the app sent a matching method and path, with an optional body subset.
- `path`: the visitor landed on a matching page.

Anchor elements with `data-tour="<page>-<thing>"`. The first step of every
chapter must have a concrete `path` (no `:param`), because the Contents menu
jumps straight to it.

## Timing rules the engine relies on

- **Progress lives in the URL** (`?tour=&step=`, `tutorial-url.ts`). The shell rewrites it with Next's own history state, so Next's router never sees the write (a router-visible write cancels navigations in flight and remounts lists keyed on the query).
- **Never update tour state mid-navigation.** Next runs navigations in a transition; an urgent update in between (a step advance, a URL write) makes it drop them. `nav-pending.ts` tracks router pushes and `useUrlModal` opens; the coach advances and the shell writes only once they land.
- **Only the visitor's own clicks advance a step** (`isTrusted`); the coach closes overlays and stale menus by script without advancing anything.
- **Escape belongs to the tour.** The guard lets it reach the app only inside a menu, list or combobox the step allows. Anywhere else it is the panel's Escape (Back, or close Contents), so it never closes a drawer or wizard a step relies on.
- **Back puts the page back too.** Back restores the step's workspace snapshot and the shell remounts the page, so the page's own state (wizard step, unsaved picks) starts over with it. Steps that build on unsaved picks from the step before are `continues`, and Back skips to the start of that run.
- **Storage can be blocked.** `store.ts` falls back to memory, so the tour still runs. The step still survives a reload through the URL; the sample workspace starts fresh.

## Rules

- **Fake data only.** Every entity comes from `fixtures/world.ts`. Names are fictional; rename any that ever collides with a real company.
- **No network.** No `fetch` outside `mock-api.ts`. Flags are in `public/flags/`, sample files are in `public/sample/`, and there are no remote logos.
- **Syncing with the client.** Product code is a copy of `client/`. Re-copying it keeps the UI in step, but re-apply the seams afterwards:
  - `query-client`, chat and deck streams → `mockFetch`;
  - auth session and feature access → stubs;
  - analytics and realtime → no-ops;
  - Supabase uploads → `demoUpload`;
  - `entity-logo` and `ui/atoms` → local flags, no favicon lookup;
  - account tabs → product settings tab only; Explore hides `advanced_filters` and `company_contacts` (feature-access stub);
  - `hooks/use-url-state.ts` → `useUrlModal` opens with native `pushState` (a router push of a query-only change could resolve back to the old URL here) and marks it in `nav-pending.ts`; `useDeepLinkKey` ignores `tour`/`step`;
  - dropdown flip logic (`use-keep-in-viewport`, combobox, date-picker, city-input, company-picker) → room below measured to `visibleBottom()`, so menus open above the phone bottom sheet instead of under it;
  - the `data-tour` anchors.
