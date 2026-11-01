'use client';

/**
 * Router navigations the app has started and Next hasn't committed yet — a
 * drawer opening through `?program=<id>` (useUrlModal), a filter, the coach's
 * own page change.
 *
 * The tour must not change its own state or the URL while one is in flight:
 * Next runs navigations in a React transition, and an urgent update in between
 * (the tour advancing a step, a URL rewrite) re-renders against the old router
 * state — Next re-syncs the address bar to the old URL and the navigation is
 * lost (the drawer never opens). So the coach waits for `navPending()` to clear
 * before advancing, and the shell before writing the URL. TutorialShell marks
 * the end of a navigation when the pathname or query actually changes; a push
 * that changes nothing is given up on after MAX_MS.
 */
const MAX_MS = 3000;
let started = 0;

export const navPending = () => started > 0 && performance.now() - started < MAX_MS;
export const markNavDone = () => { started = 0; };
/** A URL change made outside the router (useUrlModal's pushState) that Next still has to mirror into useSearchParams. */
export const markNavStart = () => { started = performance.now(); };

/** Note every router push/replace (Next exposes the app router as `window.next.router`). Returns the undo. */
export function trackRouterNavigations(): () => void {
	const router = (window as unknown as { next?: { router?: Record<'push' | 'replace', (...a: unknown[]) => unknown> } }).next?.router;
	if (!router) return () => {};
	const originals = { push: router.push, replace: router.replace };
	for (const fn of ['push', 'replace'] as const) {
		router[fn] = (...args: unknown[]) => { started = performance.now(); return originals[fn].apply(router, args); };
	}
	return () => { router.push = originals.push; router.replace = originals.replace; };
}

/** Run `fn` once no navigation is in flight (polls every frame or so). Returns a cancel. */
export function afterNavigation(fn: () => void): () => void {
	let timer = 0;
	const tick = () => { if (navPending()) timer = window.setTimeout(tick, 40); else fn(); };
	tick();
	return () => window.clearTimeout(timer);
}
