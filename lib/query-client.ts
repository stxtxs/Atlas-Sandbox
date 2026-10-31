'use client';

import useSWR, { mutate as globalMutate, type SWRConfiguration, type Key } from 'swr';
import { mockFetch } from './sandbox/mock-api';

// The tutorial has no backend and no session: every request below goes to
// mockFetch (lib/sandbox/mock-api.ts), which answers from sample data.

export function clearAuthCache(): void {}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  return {};
}

/** This app's error envelope, as the server's exceptions filter emits it. */
interface ApiErrorBody {
  message?: unknown;
  error?: {
    code?: string;
    message?: string;
    details?: {
      required?: number;
      available?: number;
      credit_type?: 'ai' | 'integration';
      issues?: Array<{ path?: unknown[]; message?: string }>;
    };
  } | string;
}

/** This app's structured `{error:{code,...}}` envelope, or null if the body is
 *  not JSON or carries only a bare string error (NestJS's default shape). */
function parseApiError(text: string): Exclude<ApiErrorBody['error'], string | undefined> | null {
  try {
    const { error } = JSON.parse(text) as ApiErrorBody;
    return error && typeof error === 'object' ? error : null;
  } catch {
    return null;
  }
}

/**
 * Parse a JSON response that might legitimately have no body.
 *
 * `res.json()` throws "Unexpected end of JSON input" on an empty body, and a
 * 200-with-no-body is a normal NestJS outcome: a handler that returns `null`
 * (e.g. `GET /api/billing/subscription` → `getActiveSubscription() ?? null`)
 * serialises to zero bytes, as does any 204. Callers already treat these as
 * "nothing yet" — the billing page reads `sub.data?.subscription_status` — so
 * the absence of a body is data, not a parse failure.
 */
async function readJson<T>(res: Response): Promise<T | null> {
	const text = await res.text();
	if (!text) return null;
	return JSON.parse(text) as T;
}

async function handleResponse(res: Response, context?: string): Promise<void> {
  if (res.ok) return;

  const text = await res.text().catch(() => res.statusText);

  // Surface the server's human message (NestJS `{message}` / this app's
  // `{error:{message}}` / a validation array) instead of dumping raw JSON.
  let message = `Request failed (${res.status}).`;
  try {
    const body = JSON.parse(text) as { message?: unknown; error?: unknown };
    const err = body.error as { message?: unknown; details?: { issues?: Array<{ path?: unknown[]; message?: string }> } } | string | undefined;
    let cand =
      (typeof err === 'object' && err && typeof err.message === 'string' ? err.message : undefined)
      ?? (typeof body.message === 'string' ? body.message : undefined)
      ?? (Array.isArray(body.message) ? (body.message as string[]).join(', ') : undefined)
      ?? (typeof err === 'string' ? err : undefined);
    // Zod validation errors: append the offending field(s) so it's never a mystery.
    const issues = typeof err === 'object' && err ? err.details?.issues : undefined;
    if (issues?.length) {
      const fields = issues.map((i) => `${(i.path ?? []).join('.') || 'body'}${i.message ? ` (${i.message})` : ''}`).join('; ');
      cand = `${cand ?? 'Validation failed'} — ${fields}`;
    }
    if (cand && cand.trim()) message = cand;
  } catch {
    if (text && text.trim() && text.length < 300) message = text;
  }
  const e = new Error(message) as Error & { status?: number; context?: string; code?: string };
  e.status = res.status;
  // Carry the server's machine-readable code alongside the human message. The
  // message is for the user; the code is what callers and the global `onError`
  // can branch on without string-matching prose.
  const code = parseApiError(text)?.code;
  if (code) e.code = code;
  // The callers all pass `${method} ${url}`. Attaching it rather than dropping
  // it is what makes a logged failure identifiable; the message itself stays
  // user-facing and unchanged.
  if (context) e.context = context;
  throw e;
}

// ─── apiRequest (non-GET writes) ─────────────────────────────────────────────
//
// Write path used by mutations. Not an SWR hook — call it from any handler.

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown,
): Promise<Response> {
  const res = await mockFetch(url, {
    method,
    headers: data ? { 'Content-Type': 'application/json' } : {},
    body: data ? JSON.stringify(data) : undefined,
  });
  await handleResponse(res, `${method} ${url}`);
  return res;
}

// ─── URL builder ─────────────────────────────────────────────────────────────
//
// Serializes a key tuple `[path, paramsObj?, ...]` into a URL with query
// string. Arrays expand to repeated keys. null/undefined/'' skipped so callers
// can pass them through cleanly. The `qk.*` helper produces tuples in this
// shape; the SWR fetcher consumes them directly.

