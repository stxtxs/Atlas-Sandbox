/**
 * Watchlists in the tutorial (every tier). Spread into coreSandboxRoutes.
 *
 * Each tier's sample workspace starts with two seeded company lists drawn from
 * the world (fixtures/world.ts), kept statefully in ctx.state: create, rename,
 * delete, add/remove companies, the saved List/Board view and Scout's board
 * stages all round-trip. Raise investor lists (`kind: 'investors'`) live here
 * too; their members are pipeline rows (raise-routes.ts `watchlist_id`).
 *
 * Kitroom and Fanloop are deliberately in no list: tours save Kitroom
 * themselves, and Fanloop is the Raise visitor's own company.
 *
 * Shapes follow the server controller (user-watchlists.controller.ts) and the
 * consuming types in components/features/watchlists/use-company-watchlists.ts.
 */
import { mockJson } from './mock-api';
import type { CompanyWatchlist, WatchlistCompany } from '@/components/features/watchlists/use-company-watchlists';
import { companyBy, companyByName } from './fixtures/world';
import { companyListItem } from './shared/catalog';
import { daysFromNow, json, type SandboxCtx, type SandboxRoute } from './types';

interface StoredList {
	id: string; name: string; description: string | null; color: string | null; created_at: string;
	kind: 'companies' | 'investors'; view_mode: 'list' | 'board';
}
type StoredCompany = WatchlistCompany & { stage?: string | null };
interface WatchlistState { lists: StoredList[]; items: Record<string, StoredCompany[]> }

const STATE_KEY = 'watchlists_v2';
const NAME_MAX = 120;
/** The seeded shortlist, already staged on the Scout board. */
export const SHORTLIST_ID = 'sample-wl-shortlist';
export const PORTFOLIO_ID = 'sample-wl-portfolio';

/** [company, days since added, Scout board stage]. */
const SEED: Record<string, [string, number, string][]> = {
	[SHORTLIST_ID]: [['Matchday Loop', 3, 'meeting'], ['Courtline', 6, 'reviewing'], ['Stridewise', 9, 'identified'], ['Goalsight', 14, 'due_diligence']],
	[PORTFOLIO_ID]: [['Kickframe Analytics', 20, 'invested'], ['Arenaflow', 33, 'invested'], ['Replaykit', 41, 'passed']],
};

function stored(idOrSlug: string, addedDaysAgo: number, stage: string | null = null): StoredCompany | null {
	const c = companyBy(idOrSlug);
	if (!c) return null;
	const row = companyListItem(c);
	return {
		id: row.id, name: row.name, slug: row.slug, website: row.website, custom_logo_url: null, description: row.description,
		primary_sector: row.primary_sector, hq_city: row.hq_city, hq_country: row.hq_country, total_funding_usd: row.total_funding_usd,
		added_at: daysFromNow(-addedDaysAgo), stage,
	};
}

function load(ctx: SandboxCtx): WatchlistState {
	const existing = ctx.state[STATE_KEY] as WatchlistState | undefined;
	if (existing?.lists && existing.items) return existing;
	const items = Object.fromEntries(Object.entries(SEED).map(([id, rows]) =>
		[id, rows.map(([name, days, stage]) => stored(companyByName(name).id, days, stage)!)]));
	return save(ctx, {
		lists: [
			{ id: SHORTLIST_ID, name: 'Shortlist', description: 'Companies worth a closer look this quarter.', color: null, created_at: daysFromNow(-21), kind: 'companies', view_mode: 'list' },
			{ id: PORTFOLIO_ID, name: 'Portfolio watch', description: 'Companies to keep tracking after a first conversation.', color: null, created_at: daysFromNow(-40), kind: 'companies', view_mode: 'list' },
		],
		items,
	});
}

function save(ctx: SandboxCtx, next: WatchlistState): WatchlistState {
	ctx.state[STATE_KEY] = next;
	ctx.save();
	return next;
}

/** Ids of every company in any of the tier's lists — the Signals "watchlist only" filter. */
export function watchedCompanyIds(ctx: SandboxCtx): Set<string> {
	const st = load(ctx);
	return new Set(Object.values(st.items).flat().map((c) => c.id));
}

/** Investor lists count their pipeline rows (Raise only; `watchlist_id` on each row). */
async function investorCounts(ctx: SandboxCtx): Promise<Record<string, number>> {
	if (ctx.product !== 'raise') return {};
	const pipe = await mockJson<{ data?: Array<{ watchlist_id?: string | null }> }>('/api/raise/pipeline');
	const counts: Record<string, number> = {};
	for (const r of pipe?.data ?? []) if (r.watchlist_id) counts[r.watchlist_id] = (counts[r.watchlist_id] ?? 0) + 1;
	return counts;
}

const listOut = (l: StoredList, st: WatchlistState, invCounts: Record<string, number> = {}): CompanyWatchlist & { created_at: string } =>
	({ ...l, company_count: l.kind === 'investors' ? invCounts[l.id] ?? 0 : st.items[l.id]?.length ?? 0 });

const notFound = () => json({ error: { code: 'NOT_FOUND', message: 'Watchlist not found' } }, 404);
const badRequest = (message: string) => json({ error: { code: 'VALIDATION_ERROR', message } }, 400);
const noContent = () => new Response(null, { status: 204 });

