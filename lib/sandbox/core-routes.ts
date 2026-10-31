/**
 * Sample-data routes shared by every tier: companies, signals, deck analysis,
 * AI chat, exports, claims and company watchlists (watchlist-routes.ts).
 * Tier-specific data lives in explore-routes.ts, raise-routes.ts and
 * scout-routes.ts, which are matched first.
 */
import type { DeckScorecard } from '@/lib/deck-analysis';
import { daysFromNow, json, sse, type SandboxRoute } from './types';
import { watchlistSandboxRoutes, FALLBACK as FALLBACK_WATCHLIST_COMPANIES } from './watchlist-routes';
import { FALLBACK_COMPANIES as FALLBACK_SCOUT_COMPANIES } from './scout-routes';

/** The one sample deck (Fanloop's), at `/deck/<id>`. */
export const SAMPLE_DECK_ID = 'sandbox-deck';

const SCORECARD: DeckScorecard = {
	overall_score: 71,
	verdict: 'A credible deck with a clear problem and early traction. Market sizing and go-to-market need more evidence before Series A conversations, and the financial plan should tie hiring to milestones.',
	sections: [
		{ key: 'problem', label: 'Problem', score: 8, page_refs: [2], quote: 'Clubs lose 30% of season-ticket holders each year.' },
		{ key: 'solution', label: 'Solution', score: 7, page_refs: [3], quote: null },
		{ key: 'market', label: 'Market', score: 5, page_refs: [5], quote: null },
		{ key: 'product', label: 'Product', score: 7, page_refs: [4], quote: null },
		{ key: 'business_model', label: 'Business model', score: 6, page_refs: [7], quote: null },
		{ key: 'competition', label: 'Competition', score: 6, page_refs: [8], quote: null },
		{ key: 'gtm', label: 'Go-to-market', score: 5, page_refs: [9], quote: null },
		{ key: 'traction', label: 'Traction', score: 8, page_refs: [6], quote: '14 clubs live, 3x ARR in 12 months.' },
		{ key: 'financials', label: 'Financials', score: 6, page_refs: [11], quote: null },
		{ key: 'team', label: 'Team', score: 8, page_refs: [10], quote: null },
		{ key: 'ask', label: 'The ask', score: 7, page_refs: [12], quote: null },
	],
	strengths: ['Clear, specific problem statement', 'Strong early traction with named clubs', 'Experienced founding team'],
	risks: ['Market size relies on top-down estimates', 'Go-to-market beyond the first league is unproven', 'Use of funds is not tied to milestones'],
	suggestions: [
		{ area: 'Market', suggestion: 'Rebuild the market size bottom-up from clubs × average contract value.', page_ref: 5, quote: null },
		{ area: 'Go-to-market', suggestion: 'Show the playbook for entering a second league, with pipeline evidence.', page_ref: 9, quote: null },
		{ area: 'Financials', suggestion: 'Tie each hire in the use of funds to a revenue milestone.', page_ref: 11, quote: null },
	],
};
const ANALYSIS_MD = `## Overall\n\n${SCORECARD.verdict}\n\n## Strengths\n\n${SCORECARD.strengths.map((s) => `- ${s}`).join('\n')}\n\n## Main investor concerns\n\n${SCORECARD.risks.map((s) => `- ${s}`).join('\n')}\n`;
const sampleDeck = () => ({ id: SAMPLE_DECK_ID, filename: 'Sample — Fanloop Seed Deck.pdf', status: 'done', overall_score: SCORECARD.overall_score, created_at: daysFromNow(-3) });

/** The co-pilot's canned answer per tier — sample data, written like a real reply. */
const CHAT_ANSWERS = {
	explore: 'Here is a quick read on **fan engagement in Europe** (sample data):\n\n- **42 companies** tracked, most of them seed stage\n- Funding is up **18%** on last year, led by Germany and the UK\n- Ones to watch: **Kitroom**, **Matchday Loop** and **Courtline**\n\nWant me to open the list in Companies?',
	raise: 'Based on your round (sample data), these investors fit best:\n\n1. **Kestrel Field Ventures** — leads seed rounds in fan engagement, cheques of $500k–2M\n2. **Tidepool Sport** — backed two club-tech companies this year\n3. **Northline Capital** — follows on at Series A in Europe\n\nI can add them to your pipeline or draft an intro note.',
	scout: 'Against your thesis (sample data), three new companies match:\n\n- **Stridewise** — wearables for recovery, raising a $2M seed\n- **Courtline** — padel club software, 3x revenue in a year\n- **Matchday Loop** — fan engagement, verified on Atlas\n\nShall I open their profiles or add them to a watchlist?',
} as const;

interface SlimCompany {
	id: string; name: string; slug: string | null; description: string | null;
	website: string | null; custom_logo_url: string | null;
	primary_sector: string | null; hq_city: string | null; hq_country: string | null;
	total_funding_usd: number | string | null;
	latest_round?: string | null; founded_year?: number | null; business_model?: string | null;
}