export function buildUrl(queryKey: readonly unknown[]): string {
  const base = queryKey[0] as string;
  const params = new URLSearchParams();
  for (const part of queryKey.slice(1)) {
    if (!part || typeof part !== 'object' || Array.isArray(part)) continue;
    for (const [k, v] of Object.entries(part as Record<string, unknown>)) {
      if (v === undefined || v === null || v === '') continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          if (item === undefined || item === null || item === '') continue;
          params.append(k, String(item));
        }
      } else if (typeof v === 'object') {
        params.set(k, JSON.stringify(v));
      } else {
        params.set(k, String(v));
      }
    }
  }
  const qs = params.toString();
  if (!qs) return base;
  return `${base}${base.includes('?') ? '&' : '?'}${qs}`;
}

// ─── Polling gate ────────────────────────────────────────────────────────────
//
// SWR doesn't expose runtime mutation of its config, so we gate the fetcher
// itself. `disableQueryPolling()` sets this flag; the fetcher returns null
// while it's on. Used at logout to stop new requests before the auth state has
// fully unwound.

let pollingDisabled = false;

// ─── Fetcher ─────────────────────────────────────────────────────────────────

export async function fetcher<T = unknown>(key: Key): Promise<T | null> {
  if (pollingDisabled) {
    return null;
  }

  const queryKey = Array.isArray(key) ? key : [key];
  const url = buildUrl(queryKey);

  const res = await mockFetch(url);
  await handleResponse(res, `swr ${url}`);
  return await readJson<T>(res);
}

// Re-exported for any internal use; consumers should import from 'swr'.
export { useSWR };

// ─── SWR global config ───────────────────────────────────────────────────────

/**
 * Server error codes that represent an un-started flow rather than a fault, so
 * the global `onError` stays quiet for them. Keep this short and justified —
 * every entry is a failure someone has decided not to hear about.
 */
/** Domain refusals a screen handles itself — never worth a toast.
 *  Both are "you have not set this up yet", not failures. */
// AI_UNAVAILABLE is an upstream outage, not a bug in this app — it carries its
// own user-facing message, so don't also log it and toast it.
const EXPECTED_CODES = new Set(['NO_RAISE', 'SCOUT_NOT_SET_UP', 'AI_UNAVAILABLE']);

export const swrConfig: SWRConfiguration = {
  fetcher,
  dedupingInterval: 5 * 60_000,
  revalidateOnFocus: false,
  // Refetch when the network comes back so a request that failed/returned
  // stale while offline recovers on its own instead of needing a reload.
  revalidateOnReconnect: true,
  errorRetryCount: 2,
  shouldRetryOnError: (err: unknown) => {
    if (!(err instanceof Error)) return true;
    // A 404 won't become a 200.
    if ((err as Error & { status?: number }).status === 404) return false;
    return true;
  },
  /**
   * Last stop for a failed request.
   *
   * There was no `onError` at all, which meant any API failure a component
   * didn't explicitly render was absorbed in silence — and with no error
   * reporter in this client, the whole API failure rate was unobservable.
   * This at least puts it in the console with its key, so a failure is visible
   * to anyone with devtools open and to a session replay later.
   *
   * Deliberately quiet for the two cases that already have UI: both open a
   * modal of their own, and a 401 is the signed-out path, not a fault.
   */
  onError: (err: unknown, key: string) => {
    const e = err instanceof Error ? (err as Error & { status?: number; code?: string; context?: string }) : undefined;
    if (e?.status === 401) return;
    // Domain states the server reports as errors but which are normal for a
    // user who hasn't finished a flow. Verified against the live API:
    // `GET /api/raise/pipeline` returns 404 `{error:{code:'NO_RAISE'}}` until
    // raise setup completes, and the Investors page fetches it unconditionally
    // to mark which investors are already tracked — so a correctly working page
    // shouted in the console. (`GET /api/raise` is fine: it answers 200 with
    // `{raise:null,criteria:null}`.) A console that cries wolf is worse than no
    // console, which is the whole reason this handler exists.
    if (e?.code && EXPECTED_CODES.has(e.code)) return;
    console.error('[swr]', key, e?.context ?? '', err);
  },
  keepPreviousData: true,
};

// ─── Polling toggles ─────────────────────────────────────────────────────────
//
// Called from AppInit on login/logout. Disable also drops every cached entry.

export function disableQueryPolling(): void {
  pollingDisabled = true;
  clearAuthCache();
  void globalMutate(() => true, undefined, { revalidate: false });
}

export function enableQueryPolling(): void {
  pollingDisabled = false;
}
