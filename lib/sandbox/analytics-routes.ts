/**
 * Market numbers for Market → Analysis (components/features/market/market-analysis.tsx)
 * and Market → Monthly Roundup (market-roundup.tsx), aggregated from the
 * made-up world in fixtures/world.ts. Every tier.
 *
 * Everything that names a company, sector, country or month is computed from
 * the world's own rounds and acquisitions, so the Analysis top table, the
 * Roundup KPIs and the Roundup's "rounds this month" list (served from /api/deals
 * by core-routes.ts) all agree. Only the 10-year trend chart adds a fixed
 * "rest of the market" backfill for past years, so the line reads as a market
 * rather than three years of a 24-company sample.
 *
 * Only the endpoints a page actually calls are answered; the other
 * /api/analytics/* keys in lib/query-keys.ts have no consumer.
 */
import {
	ACQUISITIONS, COMPANIES, DEALS, SECTORS, ARTICLES,
	companyByName, countryByCode, type WCompany, type WSector,
} from './fixtures/world';
import type { SandboxRoute } from './types';

const DAY = 864e5;
const dateOf = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY);

type Period = 'ytd' | '12m' | 'all';
const periodOf = (url: URL): Period => {
	const p = url.searchParams.get('period');
	return p === 'ytd' || p === '12m' ? p : 'all';
};
function inPeriod(daysAgo: number, period: Period): boolean {
	if (period === 'all') return true;
	if (period === '12m') return daysAgo <= 365;
	return dateOf(daysAgo).getUTCFullYear() === new Date().getUTCFullYear();
}
const limitOf = (url: URL, dflt: number) => Math.max(1, Number(url.searchParams.get('limit')) || dflt);

// ─── Sector roll-ups ─────────────────────────────────────────────────────────

const sectorOf = (name: string): WSector => SECTORS.find((s) => s.name === name)!;
const parentOf = (s: WSector) => SECTORS.find((p) => p.id === s.parent_id);
/** [top-level sector, sub-sector] for a company's sector (a niche rolls up to its sub-sector). */
function sectorPath(c: WCompany): [WSector, WSector] {
	const s = sectorOf(c.sector);
	const p = parentOf(s);
	if (!p) return [s, s];
	const pp = parentOf(p);
	return pp ? [pp, p] : [p, s];
}

// ─── The rows every aggregate is built from ─────────────────────────────────

interface Row {
	/** The company the money went to (acquiree for M&A), when it is in the world. */
	company: WCompany | null;
	name: string;
	amount: number;
	daysAgo: number;
	countryCode: string;
	/** M&A only. */
	acquirer?: string;
	acquirerCountry?: string;
}

const FUNDING: Row[] = DEALS.map((d) => {
	const c = companyByName(d.company);
	return { company: c, name: c.name, amount: d.amount_usd ?? 0, daysAgo: d.daysAgo, countryCode: c.country };
});

/** Off-world targets (a product line, a start-up outside the sample) borrow the acquirer's sector. */
const MA: Row[] = ACQUISITIONS.map((a) => {
	const target = COMPANIES.find((c) => c.name === a.target) ?? null;
	const buyer = COMPANIES.find((c) => c.name === a.acquirer) ?? null;
	return {
		company: target ?? buyer, name: a.target, amount: a.price_usd ?? 0, daysAgo: a.daysAgo,
		countryCode: target?.country ?? a.acquirerCountry, acquirer: a.acquirer, acquirerCountry: a.acquirerCountry,
	};
});

interface Group { label: string; deal_count: number; total_amount: number }
function group(rows: Row[], key: (r: Row) => string | null): Group[] {
	const m = new Map<string, Group>();
	for (const r of rows) {
		const label = key(r);
		if (!label) continue;
		const g = m.get(label) ?? { label, deal_count: 0, total_amount: 0 };
		g.deal_count += 1;
		g.total_amount += r.amount;
		m.set(label, g);
	}
	return [...m.values()].sort((a, b) => b.total_amount - a.total_amount || b.deal_count - a.deal_count);
}
const bizLabel = (r: Row) => r.company?.model ?? null;

// ─── Analysis ────────────────────────────────────────────────────────────────

/**
 * Past-year totals for the companies outside the sample, as a share of the
 * sample's current-year total, newest first (last year, two years ago…).
 * ponytail: fixed curve, not modelled; the breakdowns below cover the sample only.
 */
const BACKFILL = [0.8, 0.68, 0.6, 0.74, 0.62, 0.34, 0.39, 0.3, 0.22, 0.18];

