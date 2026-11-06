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

const onceKey = (tier: SandboxProduct, event: 'started' | 'completed') => `stx-sandbox-${event}-${tier}`;

/** The gate's own submit already counted this tier's start in this tab. */
export function markStarted(tier: SandboxProduct): void {
	try { window.sessionStorage.setItem(onceKey(tier, 'started'), '1'); } catch { /* storage blocked */ }
}

/**
 * Tell the platform a tour was started or finished. Fire-and-forget,
 * `keepalive` so a finale followed straight by a click away still lands.
 * A start counts once per tier per tab (a reload doesn't add a visit); a
 * finish once per tier per browser.
 */
export function reportTour(tier: SandboxProduct, event: 'started' | 'completed'): void {
	if (tier !== 'raise' && tier !== 'scout') return;
	const v = storedVisitor();
	if (!v) return;
	try {
		const box = event === 'completed' ? window.localStorage : window.sessionStorage;
		if (box.getItem(onceKey(tier, event))) return;
		box.setItem(onceKey(tier, event), '1');
	} catch {
		/* storage blocked: report anyway */
	}
	void fetch('/api/visitor', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ ...v, tier, event }),
		keepalive: true,
	}).catch(() => undefined);
}
