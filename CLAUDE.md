# Atlas Tutorial — Claude entry point

A public, guided tour of Atlas Explore, Raise and Scout. Next.js 16 App Router +
React 19 + TypeScript + SWR. The product UI is a copy of the Atlas client
(`../client`); the tutorial layer sits on top of it. There is **no backend, no
database, no Supabase, no sign-in, no paywall and no analytics**: every `/api/*`
call is answered in the browser by `lib/sandbox/mock-api.ts` from made-up data.

## Read first

1. [lib/sandbox/README.md](lib/sandbox/README.md) — how the tutorial works and how to write tour steps
2. [.claude/README.md](.claude/README.md) — conventions of the product code

## Hard rules

- **Fake data only.** Every entity comes from `lib/sandbox/fixtures/world.ts`; no real companies, people or brands.
- **No network.** No `fetch`/XHR/remote images or fonts outside `lib/sandbox/mock-api.ts`; new endpoints get a mock route.
- **Product code stays close to the client** so it can be re-synced; tutorial changes go through the seams listed in lib/sandbox/README.md.
- **Use `qk.*` for every SWR key** ([lib/query-keys.ts](lib/query-keys.ts)); writes go through `apiRequest`.
- **Every tour target is a `data-tour` anchor**, and the first step of a chapter has a concrete path.

## Verify

`npx tsc --noEmit`, `npm run check` (includes `lib/sandbox/tours/tours.check.ts`) and `npm run build`. No environment variables are needed.
