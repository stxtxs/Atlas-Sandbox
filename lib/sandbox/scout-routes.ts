/**
 * Atlas Scout's sample data: the visitor is Alex Morgan, partner at Kestrel
 * Field Ventures (fixtures/world.ts), with a finished, verified Scout workspace
 * and thesis, so Home, Recommended and Deal Flow work from the first request.
 *
 * Every route answers in the shape the real server does (server/src/modules/
 * scout/**); writes persist to this browser's tutorial workspace, so the
 * wizard, dismissals, watches and intro requests behave like the product.
 *
 * Consumers: use-thesis.ts / onboarding.tsx / thesis-settings.tsx (profile,
 * thesis), scout-home.tsx (home), recommended.tsx, deal-flow.tsx,
 * deal-detail.tsx, share-deal.tsx.
 */
import type { DealRow, MyDealRow } from '@/components/scout/deal-types';
import type { ScoutProfile, ServerThesis, TaxonomyRef } from '@/components/scout/thesis-codec';
import { mockJson } from './mock-api';
import {
	COMPANIES, DEALS, ROUND_TYPES, SECTORS, SPORTS, companyByName, countryByCode, sectorByName,
	type WCompany,
} from './fixtures/world';
import { daysFromNow, json, type SandboxCtx, type SandboxRoute } from './types';

// ─── State ───────────────────────────────────────────────────────────────────

const STATE_KEY = 'scout';

/** `ScoutProfileRow` on the server; the client reads the `ScoutProfile` subset. */
interface ScoutProfileRow extends ScoutProfile {
	id: string; profile_id: string; claim_id: string | null; investor_id: string | null;
	photo_url: string | null; location_id: string | null; created_at: string; updated_at: string;
}

/** A submitter's own deal (`SELECT *` server-side). */
type DraftDeal = MyDealRow & Record<string, unknown>;

