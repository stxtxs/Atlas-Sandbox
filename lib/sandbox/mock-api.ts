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
import { coreSandboxRoutes } from './core-routes';
import { exploreSandboxRoutes } from './explore-routes';
import { raiseSandboxRoutes } from './raise-routes';
import { scoutSandboxRoutes } from './scout-routes';
import { matchPath } from './match-path';
import { PRACTICE_REQUEST_EVENT, type PracticeRequestDetail } from './events';
import { json, type SandboxProduct, type SandboxRoute } from './types';

const ROUTES: Record<SandboxProduct, SandboxRoute[]> = {
	explore: [...exploreSandboxRoutes, ...coreSandboxRoutes],
	raise: [...raiseSandboxRoutes, ...coreSandboxRoutes],
	scout: [...scoutSandboxRoutes, ...coreSandboxRoutes],
};

function parseBody(body: BodyInit | null | undefined): unknown {
	if (typeof body !== 'string') return undefined;
	try { return JSON.parse(body); } catch { return body; }
}

export async function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	const url = new URL(raw, window.location.origin);
	const method = (init?.method ?? 'GET').toUpperCase();
	if (url.origin !== window.location.origin || !url.pathname.startsWith('/api/')) {
		throw new Error(`The tutorial has no backend: refused ${method} ${raw}`);
	}

	const product = activeSandbox() ?? 'explore';
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
	window.dispatchEvent(new CustomEvent<PracticeRequestDetail>(PRACTICE_REQUEST_EVENT, { detail: { method, path: url.pathname, body } }));
	return res ?? json(method === 'GET' ? [] : {});
}
