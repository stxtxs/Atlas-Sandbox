/**
 * Whether this browser already gave its name and email before a tour (the
 * VisitorGate). The sandbox has no accounts or session, so the flag lives in
 * localStorage; it holds no personal data, only that the form was sent.
 * Storage can be unavailable (private mode, blocked site data): then the gate
 * simply asks again, which is the safe direction.
 */
const KEY = 'stx-sandbox-visitor';

export function hasVisitor(): boolean {
	try {
		return Boolean(window.localStorage.getItem(KEY));
	} catch {
		return false;
	}
}

export function rememberVisitor(): void {
	try {
		window.localStorage.setItem(KEY, JSON.stringify({ submitted: true, at: new Date().toISOString() }));
	} catch {
		/* storage blocked: the gate asks again next time */
	}
}
