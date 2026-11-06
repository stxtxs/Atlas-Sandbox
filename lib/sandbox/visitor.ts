/**
 * The visitor behind this browser, after the name + email gate (VisitorGate).
 * The sandbox has no accounts or session, so the visitor's own name + email
 * live in their browser's localStorage, and are re-sent with every tour start
 * and finish: that is how the platform counts visits and records which tier
 * each person toured (one row per email).
 *
 * Storage can be unavailable (private mode, blocked site data): then the gate
 * simply asks again, which is the safe direction.
 */
import type { SandboxProduct } from './types';

// v4 (6 Nov 2026): stores name + email. Earlier versions held only a flag
// (and some were set for submissions an old honeypot dropped): asked again.
const KEY = 'stx-sandbox-visitor-v4';

export interface Visitor { name: string; email: string }

export function storedVisitor(): Visitor | null {
	try {
		const v = JSON.parse(window.localStorage.getItem(KEY) ?? 'null') as Partial<Visitor> | null;
		return v?.email && v.name ? { name: v.name, email: v.email } : null;
	} catch {
		return null;
	}
}

export function hasVisitor(): boolean {
	return storedVisitor() !== null;
}

export function rememberVisitor(v: Visitor): void {
	try {
		window.localStorage.setItem(KEY, JSON.stringify({ ...v, at: new Date().toISOString() }));
	} catch {
		/* storage blocked: the gate asks again next time */
	}
}

/**
 * An entry to report: the tier a visitor just chose, by a link (`/#scout`,
 * `/preview/raise`) or a chooser card. Set by every entry point, taken once by
 * the tour screen, so a reload or moving around inside the tour never counts.
 * Kept in sessionStorage (this tab only).
 */
export const ENTRY_KEY = 'stx-sandbox-entry';

export function markEntry(tier: SandboxProduct): void {
	try { window.sessionStorage.setItem(ENTRY_KEY, tier); } catch { /* storage blocked: that start goes uncounted */ }
}

/** The pending entry's tier, cleared as it is read. */
export function takeEntry(): SandboxProduct | null {
	try {
		const t = window.sessionStorage.getItem(ENTRY_KEY) as SandboxProduct | null;
		window.sessionStorage.removeItem(ENTRY_KEY);
		return t;
	} catch {
		return null;
	}
}

/**
 * Tell the platform a tour was started (one entry = one visit of that tier) or
 * finished (once per tier per browser). Fire-and-forget, `keepalive` so a
 * finale followed straight by a click away still lands.
 */
export function reportTour(tier: SandboxProduct, event: 'started' | 'completed'): void {
	if (tier !== 'raise' && tier !== 'scout') return;
	const v = storedVisitor();
	if (!v) return;
	if (event === 'completed') {
		const once = `stx-sandbox-completed-${tier}`;
		try {
			if (window.localStorage.getItem(once)) return;
			window.localStorage.setItem(once, '1');
		} catch {
			/* storage blocked: report anyway (the server keeps the first time) */
		}
	}
	void fetch('/api/visitor', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...v, tier, event }),
		keepalive: true,
	}).catch(() => undefined);
}
