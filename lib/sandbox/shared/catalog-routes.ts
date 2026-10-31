/**
 * Catalog routes every tier reads: companies, investors, rounds, acquisitions,
 * reference data, signals, events/programs, reports, newsletter, favorites,
 * credits and exports. Spread into coreSandboxRoutes; tier routes still match
 * first, so e.g. Raise can answer `/api/investors/:id` with its pipeline view.
 */
import { ACQUISITIONS, COMPANIES, COUNTRIES, DEALS, EVENTS, INVESTORS, PROGRAMS, REPORTS, ROUND_TYPES, SECTORS, SPORTS, TECH_TAGS, companyBy, investorBy, slugify } from '../fixtures/world';
import { json, type SandboxRoute } from '../types';
import { watchedCompanyIds } from '../watchlist-routes';
import {
	acquisitionRow, acquisitionSports, allSignals, articles, companyContact, companyListItem, companyNews, companySports,
	companyTechTags, eventDetails, eventRow, findEvent, findProgram, findReport, investorRow, investorThesis, listAcquisitions,
	listCompanies, listDeals, listEcosystem, listInvestors, listParam, listParticipations, paginate, programDetails, programRow,
	reportRow, similarCompanies,
} from './catalog';

const notFound = (what: string) => json({ error: { code: 'NOT_FOUND', message: `${what} not found` } }, 404);
const ok = { ok: true };

/** Export pickers: the same few columns for every catalog (export-modal.tsx `ColumnsResponse`). */
const EXPORT_COLUMNS = [
	{ key: 'name', label: 'Name', credit_cost: 1, related: false },
	{ key: 'sector', label: 'Sector', credit_cost: 1, related: false },
	{ key: 'country', label: 'Country', credit_cost: 1, related: false },
	{ key: 'total_funding_usd', label: 'Total funding (USD)', credit_cost: 1, related: false },
];
const EXPORT_ROWS: Record<string, number> = { companies: COMPANIES.length, investors: INVESTORS.length, deals: DEALS.length, acquisitions: ACQUISITIONS.length, events: EVENTS.length, programs: PROGRAMS.length };

const FAV_FIELD: Record<string, string> = { companies: 'company_id', investors: 'investor_id', ecosystem: 'ecosystem_entity_id', deals: 'deal_id' };

