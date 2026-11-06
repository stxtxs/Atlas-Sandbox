/**
 * The visitor behind this browser, after the name + email gate (VisitorGate).
 * The sandbox has no accounts or session, so it lives in localStorage: the
 * opaque visitor id the API returned (no name, no email), used to report which
 * tours were started and finished without asking again.
 *
 * Storage can be unavailable (private mode, blocked site data): then the gate
 * simply asks again, which is the safe direction.
 */
import type { SandboxProduct } from './types';

// v3 (6 Nov 2026): earlier flags could have been set for submissions an old
// honeypot dropped, and carried no id. Everyone is asked once more.
const KEY = 'stx-sandbox-visitor-v3';

interface Stored { submitted: true; id?: string; at: string }

function read(): Stored | null {
	try {
		const raw = window.localStorage.getItem(KEY);
		return raw ? (JSON.parse(raw) as Stored) : null;
	} catch {
		return null;
	}
}

export function hasVisitor(): boolean {
	return read() !== null;
}

export function rememberVisitor(id: string | undefined): void {
	try {
		window.localStorage.setItem(KEY, JSON.stringify({ submitted: true, ...(id ? { id } : {}), at: new Date().toISOString() }));
	} catch {
		/* storage blocked: the gate asks again next time */
	}
}

/**
 * Tell the platform a tour was started or finished (it keeps the first time per
 * tier). Fire-and-forget, `keepalive` so a finale followed straight by a click
 * away still lands. `completed` once per tier per browser, `started` once per
 * tier per tab.
 */
export function reportTour(tier: SandboxProduct, event: 'started' | 'completed'): void {
	if (tier !== 'raise' && tier !== 'scout') return;
	const id = read()?.id;
	if (!id) return;
	const once = `stx-sandbox-${event}-${tier}`;
	try {
		const box = event === 'completed' ? window.localStorage : window.sessionStorage;
		if (box.getItem(once)) return;
		box.setItem(once, '1');
	} catch {
		/* storage blocked: report anyway (the server keeps only the first) */
	}
	void fetch('/api/visitor/event', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ id, tier, event }),
		keepalive: true,
	}).catch(() => undefined);
}
