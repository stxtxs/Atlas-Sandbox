/**
 * Sample-data routes shared by every tier: companies, signals, deck analysis,
 * AI chat, exports, claims and company watchlists (watchlist-routes.ts).
 * Tier-specific data lives in explore-routes.ts, raise-routes.ts and
 * scout-routes.ts, which are matched first.
 */
import type { DeckScorecard } from '@/lib/deck-analysis';
import { daysFromNow, json, sse, type SandboxRoute } from './types';
import { watchlistSandboxRoutes } from './watchlist-routes';
import { catalogSandboxRoutes } from './shared/catalog-routes';

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

export const coreSandboxRoutes: SandboxRoute[] = [
	// Companies, investors, rounds, acquisitions, reference data, signals,
	// events/programs, reports, newsletter, favorites, credits, exports.
	...catalogSandboxRoutes,

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
	// The question is kept so the history rail and a reopened conversation show it.
	['POST', '/api/chat', ({ product, body, state, save }) => {
		const message = (body as { message?: unknown } | undefined)?.message;
		state.chat = { question: typeof message === 'string' ? message : 'Your question', at: daysFromNow(0) };
		save();
		return sse([
			{ event: 'conversation', data: { id: 'sample-chat' } },
			...CHAT_ANSWERS[product].match(/[\s\S]{1,40}/g)!.map((t) => ({ event: 'content_delta', data: { text: t } })),
			{ event: 'done', data: {} },
		]);
	}],
	['GET', '/api/chat/conversations', ({ state }) => {
		const chat = state.chat as { question: string; at: string } | undefined;
		return chat ? [{ id: 'sample-chat', title: chat.question.slice(0, 60), last_message_at: chat.at }] : [];
	}],
	['GET', '/api/chat/conversations/:id', ({ product, state }) => {
		const chat = state.chat as { question: string } | undefined;
		if (!chat) return json({ error: { code: 'NOT_FOUND', message: 'Not in the tutorial' } }, 404);
		return { id: 'sample-chat', messages: [{ role: 'user', content: chat.question }, { role: 'assistant', content: CHAT_ANSWERS[product] }] };
	}],
	['GET', '/api/chat/conversations/:id/export', ({ product }) => new Response(`# Atlas co-pilot

${CHAT_ANSWERS[product]}
`, { headers: { 'Content-Type': 'text/markdown', 'Content-Disposition': 'attachment; filename="atlas-chat.md"' } })],

	// Exports: a small sample CSV, whatever was asked for.
	['POST', '/api/exports/:entity', ({ params }) => new Response(SAMPLE_CSV, { headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="atlas-${params.entity}-sample.csv"` } })],

	// The visitor: one made-up person whose tier is the tour being run. Every
	// real page that branches on the profile's tier (home, recommended, deck…)
	// renders that tier's version from this alone.
	['GET', '/api/profiles/me', ({ product }) => ({
		id: 'demo-user', email: 'you@example.com', full_name: 'Alex Morgan', display_name: 'Alex',
		referral_code: null, user_role: 'user', user_type: product, user_type_detail: null, background: null,
		account_type: product === 'raise' ? 'founder' : product === 'scout' ? 'investor' : 'user',
		paywall_shown_at: daysFromNow(-30), avatar_url: null,
		company_name: product === 'raise' ? 'Fanloop' : product === 'scout' ? 'Kestrel Field Ventures' : null,
		job_title: product === 'raise' ? 'Co-founder & CEO' : product === 'scout' ? 'Partner' : null,
		is_trial: false, trial_ends_at: null, stripe_customer_id: null, intercom_hash: null,
		notification_newsletter: true, notification_email: true, notification_marketing: false, notification_updates: true,
		notification_funding_alerts: true, notification_ma_alerts: true, notification_report_releases: true, notification_programs_deadline: true,
		onboarding_stage: 'done', onboarding_complete_explore: true, onboarding_complete_raise: true, onboarding_complete_scout: true,
		created_at: daysFromNow(-120),
	})],

	// No grants, nothing locked: the tutorial has no paywall (contexts/feature-access-context.tsx).
	['GET', '/api/features', () => []],
	['GET', '/api/me/feature-grants', () => ({ data: [] })],

	// Verification claims and data corrections: accepted for review, nothing leaves the browser.
	['POST', '/api/claims/:kind', () => ({ id: 'sample-claim', status: 'pending' })],
	['POST', '/api/data-change-requests', () => ({ id: 'sample-correction', status: 'pending' })],

];

const SAMPLE_CSV = [
	'name,sector,country,total_funding_usd',
	'Kitroom,Fan Engagement,Germany,2400000',
	'Matchday Loop,Fan Engagement,United Kingdom,5100000',
	'Courtline,Facility Management,Spain,1800000',
	'Stridewise,Wearables,Netherlands,3200000',
	'',
].join('\n');
