import { NextResponse } from 'next/server';

/**
 * The VisitorGate's name + email, forwarded server-side to the platform API
 * (POST /api/public/sandbox-visitors), which stores it. Server-to-server, so
 * the API needs no CORS entry for this site; it needs BACKEND_URL set in this
 * project's Vercel env (e.g. https://api.sportstechx.com).
 *
 * This is the only request the sandbox makes beyond its own pages: everything
 * else is answered by lib/sandbox/mock-api.ts in the browser.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '') || undefined;

export async function POST(req: Request) {
	const raw: unknown = await req.json().catch(() => null);
	const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
	const email = str(body.email, 320);
	const name = str(body.name, 200);
	if (!email || !EMAIL.test(email) || !name) {
		return NextResponse.json({ error: 'Enter your name and a valid email address.' }, { status: 400 });
	}
	const base = process.env.BACKEND_URL;
	if (!base) return NextResponse.json({ error: 'unavailable' }, { status: 503 });

	const res = await fetch(`${base}/api/public/sandbox-visitors`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			email,
			name,
			tier: body.tier === 'raise' || body.tier === 'scout' ? body.tier : undefined,
		}),
		signal: AbortSignal.timeout(8000),
	}).catch(() => null);
	if (res?.status === 400) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
	if (!res || !res.ok) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
	const data = (await res.json().catch(() => ({}))) as { id?: string };
	return NextResponse.json({ ok: true, ...(data.id ? { id: data.id } : {}) });
}