/** Both products' fallback company lists, by id — `/companies/:slug` passes an
 *  id here (these have no real slug), and the two lists use disjoint id
 *  spaces (`sandbox-co-*` vs scout's UUID-shaped ones), so checking both is safe. */
function findFallbackCompany(id: string): SlimCompany | undefined {
	return FALLBACK_WATCHLIST_COMPANIES.find((c) => c.id === id) ?? FALLBACK_SCOUT_COMPANIES.find((c) => c.id === id);
}

/**
 * `GET /api/companies/:id` has no local route — every company a tour can
 * reach (the watchlist seed, Scout's recommendations) is already one of the
 * two fallback lists above, built for their OWN pages; the profile page
 * (components/features/company/company-profile.tsx) needs the full `Company`
 * shape, not that summary, and nothing filled it in. Fields neither fallback
 * carries (founded year, business model, stage, socials…) are null — the
 * profile page already renders those as "—" when absent, same as a real
 * company with gaps in its data.
 */
function expandCompany(c: SlimCompany): Record<string, unknown> {
	return {
		id: c.id, name: c.name, website: c.website, slug: c.slug, custom_logo_url: c.custom_logo_url,
		description: c.description, status: 'active', founded_year: c.founded_year ?? null, ipo_date: null, sector_id: null,
		business_model: c.business_model ?? null, location_id: null, social_profile_id: null, is_verified: true, is_unicorn: false,
		is_actively_raising: false, poc_first_name: null, poc_last_name: null, poc_job_position: null,
		poc_email: null, poc_linkedin: null, accelerator: null, cohort: null, added_by_profile_id: null,
		created_at: daysFromNow(-900), updated_at: daysFromNow(-14),
		primary_sector: c.primary_sector, primary_sector_slug: null, hq_city: c.hq_city, hq_country: c.hq_country,
		primary_sport: null, total_funding_usd: Number(c.total_funding_usd) || 0, last_round_type: c.latest_round ?? null,
		hq_region: null, twitter_url: null, instagram_url: null, facebook_url: null, linkedin_url: null,
		youtube_url: null, contact_email: null, sport_count: 0, tech_tag_count: 0, deal_count: 0,
	};
}

/** "Recent signals" on the company profile — made up, but specific to the
 *  company rather than a generic placeholder, same spirit as everywhere else
 *  in the sandbox invents a small, named sample instead of leaving a blank. */
function sampleSignals(c: SlimCompany): Record<string, unknown>[] {
	const sector = c.primary_sector ?? 'sports tech';
	return [
		{ id: `${c.id}-signal-1`, title: `${c.name} expands its ${sector} product into new markets`, source: 'SportsTechX Wire', url: null, published_at: daysFromNow(-9) },
		{ id: `${c.id}-signal-2`, title: `${c.name} named one to watch in ${c.hq_country ?? 'its region'}`, source: 'Industry Roundup', url: null, published_at: daysFromNow(-26) },
		{ id: `${c.id}-signal-3`, title: `${c.name} adds two senior hires as it scales`, source: 'Company update', url: null, published_at: daysFromNow(-48) },
	];
}

/** "Related companies" — the other fallback companies, same reasoning. */
function sampleSimilar(c: SlimCompany): Record<string, unknown>[] {
	const pool: SlimCompany[] = [...FALLBACK_WATCHLIST_COMPANIES, ...FALLBACK_SCOUT_COMPANIES];
	return pool
		.filter((o) => o.id !== c.id)
		.slice(0, 3)
		.map((o) => ({
			id: o.id, name: o.name, slug: o.slug, hq_city: o.hq_city, hq_country: o.hq_country,
			last_round_type: o.latest_round ?? 'Seed', primary_sector: o.primary_sector,
		}));
}

/**
 * Discover → Signals (components/features/signals/signals.tsx), shared by
 * both products against the un-gated `GET /api/signals` — had no local route
 * at all, same "public data, assumed reachable" gap as everywhere else.
 * `funding`/`fundraising` only, same as the real product (its own comment:
 * the other four SignalType values have no source yet — an empty state
 * there is correct, not something to fill in).
 */