function annual(rows: Row[], url: URL) {
	const now = new Date().getUTCFullYear();
	const from = Number(url.searchParams.get('from')) || now - 9;
	const to = Number(url.searchParams.get('to')) || now;
	const cur = rows.filter((r) => dateOf(r.daysAgo).getUTCFullYear() === now);
	const curAmt = cur.reduce((s, r) => s + r.amount, 0);
	const out: { year: number; total_amount: number; deal_count: number }[] = [];
	for (let year = from; year <= to; year++) {
		const own = rows.filter((r) => dateOf(r.daysAgo).getUTCFullYear() === year);
		const ownAmt = own.reduce((s, r) => s + r.amount, 0);
		const share = year < now ? BACKFILL[now - year - 1] ?? 0 : 0;
		const target = Math.round(curAmt * share);
		out.push({
			year,
			total_amount: Math.max(ownAmt, target),
			deal_count: Math.max(own.length, Math.round(cur.length * share * 1.3)),
		});
	}
	return out;
}

function sectorTree(rows: Row[], url: URL) {
	const period = periodOf(url);
	const inP = rows.filter((r) => r.company && inPeriod(r.daysAgo, period));
	const tops = new Map<string, { sector_id: string; sector_name: string; total_amount: number; deal_count: number; kids: Map<string, { sector_id: string; sector_name: string; total_amount: number; deal_count: number }> }>();
	for (const r of inP) {
		const [top, sub] = sectorPath(r.company!);
		const t = tops.get(top.id) ?? { sector_id: top.id, sector_name: top.name, total_amount: 0, deal_count: 0, kids: new Map() };
		t.total_amount += r.amount; t.deal_count += 1;
		const k = t.kids.get(sub.id) ?? { sector_id: sub.id, sector_name: sub.name, total_amount: 0, deal_count: 0 };
		k.total_amount += r.amount; k.deal_count += 1;
		t.kids.set(sub.id, k);
		tops.set(top.id, t);
	}
	return [...tops.values()]
		.sort((a, b) => b.total_amount - a.total_amount)
		.slice(0, limitOf(url, 8))
		.map(({ kids, ...t }) => ({ ...t, children: [...kids.values()].sort((a, b) => b.total_amount - a.total_amount) }));
}

function topFunded(url: URL) {
	const rows = FUNDING.filter((r) => inPeriod(r.daysAgo, periodOf(url)));
	const by = new Map<string, { company_id: string; name: string; slug: string; website: string; custom_logo_url: null; total_raised: number; deal_count: number }>();
	for (const r of rows) {
		const c = r.company!;
		const e = by.get(c.id) ?? { company_id: c.id, name: c.name, slug: c.slug, website: c.website, custom_logo_url: null, total_raised: 0, deal_count: 0 };
		e.total_raised += r.amount; e.deal_count += 1;
		by.set(c.id, e);
	}
	return [...by.values()].sort((a, b) => b.total_raised - a.total_raised).slice(0, limitOf(url, 10));
}

function topAcquirers(url: URL) {
	const rows = MA.filter((r) => inPeriod(r.daysAgo, periodOf(url)));
	const by = new Map<string, { acquirer_name: string; acquirer_country: string; acquirer_website: string | null; acquirer_logo: null; acquirer_slug: string | null; deal_count: number; total_value: number }>();
	for (const r of rows) {
		const buyer = COMPANIES.find((c) => c.name === r.acquirer) ?? null;
		const e = by.get(r.acquirer!) ?? {
			acquirer_name: r.acquirer!, acquirer_country: countryByCode(r.acquirerCountry!).name,
			acquirer_website: buyer?.website ?? null, acquirer_logo: null, acquirer_slug: buyer?.slug ?? null, deal_count: 0, total_value: 0,
		};
		e.deal_count += 1; e.total_value += r.amount;
		by.set(r.acquirer!, e);
	}
	return [...by.values()].sort((a, b) => b.total_value - a.total_value || b.deal_count - a.deal_count).slice(0, limitOf(url, 10));
}

const fundingIn = (url: URL) => FUNDING.filter((r) => inPeriod(r.daysAgo, periodOf(url)));

// ─── Monthly Roundup ─────────────────────────────────────────────────────────

const ym = (daysAgo: number) => { const d = dateOf(daysAgo); return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 }; };
const inMonth = (r: { daysAgo: number }, year: number, month: number) => { const d = ym(r.daysAgo); return d.year === year && d.month === month; };
const fmtM = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n > 0 ? `$${Math.round(n / 1e3)}K` : 'an undisclosed amount');

