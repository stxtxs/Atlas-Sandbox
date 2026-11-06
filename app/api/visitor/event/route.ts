import { NextResponse } from 'next/server';

/**
 * A tour started / finished, for a visitor who already gave name + email:
 * forwarded to POST /api/public/sandbox-visitors/:id/events, which keeps the
 * first time per tier (raise_started_at, scout_completed_at, ...).
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
	const raw: unknown = await req.json().catch(() => null);
	const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const { id, tier, event } = body;
	if (typeof id !== 'string' || !UUID.test(id) || (tier !== 'raise' && tier !== 'scout') || (event !== 'started' && event !== 'completed')) {
		return NextResponse.json({ error: 'bad request' }, { status: 400 });
	}
	const base = process.env.BACKEND_URL;
	if (!base) return NextResponse.json({ error: 'unavailable' }, { status: 503 });
	const res = await fetch(`${base}/api/public/sandbox-visitors/${id}/events`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ tier, event }),
		signal: AbortSignal.timeout(8000),
	}).catch(() => null);
	if (!res || !res.ok) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
	return NextResponse.json(await res.json().catch(() => ({ ok: true })));
}
