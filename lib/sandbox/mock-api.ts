'use client';

/**
 * The tutorial's whole "backend". Same signature as `fetch`, but it never
 * touches the network: every call is answered here from the tour's sample
 * data (explore-routes.ts, raise-routes.ts, scout-routes.ts, then
 * core-routes.ts). Anything unanswered gets an empty list.
 *
 * Product code reaches it through lib/query-client.ts (SWR + apiRequest) and
 * the two streaming call sites (chat, deck analysis). After each request it
 * fires PRACTICE_REQUEST_EVENT (events.ts) so the coach can advance on
 * "the user did X" steps.
 */
import { activeSandbox, readSandboxData, writeSandboxData } from './store';
import { analyticsSandboxRoutes } from './analytics-routes';
import { coreSandboxRoutes } from './core-routes';
import { exploreSandboxRoutes } from './explore-routes';
import { raiseSandboxRoutes } from './raise-routes';
import { scoutSandboxRoutes } from './scout-routes';
import { matchPath } from './match-path';
import { readTutorialParams } from './tutorial-url';
import { PRACTICE_REQUEST_EVENT, type PracticeRequestDetail } from './events';
import { json, type SandboxProduct, type SandboxRoute } from './types';

/** First match wins: the tier's own routes, then the shared ones. */
const SHARED: SandboxRoute[] = [...analyticsSandboxRoutes, ...coreSandboxRoutes];
const ROUTES: Record<SandboxProduct, SandboxRoute[]> = {
	explore: [...exploreSandboxRoutes, ...SHARED],
	raise: [...raiseSandboxRoutes, ...SHARED],
	scout: [...scoutSandboxRoutes, ...SHARED],
};

function parseBody(body: BodyInit | null | undefined): unknown {
	if (typeof body !== 'string') return undefined;
	try { return JSON.parse(body); } catch { return body; }
}

/**
 * `quiet`: a mock handler reading another mock route (e.g. Scout home counting
 * watchlist companies) — answered the same way, but not reported to the coach
 * as something the visitor did.
 */
export async function mockFetch(input: RequestInfo | URL, init?: RequestInit, { quiet = false } = {}): Promise<Response> {
	const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	const url = new URL(raw, window.location.origin);
	const method = (init?.method ?? 'GET').toUpperCase();
	if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
		throw new Error(`The tutorial has no backend: refused ${method} ${raw}`);
	}

	// The URL's tour first: a tour link opened in a new tab, a bookmark or a
	// pasted link asks for data before the shell has adopted the URL into the
	// tour state, and answering those first requests from the generic workspace
	// left the page on it (Scout crashed on the wrong shape). Sample data is
	// built on demand from each tier's seed, so nothing else needs preparing.
	const product = readTutorialParams(window.location.search)?.tier ?? activeSandbox() ?? 'explore';
	const body = parseBody(init?.body);
	let res: Response | undefined;
	for (const [m, pattern, handler] of ROUTES[product]) {
		if (m !== method) continue;
		const params = matchPath(pattern, url.pathname);
		if (!params) continue;
		const state = readSandboxData(product);
		const out = await handler({ method, url, params, body, product, state, save: () => writeSandboxData(product, state) });
		if (out !== undefined) res = out instanceof Response ? out : json(out);
		break;
	}
	if (!quiet) window.dispatchEvent(new CustomEvent<PracticeRequestDetail>(PRACTICE_REQUEST_EVENT, { detail: { method, path: url.pathname, body } }));
	return res ?? json(method === 'GET' ? [] : {});
}

/** Another mock route's JSON body, for handlers that build on each other. Null when it isn't OK. */
export async function mockJson<T>(path: string): Promise<T | null> {
	const res = await mockFetch(path, undefined, { quiet: true });
	return res.ok ? ((await res.json()) as T) : null;
}