function roundup(url: URL) {
	const mode = url.searchParams.get('mode') === 'ma' ? 'ma' : 'funding';
	const perspective = url.searchParams.get('perspective') === 'acquirer' ? 'acquirer' : 'acquiree';
	const rows = mode === 'ma' ? MA : FUNDING;
	// No month asked for: the latest month that has data in this market.
	const latest = ym(Math.min(...rows.map((r) => r.daysAgo)));
	const year = Number(url.searchParams.get('year')) || latest.year;
	const month = Number(url.searchParams.get('month')) || latest.month;
	const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };

	const cur = rows.filter((r) => inMonth(r, year, month));
	const before = rows.filter((r) => inMonth(r, prev.year, prev.month));
	const largest = [...cur].sort((a, b) => b.amount - a.amount)[0];
	// The acquirer's side, when the visitor flips M&A to "Acquirer".
	const side = (r: Row): Row => {
		if (mode !== 'ma' || perspective === 'acquiree') return r;
		const buyer = COMPANIES.find((c) => c.name === r.acquirer) ?? r.company;
		return { ...r, company: buyer, countryCode: r.acquirerCountry ?? r.countryCode };
	};
	const view = cur.map(side);

	const news = [
		...FUNDING.filter((r) => inMonth(r, year, month)).map((r, i) => {
			const d = DEALS.find((x) => x.company === r.name && x.daysAgo === r.daysAgo)!;
			const lead = d.investors[0];
			return {
				id: `fund-${year}-${month}-${i}`, section: 'Funding', category: d.round,
				headline: `${r.name} raises ${fmtM(r.amount)} ${d.round}${lead ? ` led by ${lead}` : ''}`,
				body: r.company?.description ?? null, org: r.name, geo: countryByCode(r.countryCode).name, source_url: null,
			};
		}),
		...MA.filter((r) => inMonth(r, year, month)).map((r, i) => ({
			id: `ma-${year}-${month}-${i}`, section: 'M&A', category: 'Acquisition',
			headline: `${r.acquirer} acquires ${r.name}${r.amount ? ` for ${fmtM(r.amount)}` : ''}`,
			body: null, org: r.acquirer ?? null, geo: countryByCode(r.countryCode).name, source_url: null,
		})),
		...ARTICLES.filter((a) => inMonth(a, year, month)).map((a) => ({
			id: `insight-${a.slug}`, section: 'Insights', category: a.categories[0] ?? null,
			headline: a.title, body: a.description, org: 'SportsTechX', geo: null, source_url: null,
		})),
	];

	return {
		year, month, mode, ...(mode === 'ma' ? { perspective } : {}),
		edition: null,
		news,
		stats: {
			total_amount: cur.reduce((s, r) => s + r.amount, 0), count: cur.length,
			largest_amount: largest?.amount ?? 0, largest_company: largest?.name ?? null,
			prev_total_amount: before.reduce((s, r) => s + r.amount, 0), prev_count: before.length,
		},
		by_sector: group(view, (r) => (r.company ? sectorPath(r.company)[0].name : 'Other')),
		by_sub_sector: group(view, (r) => (r.company ? sectorPath(r.company)[1].name : 'Other')),
		by_business_model: group(view, (r) => bizLabel(r)?.toUpperCase() ?? 'OTHER'),
		by_geo: group(view, (r) => countryByCode(r.countryCode).name),
	};
}

export const analyticsSandboxRoutes: SandboxRoute[] = [
	['GET', '/api/analytics/annual-funding', ({ url }) => annual(FUNDING, url)],
	['GET', '/api/analytics/annual-ma', ({ url }) => annual(MA, url)],
	['GET', '/api/analytics/sector-heat-tree', ({ url }) => sectorTree(FUNDING, url)],
	['GET', '/api/analytics/ma-sector-heat-tree', ({ url }) => sectorTree(MA, url)],
	['GET', '/api/analytics/business-model-breakdown', ({ url }) =>
		group(fundingIn(url), bizLabel).map((g) => ({ business_model: g.label, deal_count: g.deal_count, total_amount: g.total_amount }))],
	['GET', '/api/analytics/world-flow', ({ url }) =>
		group(fundingIn(url), (r) => countryByCode(r.countryCode).name).slice(0, limitOf(url, 30))
			.map((g) => ({ country: g.label, deal_count: g.deal_count, total_amount: g.total_amount }))],
	['GET', '/api/analytics/top-funded-companies', ({ url }) => topFunded(url)],
	['GET', '/api/analytics/top-acquirers', ({ url }) => topAcquirers(url)],
	['GET', '/api/market/roundup', ({ url }) => roundup(url)],
];