const cleanName = (n: unknown): string | null => {
	const name = typeof n === 'string' ? n.trim() : '';
	return name && name.length <= NAME_MAX ? name : null;
};
const optText = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

export const watchlistSandboxRoutes: SandboxRoute[] = [
	['GET', '/api/user-watchlists', async (ctx) => {
		const st = load(ctx);
		const counts = await investorCounts(ctx);
		return { data: st.lists.map((l) => listOut(l, st, counts)) };
	}],
	['POST', '/api/user-watchlists', (ctx) => {
		const b = (ctx.body ?? {}) as { name?: unknown; description?: unknown; color?: unknown; kind?: unknown };
		const name = cleanName(b.name);
		if (!name) return badRequest(`Give the watchlist a name (up to ${NAME_MAX} characters).`);
		const st = load(ctx);
		const list: StoredList = {
			id: `sample-wl-${Date.now().toString(36)}`, name, description: optText(b.description), color: optText(b.color),
			created_at: daysFromNow(0), kind: b.kind === 'investors' ? 'investors' : 'companies', view_mode: 'list',
		};
		const next = save(ctx, { lists: [list, ...st.lists], items: { ...st.items, [list.id]: [] } });
		return json(listOut(list, next), 201);
	}],
	// Before `:id` routes with two segments, so "containing" is never read as a list id.
	['GET', '/api/user-watchlists/containing/:companyId', (ctx) => {
		const st = load(ctx);
		return { data: st.lists.filter((l) => st.items[l.id]?.some((c) => c.id === ctx.params.companyId)).map((l) => l.id) };
	}],
	['GET', '/api/user-watchlists/:id', async (ctx) => {
		const st = load(ctx);
		const list = st.lists.find((l) => l.id === ctx.params.id);
		return list ? listOut(list, st, await investorCounts(ctx)) : notFound();
	}],
	// Rename and/or save the List/Board view (setWatchlistView sends only `view_mode`).
	['PATCH', '/api/user-watchlists/:id', (ctx) => {
		const st = load(ctx);
		const list = st.lists.find((l) => l.id === ctx.params.id);
		if (!list) return notFound();
		const b = (ctx.body ?? {}) as { name?: unknown; view_mode?: unknown };
		const name = 'name' in b ? cleanName(b.name) : list.name;
		if (!name) return badRequest(`Give the watchlist a name (up to ${NAME_MAX} characters).`);
		const view_mode = b.view_mode === 'board' || b.view_mode === 'list' ? b.view_mode : list.view_mode;
		const updated = { ...list, name, view_mode };
		const next = save(ctx, { ...st, lists: st.lists.map((l) => (l.id === list.id ? updated : l)) });
		return listOut(updated, next);
	}],
	['DELETE', '/api/user-watchlists/:id', (ctx) => {
		const st = load(ctx);
		if (!st.lists.some((l) => l.id === ctx.params.id)) return notFound();
		const items = Object.fromEntries(Object.entries(st.items).filter(([k]) => k !== ctx.params.id));
		save(ctx, { lists: st.lists.filter((l) => l.id !== ctx.params.id), items });
		return noContent();
	}],
	// A made-up share link: there is no public page behind it in the tutorial.
	['POST', '/api/user-watchlists/:id/share', ({ params }) => ({ share_token: `demo-${params.id}` })],
	['DELETE', '/api/user-watchlists/:id/share', () => noContent()],
	['GET', '/api/user-watchlists/:id/companies', (ctx) => {
		const st = load(ctx);
		return st.lists.some((l) => l.id === ctx.params.id) ? { data: st.items[ctx.params.id] ?? [] } : notFound();
	}],
	['POST', '/api/user-watchlists/:id/companies/:companyId', (ctx) => {
		const st = load(ctx);
		const { id, companyId } = ctx.params;
		if (!st.lists.some((l) => l.id === id)) return notFound();
		const current = st.items[id] ?? [];
		if (!current.some((c) => c.id === companyId)) {
			const added = stored(companyId, 0);
			if (!added) return json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404);
			save(ctx, { ...st, items: { ...st.items, [id]: [added, ...current] } });
		}
		return { ok: true };
	}],
	['DELETE', '/api/user-watchlists/:id/companies/:companyId', (ctx) => {
		const st = load(ctx);
		const { id, companyId } = ctx.params;
		if (!st.lists.some((l) => l.id === id)) return notFound();
		save(ctx, { ...st, items: { ...st.items, [id]: (st.items[id] ?? []).filter((c) => c.id !== companyId) } });
		return noContent();
	}],
	// Scout board stage moves (scout.controller.ts moveStage; watchlist-board.tsx).
	['PATCH', '/api/scout/watchlists/:id/companies/:companyId/stage', (ctx) => {
		const st = load(ctx);
		const { id, companyId } = ctx.params;
		const stage = optText((ctx.body as { stage?: unknown } | null)?.stage);
		if (!stage) return badRequest('Pick a stage.');
		const items = st.items[id];
		if (!items?.some((c) => c.id === companyId)) return notFound();
		save(ctx, { ...st, items: { ...st.items, [id]: items.map((c) => (c.id === companyId ? { ...c, stage } : c)) } });
		return { moved: true };
	}],
];
