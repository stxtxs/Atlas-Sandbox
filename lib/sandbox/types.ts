/**
 * Shared types for the tutorial's mock API (mock-api.ts): each product's
 * routes answer `/api/*` from sample data. See lib/sandbox/README.md.
 */
export type SandboxProduct = 'explore' | 'raise' | 'scout';

export interface SandboxCtx {
	method: string;
	url: URL;
	/** `:param` values from the matched pattern. */
	params: Record<string, string>;
	/** Parsed JSON body (or raw string) for writes; undefined for GET. */
	body: unknown;
	product: SandboxProduct;
	/** Browser-persisted per-product state for writes (pipeline moves, thesis edits…). Mutate then call save(). */
	state: Record<string, unknown>;
	save: () => void;
}

/** Return a Response, or a plain value to be sent as JSON 200. `undefined` = not answered (empty list). */
export type SandboxHandler = (ctx: SandboxCtx) => unknown | Response | Promise<unknown | Response>;

/** [method, path pattern with `:params`, handler]. Pattern matches `url.pathname` exactly (no query). */
export type SandboxRoute = [method: string, pattern: string, handler: SandboxHandler];

export const json = (data: unknown, status = 200) =>
	new Response(JSON.stringify(data ?? null), { status, headers: { 'Content-Type': 'application/json' } });

/** Server-sent-events response (chat, deck analysis stream). */
export function sse(events: Array<{ event: string; data: unknown }>, delayMs = 40): Response {
	const enc = new TextEncoder();
	const stream = new ReadableStream({
		async start(ctrl) {
			for (const e of events) {
				ctrl.enqueue(enc.encode(`event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`));
				await new Promise((r) => setTimeout(r, delayMs));
			}
			ctrl.close();
		},
	});
	return new Response(stream, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
}

const day = (n: number) => new Date(Date.now() + n * 864e5).toISOString();
/** ISO timestamp n days from now (negative = past), for sample data. */
export const daysFromNow = day;