interface ScoutState {
	profile: ScoutProfileRow | null;
	thesis: ServerThesis | null;
	drafts: DraftDeal[];
	/** Deal ids the visitor asked SportsTechX to introduce. */
	interests: string[];
	/** Deal ids the visitor is watching. */
	watched: string[];
	/** Company ids marked "Not relevant" on Recommended. */
	dismissed: string[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

function readState(ctx: SandboxCtx): ScoutState {
	const s = ctx.state[STATE_KEY];
	if (!isRecord(s)) return sampleState();
	return {
		profile: isRecord(s.profile) ? (s.profile as unknown as ScoutProfileRow) : null,
		thesis: isRecord(s.thesis) ? (s.thesis as unknown as ServerThesis) : null,
		drafts: list(s.drafts), interests: list(s.interests), watched: list(s.watched), dismissed: list(s.dismissed),
	};
}

function writeState(ctx: SandboxCtx, next: ScoutState) {
	ctx.state[STATE_KEY] = next;
	ctx.save();
}

const notSetUp = () => json({ error: { code: 'SCOUT_NOT_SET_UP', message: 'complete Scout setup first' } }, 403);
const notFound = () => json({ error: { code: 'NOT_FOUND', message: 'not found' } }, 404);
const badRequest = (message: string) => json({ error: { code: 'VALIDATION_ERROR', message } }, 400);
const isoDate = (days: number) => daysFromNow(days).slice(0, 10);

const EMPTY_THESIS: ServerThesis = {
	sectors: [], sports: [], round_types: [], geo: [], business_models: [],
	cheque_min: null, cheque_max: null, traction_floor: null, invest_style: null, exclusions: null,
};

// ─── The sample investor: Kestrel Field Ventures ─────────────────────────────

const ref = (r: { id: string; name: string }): TaxonomyRef => ({ id: r.id, name: r.name });
const roundRef = (name: string) => ref(ROUND_TYPES.find((r) => r.name === name)!);

const SAMPLE_THESIS: ServerThesis = {
	sectors: ['Fan Engagement', 'Recovery & Injury Prevention', 'Tracking & Analytics'].map((n) => ref(sectorByName(n))),
	sports: [ref(SPORTS[0])],
	round_types: [roundRef('Seed'), roundRef('Series A')],
	geo: [{ scope_type: 'continent', scope_value: 'Europe' }],
	business_models: ['b2b'],
	cheque_min: 250_000,
	cheque_max: 2_000_000,
	traction_floor: 'Early revenue',
	invest_style: 'either',
	exclusions: 'Betting & prediction',
	include_tags: [],
};

function sampleState(): ScoutState {
	const profile: ScoutProfileRow = {
		id: '5c0e7a10-3f4b-4d2a-9b6e-1a2b3c4d5e01', profile_id: 'demo-user', claim_id: null,
		// Set = verified (`verification` on /home reads it), so sharing a deal is open.
		investor_id: '0000001a-0000-4000-8000-000000000001',
		full_name: 'Alex Morgan', role_title: 'Partner', linkedin_url: null, photo_url: null,
		fund_name: 'Kestrel Field Ventures', investor_type: 'venture_capital', investor_type_label: 'Venture capital',
		fund_website: 'https://kestrelfieldventures.example', location_id: null, hq_country: 'United Kingdom', hq_city: 'London', aum: '180000000',
		setup_completed_at: daysFromNow(-21), created_at: daysFromNow(-21), updated_at: daysFromNow(-2),
	};
	return { profile, thesis: SAMPLE_THESIS, drafts: [], interests: [], watched: [], dismissed: [] };
}

const HOME_PROMPTS = [
	'Find companies matching my thesis',
	'Show recent sports tech deals',
	"What's new in fan engagement?",
	'Find European Series A companies',
];

// ─── Profile & thesis ────────────────────────────────────────────────────────

const PROFILE_KEYS = [
	'full_name', 'role_title', 'linkedin_url', 'fund_name', 'investor_type', 'investor_type_label',
	'fund_website', 'location_id', 'hq_country', 'hq_city', 'aum',
] as const;

/** `POST`/`PATCH /api/scout`: writes the keys present; `setup_completed: true` stamps once, never clears. */
function upsertProfile(ctx: SandboxCtx) {
	if (!isRecord(ctx.body)) return badRequest('expected a JSON object');
	const body = ctx.body;
	const state = readState(ctx);
	const current = state.profile ?? sampleState().profile!;
	const changes = Object.fromEntries(PROFILE_KEYS.filter((k) => k in body).map((k) => [k, typeof body[k] === 'string' ? body[k] : null]));
	const now = daysFromNow(0);
	const profile: ScoutProfileRow = {
		...current, ...changes,
		setup_completed_at: current.setup_completed_at ?? (body.setup_completed === true ? now : null),
		updated_at: now,
	};
	writeState(ctx, { ...state, profile });
	return profile;
}

/** Ids → refs from the world taxonomy; an omitted group keeps its previous value. */
function refsById(rows: { id: string; name: string }[], ids: unknown, previous: TaxonomyRef[]): TaxonomyRef[] {
	if (!Array.isArray(ids)) return previous;
	const byId = new Map(rows.map((r) => [r.id, r]));
	return ids.map((id) => byId.get(String(id))).filter((r): r is { id: string; name: string } => !!r)
		.map(ref).sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

/** `PUT /api/scout/thesis`: replaces only the groups named in the body, returns the stored thesis. */
function putThesis(ctx: SandboxCtx) {
	if (!isRecord(ctx.body)) return badRequest('expected a JSON object');
	const body = ctx.body;
	const state = readState(ctx);
	const prev = state.thesis ?? EMPTY_THESIS;
	const isNum = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0;
	const isStr = (v: unknown) => typeof v === 'string';
	const pick = <T>(key: string, previous: T, valid: (v: unknown) => boolean): T =>
		key in body && (body[key] === null || valid(body[key])) ? (body[key] as T) : previous;
	const thesis: ServerThesis = {
		sectors: refsById(SECTORS, body.sector_ids, prev.sectors),
		sports: refsById(SPORTS, body.sport_ids, prev.sports),
		round_types: refsById(ROUND_TYPES, body.round_type_ids, prev.round_types),
		geo: Array.isArray(body.geo)
			? body.geo.filter((g): g is ServerThesis['geo'][number] => isRecord(g) && isStr(g.scope_type) && isStr(g.scope_value))
			: prev.geo,
		business_models: pick('business_models', prev.business_models, Array.isArray) ?? [],
		cheque_min: pick('cheque_min', prev.cheque_min, isNum),
		cheque_max: pick('cheque_max', prev.cheque_max, isNum),
		traction_floor: pick('traction_floor', prev.traction_floor, isStr),
		invest_style: pick('invest_style', prev.invest_style, isStr),
		exclusions: pick('exclusions', prev.exclusions, isStr),
		include_tags: pick('include_tags', prev.include_tags ?? [], Array.isArray) ?? [],
	};
	if (thesis.cheque_min != null && thesis.cheque_max != null && thesis.cheque_min > thesis.cheque_max) {
		return badRequest('cheque_min must not exceed cheque_max');
	}
	writeState(ctx, { ...state, profile: state.profile ?? sampleState().profile, thesis });
	return thesis;
}

// ─── Recommendations, scored against the thesis like the server ─────────────

/** Mirrors `Recommendation` in components/scout/recommended.tsx. */
interface Recommendation {
	id: string; name: string; slug: string | null; description: string | null;
	website: string | null; custom_logo_url: string | null; sector: string | null;
	city: string | null; country: string | null; total_funding_usd: string | null; latest_round: string | null;
	match_sector: boolean; match_geo: boolean; match_stage: boolean; match_cheque: boolean; match_activity: boolean;
	match_count: number;
}

/** The thesis picker's regions, by country code. */
const REGION_OF: Record<string, string> = {
	DE: 'DACH', AT: 'DACH', CH: 'DACH', GB: 'UK & Ireland', IE: 'UK & Ireland', SE: 'Nordics', DK: 'Nordics',
	FR: 'France & Benelux', NL: 'France & Benelux', ES: 'Southern Europe', IT: 'Southern Europe', PT: 'Southern Europe', US: 'USA & Canada',
};

function geoMatches(code: string, geo: ServerThesis['geo']): boolean {
	const c = countryByCode(code);
	return geo.some((g) => {
		const v = g.scope_value.toLowerCase();
		if (g.scope_type === 'country') return v === c.name.toLowerCase();
		if (g.scope_type === 'region') return (REGION_OF[code] ?? '').toLowerCase() === v;
		return c.continent.toLowerCase() === v || v === 'global';
	});
}

/** True when the company's sector is a thesis sector or sits under one (the server's `descendants` CTE). */
function underSector(sectorName: string, targets: Set<string>): boolean {
	for (let s: (typeof SECTORS)[number] | undefined = sectorByName(sectorName); s; s = SECTORS.find((p) => p.id === s!.parent_id)) {
		if (targets.has(s.id)) return true;
	}
	return false;
}

const roundsOf = (c: WCompany) => DEALS.filter((d) => d.company === c.name).sort((a, b) => a.daysAgo - b.daysAgo);
const fundingOf = (c: WCompany) => roundsOf(c).reduce((n, d) => n + (d.amount_usd ?? 0), 0);

/** Companies the visitor has been searching for and asking about — the "From your activity" chip. */
const ACTIVITY = new Set(['Kitroom']);

function recommendations(state: ScoutState): Recommendation[] {
	const thesis = state.thesis ?? EMPTY_THESIS;
	const sectorIds = new Set(thesis.sectors.map((s) => s.id));
	const rounds = new Set(thesis.round_types.map((r) => (r.name ?? '').toLowerCase()));
	return COMPANIES
		.filter((c) => c.status !== 'acquired' && !state.dismissed.includes(c.id))
		.map((c): Recommendation => {
			const latest = roundsOf(c).find((d) => d.round !== 'Grant');
			const flags = {
				match_sector: underSector(c.sector, sectorIds),
				match_geo: geoMatches(c.country, thesis.geo),
				match_stage: !!latest && rounds.has(latest.round.toLowerCase()),
				// A cheque fits when the last round was small enough for the thesis
				// cheque to be a meaningful slice of it (≤ 4× the max cheque).
				match_cheque: !!latest?.amount_usd && thesis.cheque_max != null && latest.amount_usd <= thesis.cheque_max * 4,
			};
			const match_activity = ACTIVITY.has(c.name);
			const country = countryByCode(c.country).name;
			return {
				id: c.id, name: c.name, slug: c.slug, description: c.description, website: c.website, custom_logo_url: null,
				sector: c.sector, city: c.city, country, total_funding_usd: String(fundingOf(c)), latest_round: latest?.round ?? null,
				...flags, match_activity, match_count: Object.values(flags).filter(Boolean).length,
			};
		})
		.filter((r) => r.match_count > 0)
		.sort((a, b) => b.match_count - a.match_count || Number(b.match_activity) - Number(a.match_activity) || a.name.localeCompare(b.name));
}

function recommendedRoute(ctx: SandboxCtx) {
	const state = readState(ctx);
	if (!state.profile) return notSetUp();
	const limit = Math.max(1, Math.min(24, Number(ctx.url.searchParams.get('limit')) || 24));
	const offset = Math.max(0, Number(ctx.url.searchParams.get('offset')) || 0);
	return { data: recommendations(state).slice(offset, offset + limit) };
}

function dismiss(ctx: SandboxCtx, on: boolean) {
	const state = readState(ctx);
	const rest = state.dismissed.filter((id) => id !== ctx.params.id);
	writeState(ctx, { ...state, dismissed: on ? [...rest, ctx.params.id] : rest });
	return on ? { ok: true } : new Response(null, { status: 204 });
}

// ─── Home ────────────────────────────────────────────────────────────────────

/** Companies across the visitor's watchlists, read through the shared watchlist route. */
async function watchlistCompanyCount(): Promise<number> {
	const body = await mockJson<unknown>('/api/user-watchlists');
	const lists = Array.isArray(body) ? body : isRecord(body) && Array.isArray(body.data) ? body.data : [];
	return lists.reduce((n: number, l) => n + (isRecord(l) && typeof l.company_count === 'number' ? l.company_count : 0), 0);
}

/** `ScoutHomeService.build` + `attention()`: at most three cards, server-ranked. */
async function home(ctx: SandboxCtx) {
	const state = readState(ctx);
	const { profile } = state;
	if (!profile) return notSetUp();
	const t = state.thesis ?? EMPTY_THESIS;
	const dimensions = t.sectors.length + t.sports.length + t.round_types.length + t.geo.length;
	const strong = recommendations(state).filter((r) => r.match_count >= 3).length;
	const watchlistCompanies = await watchlistCompanyCount();
	const attention = [
		...(strong > 0 ? [{
			id: 'new-matches', count: strong,
			title: `${strong} ${strong === 1 ? 'company matches' : 'companies match'} your thesis`,
			why: 'Companies identified as actively raising since last week.',
			cta_label: 'Review matches', cta_href: '/recommended',
		}] : []),
		...(watchlistCompanies > 0 ? [{
			id: 'watchlist-signals', count: 2,
			title: '2 companies you track have news',
			why: 'A new round and a fundraising signal on your watchlists this week.',
			cta_label: 'See signals', cta_href: '/signals',
		}] : [{
			id: 'first-watchlist', title: 'Start a watchlist',
			why: 'Track the companies you are following and Atlas will tell you when they move.',
			cta_label: 'Browse companies', cta_href: '/companies',
		}]),
		{
			id: 'deal-flow', count: SAMPLE_DEALS.length,
			title: `${SAMPLE_DEALS.length} live raises in Deal Flow`,
			why: 'Verified raises and deals shared by Investor Circle members.',
			cta_label: 'Open Deal Flow', cta_href: '/deal-flow',
		},
	].slice(0, 3);
	return {
		needs_setup: !profile.setup_completed_at,
		verification: profile.investor_id ? 'verified' : profile.claim_id ? 'pending' : 'unverified',
		scout: { full_name: profile.full_name, fund_name: profile.fund_name, investor_type: profile.investor_type },
		thesis_set: dimensions > 0,
		snapshot: { watchlist_companies: watchlistCompanies, thesis_dimensions: dimensions },
		attention,
		prompts: HOME_PROMPTS,
	};
}

// ─── Deal Flow ───────────────────────────────────────────────────────────────

const DEAL_BASE: Omit<DealRow, 'id' | 'source' | 'company_name' | 'company_description' | 'company_hq' | 'sector'> = {
	status: 'live', is_featured: false,
	company_website: null, company_id: null, company_anonymous: false,
	round_type: 'Seed', instrument: 'priced_equity', currency_code: 'EUR',
	target_amount: null, committed_amount: null, ticket_min: null, ticket_max: null,
	valuation: null, valuation_amount: null, valuation_basis: null, valuation_undisclosed: null,
	target_close_date: null, lead_status: null, lead_investor: null,
	submitter_name: null, submitter_anonymous: false,
	member_perspective: null, member_relationship: null, member_commitment: null,
	has_deck: false, has_one_pager: false, materials_access: 'on_request',
	disclosed: false, interest_status: null,
};

/** A listing for a world company: name, site, HQ and sector come from fixtures/world.ts. */
function listing(id: string, name: string, deal: Partial<DealRow>): DealRow {
	const c = companyByName(name);
	return {
		...DEAL_BASE, id, source: 'verified_raise',
		company_name: c.name, company_website: c.website, company_id: c.id,
		company_hq: `${c.city}, ${countryByCode(c.country).name}`, sector: c.sector, company_description: c.description,
		...deal,
	};
}

/** The featured listing (Matchday Loop); the guided tour opens it. */
export const SCOUT_FEATURED_DEAL_ID = 'd1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a01';

/** Live listings. Money is `::text` on the server, so strings here. */
const SAMPLE_DEALS: DealRow[] = [
	listing(SCOUT_FEATURED_DEAL_ID, 'Matchday Loop', {
		is_featured: true, round_type: 'Series A extension', currency_code: 'GBP',
		target_amount: '2500000', committed_amount: '1600000', ticket_min: '250000', ticket_max: '1000000',
		valuation: '£24m pre-money', valuation_amount: '24000000', valuation_basis: 'pre_money',
		target_close_date: isoDate(54), lead_status: 'confirmed', lead_investor: 'Brightpost Ventures',
		member_perspective: '62 lower-league clubs live and 410k monthly active fans. The extension funds a launch in Germany and a sponsor marketplace.',
		has_deck: true, has_one_pager: true, materials_access: 'immediate',
	}),
	listing('d1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a02', 'Courtline', {
		round_type: 'Series A', target_amount: '4000000', committed_amount: '2200000', ticket_min: '250000', ticket_max: '1000000',
		valuation: '€16m pre-money', valuation_amount: '16000000', valuation_basis: 'pre_money',
		target_close_date: isoDate(38), lead_status: 'confirmed', lead_investor: 'Halfway Line Partners',
		member_perspective: 'Running 300+ padel clubs in Spain with 68% of revenue from software. Raising to enter Italy and the UK.',
		has_deck: true, materials_access: 'immediate',
	}),
	listing('d1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a03', 'Goalsight', {
		round_type: 'Series A', target_amount: '3000000', committed_amount: '900000',
		valuation: 'Not disclosed', valuation_undisclosed: true, target_close_date: isoDate(71), lead_status: 'seeking',
		member_perspective: 'Used by 40 academies in Portugal and Spain. Seeking a lead for a €3m Series A to expand into the UK.',
		has_deck: true, has_one_pager: true, materials_access: 'on_request',
	}),
	{
		...DEAL_BASE, id: 'd1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a04', source: 'circle', company_name: null, company_anonymous: true,
		company_hq: 'Munich, Germany', sector: 'Wearables',
		company_description: 'Wearable load monitoring built for women’s football, with cycle-aware training recommendations.',
		target_amount: '2500000', committed_amount: '1400000', target_close_date: isoDate(46), lead_status: 'confirmed',
		submitter_anonymous: true, member_relationship: 'investing_this_round', member_commitment: '300000',
		member_perspective: 'Working with three top-flight women’s clubs and one national federation. We are taking €300k of the round.',
		has_deck: true, materials_access: 'immediate',
	},
	listing('d1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a05', 'Kitroom', {
		source: 'circle', round_type: 'Seed extension', instrument: 'safe', target_amount: '1000000', committed_amount: '650000',
		valuation: '€12m cap', valuation_amount: '12000000', valuation_basis: 'cap', target_close_date: isoDate(29), lead_status: 'not_required',
		submitter_name: 'Maren Holt', member_relationship: 'existing_investor', member_commitment: '75000',
		member_perspective: 'I backed the pre-seed. Clubs on Kitroom see 9% higher season-ticket renewals; the extension funds two more leagues.',
		has_one_pager: true, materials_access: 'on_request',
	}),
	listing('d1f0a3b2-4c5d-4e6f-8a7b-9c0d1e2f3a06', 'Stridewise', {
		source: 'circle', round_type: 'Series A', target_amount: '2000000', committed_amount: '800000',
		target_close_date: isoDate(63), lead_status: 'seeking',
		submitter_name: 'Tomás Reis', member_relationship: 'advisor_or_board',
		member_perspective: 'Advisor since the seed. Strong pull from running clubs in the Netherlands; needs a lead who knows consumer hardware.',
		materials_access: 'on_request',
	}),
];

/** The listing as this visitor sees it: their watch and intro request folded in. */
function forViewer(d: DealRow, state: ScoutState): DealRow {
	return { ...d, is_watched: state.watched.includes(d.id), interest_status: state.interests.includes(d.id) ? 'received' : null };
}

function dealList(ctx: SandboxCtx) {
	const state = readState(ctx);
	const tab = ctx.url.searchParams.get('tab') ?? 'all';
	const limit = Math.min(50, Math.max(1, Number(ctx.url.searchParams.get('limit')) || 20));
	const offset = Math.max(0, Number(ctx.url.searchParams.get('offset')) || 0);
	const rows = SAMPLE_DEALS.filter((d) => (
		tab === 'featured' ? d.is_featured : tab === 'verified' ? d.source === 'verified_raise' : tab === 'circle' ? d.source === 'circle' : true
	));
	return { data: rows.slice(offset, offset + limit).map((d) => forViewer(d, state)) };
}

const findDeal = (id: string | undefined) => SAMPLE_DEALS.find((d) => d.id === id);

/** Documents open the bundled sample PDF — only those the real server would release. */
function documentRoute(ctx: SandboxCtx, which: 'deck' | 'one_pager') {
	const d = findDeal(ctx.params.id);
	const present = which === 'deck' ? d?.has_deck : d?.has_one_pager;
	const allowed = !!d && (d.disclosed || (d.materials_access === 'immediate' && !d.company_anonymous));
	if (!d || !present || !allowed) return notFound();
	return { url: '/sample/sample-deck.pdf' };
}

function setWatch(ctx: SandboxCtx, on: boolean) {
	if (!findDeal(ctx.params.id)) return notFound();
	const state = readState(ctx);
	const rest = state.watched.filter((id) => id !== ctx.params.id);
	writeState(ctx, { ...state, watched: on ? [...rest, ctx.params.id] : rest });
	return { watched: on };
}

/** Every column `toPayload` (components/scout/deal-draft-codec.ts) sends. */
const DEAL_KEYS = [
	'company_id', 'company_name', 'company_website', 'company_description', 'company_hq', 'sector_id',
	'founder_contact_name', 'founder_contact_email', 'founder_contact_phone',
	'round_type', 'instrument', 'currency_code', 'target_amount', 'committed_amount',
	'valuation', 'valuation_amount', 'valuation_basis', 'valuation_undisclosed', 'target_close_date', 'lead_status', 'lead_investor',
	'member_relationship', 'member_commitment', 'member_perspective',
	'materials_access', 'deck_path', 'one_pager_path', 'founder_consent',
] as const;

/** `POST /dealflow` (id null) and `PATCH /dealflow/:id`: drafts and returned deals only. */
function upsertDraft(ctx: SandboxCtx, id: string | null) {
	const state = readState(ctx);
	if (!state.profile) return notSetUp();
	if (!isRecord(ctx.body)) return badRequest('expected a JSON object');
	const body = ctx.body;
	const changes = Object.fromEntries(DEAL_KEYS.filter((k) => k in body).map((k) => [k, body[k]]));
	const now = daysFromNow(0);
	if (id === null) {
		const row: DraftDeal = {
			id: crypto.randomUUID(), source: 'circle', status: 'draft', company_name: null, round_type: null,
			currency_code: null, target_amount: null, review_notes: null, submitted_at: null,
			created_at: now, updated_at: now, company_anonymous: false, submitter_anonymous: false,
			founder_consent: false, committed_amount: null, lead_status: null, target_close_date: null, interest_count: 0, ...changes,
		};
		writeState(ctx, { ...state, drafts: [row, ...state.drafts] });
		return row;
	}
	const existing = state.drafts.find((m) => m.id === id);
	if (!existing || !['draft', 'changes_requested'].includes(existing.status)) return notFound();
	const updated: DraftDeal = { ...existing, ...changes, updated_at: now };
	writeState(ctx, { ...state, drafts: state.drafts.map((m) => (m.id === id ? updated : m)) });
	return updated;
}

/** `POST /:id/submit`: a draft with founder consent goes to review (`pending`). */
function submitDraft(ctx: SandboxCtx) {
	const state = readState(ctx);
	if (!state.profile) return notSetUp();
	const row = state.drafts.find((m) => m.id === ctx.params.id);
	if (!row) return notFound();
	if (!row.founder_consent) return badRequest('founder consent is required');
	const now = daysFromNow(0);
	const submitted: DraftDeal = { ...row, status: 'pending', submitted_at: now, updated_at: now };
	writeState(ctx, { ...state, drafts: state.drafts.map((m) => (m.id === row.id ? submitted : m)) });
	return submitted;
}

/** `PATCH /:id/live`: committed amount, lead status and close date of your own live deal; blank = no change. */
function patchLive(ctx: SandboxCtx) {
	const state = readState(ctx);
	const row = state.drafts.find((m) => m.id === ctx.params.id);
	if (!row || row.status !== 'live' || !isRecord(ctx.body)) return notFound();
	const b = ctx.body;
	const updated: DraftDeal = {
		...row,
		committed_amount: (b.committed_amount as MyDealRow['committed_amount']) ?? row.committed_amount,
		lead_status: (b.lead_status as string | null) ?? row.lead_status,
		target_close_date: (b.target_close_date as string | null) ?? row.target_close_date,
		updated_at: daysFromNow(0),
	};
	writeState(ctx, { ...state, drafts: state.drafts.map((m) => (m.id === row.id ? updated : m)) });
	return updated;
}

function requestIntro(ctx: SandboxCtx) {
	if (!findDeal(ctx.params.id)) return notFound();
	const state = readState(ctx);
	writeState(ctx, { ...state, interests: [...new Set([...state.interests, ctx.params.id])] });
	// Requesting an introduction grants nothing: `disclosed` stays false.
	return { deal_id: ctx.params.id, status: 'received', disclosed: false };
}

// ─── Routes ──────────────────────────────────────────────────────────────────

/** First match wins, so literal paths precede their `:id` siblings. */
export const scoutSandboxRoutes: SandboxRoute[] = [
	// Profile & thesis — the wizard's requests (use-thesis.ts `save`)
	['GET', '/api/scout', (ctx) => json(readState(ctx).profile)],
	['POST', '/api/scout', upsertProfile],
	['PATCH', '/api/scout', upsertProfile],
	['GET', '/api/scout/thesis', (ctx) => readState(ctx).thesis ?? EMPTY_THESIS],
	['PUT', '/api/scout/thesis', putThesis],

	// Discover
	['GET', '/api/scout/home', home],
	['GET', '/api/scout/recommended', recommendedRoute],
	['POST', '/api/scout/recommended/:id/dismiss', (ctx) => dismiss(ctx, true)],
	['DELETE', '/api/scout/recommended/:id/dismiss', (ctx) => dismiss(ctx, false)],
	// Same rows as the public feed (shared core-routes.ts), Scout-tier only on the server.
	['GET', '/api/scout/signals', async (ctx) => (await mockJson(`/api/signals${ctx.url.search}`)) ?? { data: [] }],

	// Deal Flow
	['GET', '/api/scout/dealflow', dealList],
	['GET', '/api/scout/dealflow/mine', (ctx) => ({ data: readState(ctx).drafts })],
	['GET', '/api/scout/dealflow/interest', (ctx) => ({ data: readState(ctx).interests.map((deal_id) => ({ deal_id, status: 'received', created_at: daysFromNow(0) })) })],
	['GET', '/api/scout/dealflow/can-submit', (ctx) => ({ can_submit: !!readState(ctx).profile?.investor_id })],
	['POST', '/api/scout/dealflow', (ctx) => upsertDraft(ctx, null)],
	['GET', '/api/scout/dealflow/:id', (ctx) => {
		const d = findDeal(ctx.params.id);
		return d ? forViewer(d, readState(ctx)) : notFound();
	}],
	['PATCH', '/api/scout/dealflow/:id', (ctx) => upsertDraft(ctx, ctx.params.id)],
	['PATCH', '/api/scout/dealflow/:id/live', patchLive],
	['PUT', '/api/scout/dealflow/:id/watch', (ctx) => setWatch(ctx, true)],
	['DELETE', '/api/scout/dealflow/:id/watch', (ctx) => setWatch(ctx, false)],
	['GET', '/api/scout/dealflow/:id/deck-url', (ctx) => documentRoute(ctx, 'deck')],
	['GET', '/api/scout/dealflow/:id/one-pager-url', (ctx) => documentRoute(ctx, 'one_pager')],
	['POST', '/api/scout/dealflow/:id/interest', requestIntro],
	['POST', '/api/scout/dealflow/:id/submit', submitDraft],
];

/** Used by core-routes until the shared fork drops it. Kept compatible: the world's companies, in the old shape. */
export const FALLBACK_COMPANIES = COMPANIES.map((c) => ({
	id: c.id, name: c.name, slug: c.slug, description: c.description, website: c.website, custom_logo_url: null,
	sector_id: sectorByName(c.sector).id, primary_sector: c.sector, hq_city: c.city, hq_country: countryByCode(c.country).name,
	total_funding_usd: String(fundingOf(c)), latest_round: roundsOf(c)[0]?.round ?? null, founded_year: c.founded, business_model: c.model,
}));