export const catalogSandboxRoutes: SandboxRoute[] = [
	// Reference data (bare arrays, as the reference endpoints answer).
	['GET', '/api/sectors', () => SECTORS],
	['GET', '/api/sports', () => SPORTS],
	['GET', '/api/round-types', () => ROUND_TYPES],
	['GET', '/api/tech-tags', () => TECH_TAGS],
	['GET', '/api/currencies', () => [{ code: 'USD', name: 'US Dollar' }, { code: 'EUR', name: 'Euro' }, { code: 'GBP', name: 'British Pound' }]],
	['GET', '/api/countries', () => COUNTRIES.map((c) => ({ name: c.name, slug: c.name.toLowerCase().replace(/\s+/g, '-'), iso2: c.code, continent: c.continent, region: c.region }))],
	['GET', '/api/locations/facets', () => ({
		cities: [...new Set(COMPANIES.map((c) => c.city))],
		countries: COUNTRIES.map((c) => c.name),
		continents: [...new Set(COUNTRIES.map((c) => c.continent))],
		regions: [...new Set(COUNTRIES.map((c) => c.region))],
	})],
	// city-input.tsx `LocHit[]`.
	['GET', '/api/locations/search', ({ url }) => {
		const q = (url.searchParams.get('q') ?? '').toLowerCase();
		const seen = new Set<string>();
		return COMPANIES.filter((c) => c.city.toLowerCase().startsWith(q) && !seen.has(c.city) && seen.add(c.city))
			.map((c) => ({ city: c.city, state: null, country: COUNTRIES.find((x) => x.code === c.country)!.name }));
	}],

	// Companies — the list and every panel of the profile and drawer.
	['GET', '/api/companies', ({ url }) => listCompanies(url)],
	['GET', '/api/companies/:id', ({ params }) => { const c = companyBy(params.id); return c ? companyListItem(c) : notFound('Company'); }],
	['GET', '/api/companies/:id/sports', ({ params }) => { const c = companyBy(params.id); return c ? companySports(c) : []; }],
	['GET', '/api/companies/:id/tech-tags', ({ params }) => { const c = companyBy(params.id); return c ? companyTechTags(c) : []; }],
	['GET', '/api/companies/:id/news', ({ params }) => { const c = companyBy(params.id); return c ? companyNews(c) : []; }],
	['GET', '/api/companies/:id/similar', ({ params }) => { const c = companyBy(params.id); return c ? similarCompanies(c) : []; }],
	['GET', '/api/companies/:id/contacts', ({ params }) => { const c = companyBy(params.id); return c ? companyContact(c) : null; }],
	['GET', '/api/companies/:id/team', () => []],

	// Investors.
	['GET', '/api/investors', ({ url }) => listInvestors(url)],
	['GET', '/api/investors/:id', ({ params }) => { const i = investorBy(params.id); return i ? investorRow(i) : notFound('Investor'); }],
	['GET', '/api/investors/:id/thesis', ({ params }) => { const i = investorBy(params.id); return i ? investorThesis(i) : notFound('Investor'); }],
	['GET', '/api/investors/:id/funds', () => ({ data: [] })],

	// Funding rounds and acquisitions.
	['GET', '/api/deals', ({ url }) => listDeals(url)],
	['GET', '/api/acquisitions', ({ url }) => listAcquisitions(url)],
	['GET', '/api/acquisitions/:id', ({ params }) => { const a = ACQUISITIONS.find((x) => x.id === params.id); return a ? acquisitionRow(a) : notFound('Acquisition'); }],
	['GET', '/api/acquisitions/:id/sports', ({ params }) => { const a = ACQUISITIONS.find((x) => x.id === params.id); return a ? acquisitionSports(a) : []; }],

	// Signals (signals.tsx; Scout home counts the fundraising ones).
	['GET', '/api/signals', (ctx) => {
		const sp = ctx.url.searchParams;
		const sectors = listParam(ctx.url, 'sector_slug');
		const watched = sp.get('watchlist_only') === 'true' ? watchedCompanyIds(ctx) : null;
		const rows = allSignals().filter((s) => (!sp.get('type') || s.signal_type === sp.get('type'))
			&& (!sectors.length || (s.sector != null && sectors.includes(slugify(s.sector))))
			&& (!sp.get('country') || s.hq_country === sp.get('country'))
			&& (!watched || watched.has(s.company_id)));
		return { data: rows.slice(0, Number(sp.get('limit')) || 50) };
	}],

	// Ecosystem: events and programs.
	['GET', '/api/ecosystem-entities', ({ url }) => listEcosystem(url)],
	['GET', '/api/ecosystem-entities/:id', ({ params }) => {
		const e = findEvent(params.id); if (e) return eventRow(e);
		const p = findProgram(params.id); return p ? programRow(p) : notFound('Entity');
	}],
	['GET', '/api/ecosystem-entities/:id/event-details', ({ params }) => { const e = findEvent(params.id); return e ? eventDetails(e) : null; }],
	['GET', '/api/ecosystem-entities/:id/sports', () => [SPORTS[10]]],
	['GET', '/api/ecosystem-entities/:id/program-details', ({ params }) => { const p = findProgram(params.id); return p ? programDetails(p) : null; }],
	['GET', '/api/ecosystem-entities/:id/relationships', () => ({ parents: [], children: [] })],
	['GET', '/api/program-participations', ({ url }) => listParticipations(url)],

	// Reports library (reports-library.tsx) and its download (lib/report-pdf.ts).
	['GET', '/api/reports', ({ url }) => paginate(REPORTS.map(reportRow), url, 100)],
	['GET', '/api/reports/versions/:id/pdf-url', () => ({ url: '/sample/sample-report.pdf' })],
	['GET', '/api/reports/:id', ({ params }) => { const r = findReport(params.id); return r ? reportRow(r) : notFound('Report'); }],
	['GET', '/api/reports/:id/versions', ({ params }) => { const r = findReport(params.id); return r ? [{ id: `${r.id}-en`, language_code: 'en', access_tier: 'explore' }] : []; }],

	['GET', '/api/newsletter/articles', () => articles()],

	// Bookmarks (hooks/use-favorite.ts), kept in the tier's sample workspace.
	['GET', '/api/favorites/:kind', ({ params, state }) => {
		const ids = ((state.favorites ?? {}) as Record<string, string[]>)[params.kind] ?? [];
		return { data: ids.map((id) => ({ [FAV_FIELD[params.kind] ?? 'id']: id })) };
	}],
	['POST', '/api/favorites/:kind/:id', ({ params, state, save }) => {
		const favs = (state.favorites ?? {}) as Record<string, string[]>;
		state.favorites = { ...favs, [params.kind]: [...new Set([...(favs[params.kind] ?? []), params.id])] }; save();
		return ok;
	}],
	['DELETE', '/api/favorites/:kind/:id', ({ params, state, save }) => {
		const favs = (state.favorites ?? {}) as Record<string, string[]>;
		state.favorites = { ...favs, [params.kind]: (favs[params.kind] ?? []).filter((x) => x !== params.id) }; save();
		return ok;
	}],

	// Credits: plenty, so the export modal never stops a step (hooks/use-credit-balance.ts).
	['GET', '/api/credits/balance', () => ({ monthly_balance: 500, topup_balance: 0, overage_balance: 0, total_available: 500, monthly_grant: 500 })],
	['GET', '/api/credits/ledger', () => ({ data: [], nextCursor: null })],
	['GET', '/api/exports/:entity/columns', ({ params }) => ({ entity: params.entity, label: params.entity, columns: EXPORT_COLUMNS })],
	['GET', '/api/exports/:entity/count', ({ params, url }) => {
		const rows = EXPORT_ROWS[params.entity] ?? 10;
		const cols = (url.searchParams.get('columns') ?? '').split(',').filter(Boolean).length || 1;
		return { matched: rows, rows, credits: rows * cols, credits_per_row: cols, capped: false };
	}],

	['POST', '/api/personalization/signal', () => ok],
	['GET', '/api/me/notifications', () => ({ data: [], unread: 0 })],
	['GET', '/api/me/downloads', () => ({ data: [] })],
	['GET', '/api/claims/mine', () => []],
	['GET', '/api/verified-reports/mine', () => ({ data: [] })],
];