function sampleSignalsList(): Record<string, unknown>[] {
	const pool = [...FALLBACK_WATCHLIST_COMPANIES, ...FALLBACK_SCOUT_COMPANIES];
	const pick = (i: number) => pool[i % pool.length];
	const entries: { type: 'funding' | 'fundraising'; headline: (name: string) => string; daysAgo: number }[] = [
		{ type: 'funding', headline: (n) => `${n} closes an oversubscribed seed round`, daysAgo: 4 },
		{ type: 'fundraising', headline: (n) => `${n} opens a Series A to scale into new leagues`, daysAgo: 11 },
		{ type: 'funding', headline: (n) => `${n} raises a bridge round led by existing investors`, daysAgo: 19 },
		{ type: 'fundraising', headline: (n) => `${n} is quietly talking to investors for a seed extension`, daysAgo: 33 },
	];
	return entries.map((e, i) => {
		const c = pick(i);
		return {
			id: `signal-${i + 1}`, signal_type: e.type, source: 'SportsTechX Wire', headline: e.headline(c.name), body: null,
			occurred_at: daysFromNow(-e.daysAgo), company_id: c.id, company_name: c.name, company_slug: c.slug,
			company_website: c.website, company_custom_logo_url: c.custom_logo_url, sector: c.primary_sector,
			hq_city: c.hq_city, hq_country: c.hq_country, last_round_type: e.type === 'funding' ? 'Seed' : null,
		};
	});
}

export const coreSandboxRoutes: SandboxRoute[] = [
	['GET', '/api/signals', ({ url }) => {
		const type = url.searchParams.get('type');
		const rows = type ? sampleSignalsList().filter((s) => s.signal_type === type) : sampleSignalsList();
		return { data: rows };
	}],
	['GET', '/api/companies/:id', ({ params }) => {
		const c = findFallbackCompany(params.id);
		return c ? expandCompany(c) : undefined; // not one of ours → let the real /api/companies passthrough (public data) answer
	}],
	['GET', '/api/companies/:id/sports', () => []],
	['GET', '/api/companies/:id/news', ({ params }) => {
		const c = findFallbackCompany(params.id);
		return c ? sampleSignals(c) : [];
	}],
	['GET', '/api/companies/:id/similar', ({ params }) => {
		const c = findFallbackCompany(params.id);
		return c ? sampleSimilar(c) : [];
	}],

	// Company watchlists: seeded sample lists; the visitor's real lists are never touched.
	...watchlistSandboxRoutes,

	// Deck analysis / Deck Screener: one sample deck with a full analysis. An upload "analyses" into it.
	['GET', '/api/deck-analysis', () => [sampleDeck()]],
	['POST', '/api/deck-analysis', () => ({ id: SAMPLE_DECK_ID })],
	['GET', '/api/deck-analysis/:id', () => ({ ...sampleDeck(), analysis_md: ANALYSIS_MD, result_json: SCORECARD })],
	['GET', '/api/deck-analysis/:id/file', () => ({ url: '/sample/sample-deck.pdf' })],
	['POST', '/api/deck-analysis/:id/reanalyze', () => ({ ok: true })],
	['POST', '/api/deck-analysis/:id/stream', () => sse([
		...ANALYSIS_MD.match(/[\s\S]{1,60}/g)!.map((text) => ({ event: 'delta', data: { text } })),
		{ event: 'done', data: { scorecard: SCORECARD } },
	])],

	// AI chat: a canned, tier-specific answer streamed like the real co-pilot.
	['POST', '/api/chat', ({ product }) => sse([
		{ event: 'conversation', data: { id: 'sample-chat' } },
		...CHAT_ANSWERS[product].match(/[\s\S]{1,40}/g)!.map((t) => ({ event: 'content_delta', data: { text: t } })),
		{ event: 'done', data: {} },
	])],
	['GET', '/api/chat/conversations', () => []],
	['GET', '/api/chat/conversations/:id', () => json({ error: { code: 'NOT_FOUND', message: 'Not in the tutorial' } }, 404)],
	['GET', '/api/chat/conversations/:id/export', ({ product }) => new Response(`# Atlas co-pilot

${CHAT_ANSWERS[product]}
`, { headers: { 'Content-Type': 'text/markdown', 'Content-Disposition': 'attachment; filename="atlas-chat.md"' } })],

	// Exports: a small sample CSV, whatever was asked for.
	['POST', '/api/exports/:entity', ({ params }) => new Response(SAMPLE_CSV, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="atlas-${params.entity}-sample.csv"` } })],

	// No grants, nothing locked: the tutorial has no paywall (contexts/feature-access-context.tsx).
	['GET', '/api/features', () => []],
	['GET', '/api/me/feature-grants', () => ({ data: [] })],

	// Verification claims and data corrections: accepted for review, nothing leaves the browser.
	['POST', '/api/claims/:kind', () => ({ id: 'sample-claim', status: 'pending' })],
	['POST', '/api/data-change-requests', () => ({ id: 'sample-correction', status: 'pending' })],

	['GET', '/api/companies/:id/contacts', () => null],
];

const SAMPLE_CSV = [
	'name,sector,country,total_funding_usd',
	'Kitroom,Fan Engagement,Germany,2400000',
	'Matchday Loop,Fan Engagement,United Kingdom,5100000',
	'Courtline,Facility Management,Spain,1800000',
	'Stridewise,Wearables,Netherlands,3200000',
	'',
].join('\n');
