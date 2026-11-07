import { NextResponse } from 'next/server';

/**
 * The VisitorGate's name + email, forwarded server-side to the platform API
 * (POST /api/public/sandbox-visitors), which stores it. Server-to-server, so
 * the API needs no CORS entry for this site; it needs BACKEND_URL set in this
 * project's Vercel env (e.g. https://api.sportstechx.com).
 *
 * This is the only request the sandbox makes beyond its own pages: everything
 * else is answered by lib/sandbox/mock-api.ts in the browser.
 *
 * Abuse guards: a browser request from another site is refused (Origin), and
 * PROXY_SECRET (server-only env, same value on the API) proves to the API that
 * the call came from here, so nobody can write to it directly. With it we also
 * pass the visitor's IP (Vercel sets x-real-ip; clients can't forge it), so the
 * API rate-limits each visitor rather than everyone sharing this server's IP.
 */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '') || undefined;

export async function POST(req: Request) {
	const origin = req.headers.get('origin');
	const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
	if (origin && host && origin.replace(/^https?:\/\//, '') !== host) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
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
		headers: {
			'Content-Type': 'application/json',
			...(process.env.PROXY_SECRET ? {
				'x-proxy-secret': process.env.PROXY_SECRET,
				'x-visitor-ip': req.headers.get('x-real-ip') ?? '',
			} : {}),
		},
		body: JSON.stringify({
			email,
			name,
			tier: body.tier === 'raise' || body.tier === 'scout' ? body.tier : undefined,
			...(body.event === 'completed' ? { event: 'completed' } : {}),
		}),
		signal: AbortSignal.timeout(8000),
	}).catch(() => null);
	if (res?.status === 400) return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
	if (!res || !res.ok) return NextResponse.json({ error: 'unavailable' }, { status: 502 });
	return NextResponse.json({ ok: true });
}
