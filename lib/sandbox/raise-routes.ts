/**
 * Sample-data routes for Atlas Raise: the founder's raise profile and criteria,
 * the Home read-model, the investor watchlist (pipeline), My Market, investor
 * matches (with Not relevant / Undo), the Fundraising Guide, the strategy
 * session and the Investor Circle opt-in — answered from a workspace kept in
 * this browser (store.ts).
 *
 * The visitor plays Alex Morgan, co-founder of Fanloop (fixtures/world.ts): a
 * Munich second-screen start-up that raised a pre-seed from Overtime Angels and
 * Corner Flag Ventures and is now raising a €1.5m seed with €300k committed.
 * The first request builds that workspace — raise set up, criteria filled,
 * eight investors in the watchlist — so the tour (tours/raise-tour.ts) opens on
 * a live-looking raise instead of the setup wizard.
 *
 * Investors, competitors and deals all come from the made-up world, so every
 * name here also appears in Investors, Companies and the investor profiles.
 * Investor list/detail, companies and deals themselves are shared routes
 * (core-routes.ts); this file only adds what is Raise's own.
 *
 * Response shapes mirror server/src/modules/raise/* and recommendations/*
 * (money as strings, YYYY-MM-DD for date columns, ISO for timestamps).
 */
import { PIPELINE_STAGES, type PipelineActivity, type PipelineAdd, type PipelineStage, type PipelineUpdate, type RaiseCriteria, type RaiseUpsert } from '@/types/api';
import { COMPANIES, DEALS, INVESTORS, SECTORS, companyByName, countryByCode, investorBy, investorByName, sectorByName, topSector, type WInvestor } from './fixtures/world';
import { daysFromNow, json, type SandboxCtx, type SandboxRoute } from './types';

// ─── Shapes (mirror the server rows) ────────────────────────────────────────

/** RaiseProfileRow in server/src/modules/raise/raise.repository.ts. */
type RaiseRow = Record<string, unknown> & {
	id: string; status: string; setup_completed_at: string | null; dealflow_opt_in: boolean; dealflow_status: string | null;
	company_id: string | null; company_name: string | null; company_sector_id: string | null; company_category: string[] | null;
	hq_country: string | null; target_amount: string | null; committed_amount: string | null; prior_capital_raised: string | null;
	round_type: string | null; currency_code: string | null; target_close_date: string | null;
};
/** RaiseCriteriaRow in the same file. */
type CriteriaRow = Record<string, unknown> & { raise_id: string; excluded_investor_ids: string[] | null };
/** PipelineRow in raise-pipeline.repository.ts. */
interface PipeRow {
	id: string; raise_id: string; investor_id: string | null; custom_name: string | null;
	investor_name: string | null; investor_slug: string | null; investor_logo_url: string | null; investor_website: string | null;
	stage: PipelineStage; contact_name: string | null; potential_amount: string | null; last_contact_at: string | null;
	next_step: string | null; next_step_due: string | null; notes: string | null; is_archived: boolean;
	/** null = the Main watchlist; otherwise a named investor list (user_watchlists, kind 'investors'). */
	watchlist_id: string | null;
	added_at: string; updated_at: string;
}
interface Workspace {
	v: number;
	raise: RaiseRow;
	criteria: CriteriaRow;
	pipeline: PipeRow[];
	activity: Record<string, PipelineActivity[]>;
	marketUpdatedAt: string;
	/** Investors marked "Not relevant" on Recommended (raise_investor_dismissals). */
	dismissed: string[];
	/** Fundraising Guide ticks, per resource slug. */
	checks: Record<string, string[]>;
	/** When the strategy session was requested, or null. */
	strategyRequestedAt: string | null;
}

const STATE_KEY = 'raiseWorkspace';
/** Bump to discard workspaces saved by older builds of this file. v4: the shared made-up world. */
const VERSION = 4;
const RAISE_ID = 'sample-raise';
const MATCH_CAP = 10;

const FANLOOP = companyByName('Fanloop');
const SECTOR = sectorByName(FANLOOP.sector);
/** Root → … → leaf names, as the wizard stores `company_category`. */
const SECTOR_PATH = (() => {
	const path: string[] = [];
	for (let s: typeof SECTOR | undefined = SECTOR; s; s = SECTORS.find((p) => p.id === s!.parent_id)) path.unshift(s.name);
	return path;
})();
const TOP = topSector(SECTOR);
const TARGET = 1_500_000;
const COMMITTED = 300_000;

const dateOnly = (n: number) => daysFromNow(n).slice(0, 10);
const money = (v: unknown): string | null => (v == null || v === '' || Number.isNaN(Number(v)) ? null : String(Number(v)));
const roundTo = (n: number, step: number) => Math.max(step, Math.round(n / step) * step);
const notFound = (message: string) => json({ error: { code: 'NOT_FOUND', message } }, 404);
const badRequest = (message: string) => json({ error: { code: 'VALIDATION_ERROR', message } }, 400);
const countryName = (code: string) => countryByCode(code)?.name ?? code;
/** Whether a company sits anywhere under Fanloop's top-level sector (Fans & Media). */
const inFanloopSpace = (sector: string) => {
	const s = SECTORS.find((x) => x.name === sector);
	return !!s && topSector(s).id === TOP.id;
};

// ─── The ready-made Fanloop raise ───────────────────────────────────────────

const sampleRaise = (): RaiseRow => ({
	id: RAISE_ID, profile_id: 'demo-user',
	company_id: FANLOOP.id, company_name: FANLOOP.name, company_website: FANLOOP.website,
	hq_country: countryName(FANLOOP.country), hq_city: FANLOOP.city,
	company_description: FANLOOP.description,
	company_category: SECTOR_PATH, company_sector_id: SECTOR.id,
	company_stage: 'seed', company_stage_other: null, revenue_status: 'generating', fundraising_process: 'approaching',
	round_type: 'seed', round_type_other: null,
	target_amount: String(TARGET), committed_amount: String(COMMITTED), currency_code: 'EUR',
	target_close_date: dateOnly(75), valuation: null, structure: 'equity', lead_investor_status: 'in_discussion',
	prior_capital_raised: '350000', last_round_date: dateOnly(-410), annual_revenue: '480000', revenue_growth_pct: '200',
	paying_customers: 14, monthly_burn: '65000', runway_months: 9,
	pitch_deck_status: 'have', financial_model_status: 'ready', data_room_status: 'in_progress', has_target_list: true,
	status: 'active', stage: null, setup_completed_at: daysFromNow(-21), dealflow_opt_in: false, dealflow_status: null,
	created_at: daysFromNow(-60), updated_at: daysFromNow(-2),
});

const sampleCriteria = (): CriteriaRow => ({
	raise_id: RAISE_ID,
	investor_types: ['VC', 'Angel', 'Strategic'], geographies: ['Europe', 'United Kingdom'],
	cheque_min: '100000', cheque_max: '750000', lead_preference: 'both', strategic_ok: true,
	excluded_investor_ids: [], desired_expertise: ['Commercial partnerships', 'Intros to clubs, leagues & federations'],
	biggest_concern: 'access',
});

// ─── Sample watchlist ───────────────────────────────────────────────────────

/**
 * Eight investors already in the Main watchlist. Kestrel Field Ventures and
 * Brightpost Ventures — the two best fits — are deliberately NOT here, so the
 * tour can add them; Podium Capital (sample-pipe-7) is the Target card the tour
 * drags to Contacted.
 */
interface SeedTemplate {
	investor: string; stage: PipelineStage; contact: string | null; amount: number | null; lastContact: number | null;
	nextStep: string | null; due: number | null; notes: string | null; addedDay: number; lastMoveDay: number;
}
const SEED: SeedTemplate[] = [
	{ investor: 'Corner Flag Ventures', stage: 'committed', contact: 'Giulia Conti', amount: COMMITTED, lastContact: -3, nextStep: 'Return signed SHA and send wire details', due: 5, notes: 'Following on from the pre-seed; wants a board observer seat.', addedDay: -58, lastMoveDay: -2 },
	{ investor: 'Sideline Family Office', stage: 'due_diligence', contact: 'Thomas Weber', amount: roundTo(TARGET * 0.33, 25_000), lastContact: -1, nextStep: 'Share data room and cohort retention', due: 3, notes: 'Could co-lead. Asked for churn by cohort and unit economics.', addedDay: -51, lastMoveDay: -4 },
	{ investor: 'Overtime Angels', stage: 'in_conversation', contact: 'Ciara Byrne', amount: 100_000, lastContact: -11, nextStep: 'Follow up on the syndicate call', due: -4, notes: 'Pre-seed investors; three angels keen to follow on.', addedDay: -44, lastMoveDay: -6 },
	{ investor: 'Halfway Line Partners', stage: 'in_conversation', contact: 'Lucía Romero', amount: null, lastContact: -5, nextStep: 'Intro call with a portfolio founder', due: 8, notes: null, addedDay: -36, lastMoveDay: -9 },
	{ investor: 'Tidepool Sport', stage: 'contacted', contact: 'Daan de Vries', amount: null, lastContact: -9, nextStep: null, due: null, notes: 'Sent deck via a warm intro from Overtime Angels.', addedDay: -30, lastMoveDay: -9 },
	{ investor: 'Breakaway Fund', stage: 'contacted', contact: null, amount: null, lastContact: -12, nextStep: 'Send updated deck after the warm intro', due: -2, notes: null, addedDay: -25, lastMoveDay: -12 },
	{ investor: 'Podium Capital', stage: 'target', contact: null, amount: null, lastContact: null, nextStep: 'Ask Giulia for a warm intro', due: 10, notes: 'Also in Munich — worth a coffee.', addedDay: -14, lastMoveDay: -14 },
	{ investor: 'Grandstand Growth', stage: 'target', contact: null, amount: null, lastContact: null, nextStep: null, due: null, notes: 'Too late-stage for this round; keep warm for the Series A.', addedDay: -8, lastMoveDay: -8 },
];

/** created → each stage in order up to the current one (+ a commitment), newest first. */
function seedActivity(t: SeedTemplate): PipelineActivity[] {
	const target = PIPELINE_STAGES.indexOf(t.stage);
	const out: PipelineActivity[] = [{ type: 'created', payload: { stage: 'target' }, occurred_at: daysFromNow(t.addedDay) }];
	for (let k = 1; k <= target; k++) {
		const day = t.addedDay + ((t.lastMoveDay - t.addedDay) * k) / target;
		out.push({ type: 'stage_change', payload: { from: PIPELINE_STAGES[k - 1], to: PIPELINE_STAGES[k] }, occurred_at: daysFromNow(day) });
	}
	if (t.amount) out.push({ type: 'commitment', payload: { amount: t.amount }, occurred_at: daysFromNow(t.lastMoveDay) });
	return out.reverse();
}

const investorFields = (inv: WInvestor) => ({
	investor_id: inv.id, custom_name: null, investor_name: inv.name, investor_slug: inv.slug,
	investor_logo_url: null, investor_website: inv.website,
});

function sampleWorkspace(): Workspace {
	const activity: Record<string, PipelineActivity[]> = {};
	const pipeline = SEED.map((t, i): PipeRow => {
		const id = `sample-pipe-${i + 1}`;
		activity[id] = seedActivity(t);
		return {
			id, raise_id: RAISE_ID, ...investorFields(investorByName(t.investor)),
			stage: t.stage, contact_name: t.contact, potential_amount: t.amount == null ? null : String(t.amount),
			last_contact_at: t.lastContact == null ? null : dateOnly(t.lastContact),
			next_step: t.nextStep, next_step_due: t.due == null ? null : dateOnly(t.due), notes: t.notes,
			is_archived: false, watchlist_id: null, added_at: daysFromNow(t.addedDay), updated_at: daysFromNow(t.lastMoveDay),
		};
	});
	return {
		v: VERSION, raise: sampleRaise(), criteria: sampleCriteria(), pipeline, activity,
		marketUpdatedAt: daysFromNow(-1), dismissed: [], checks: { 'pitch-deck-checklist': [PITCH_CHECKS[0], PITCH_CHECKS[1]] },
		strategyRequestedAt: null,
	};
}

/** The saved workspace, or the ready-made Fanloop one on first use (or after a VERSION bump). */
function workspace(ctx: SandboxCtx): Workspace {
	const cur = ctx.state[STATE_KEY] as Workspace | undefined;
	return cur?.v === VERSION ? cur : commit(ctx, sampleWorkspace());
}

function commit(ctx: SandboxCtx, ws: Workspace): Workspace {
	ctx.state[STATE_KEY] = ws;
	ctx.save();
	return ws;
}

/** Run a handler against the workspace. */
const withWs = <T>(fn: (ws: Workspace, ctx: SandboxCtx) => T) => (ctx: SandboxCtx) => fn(workspace(ctx), ctx);

// ─── Raise profile + criteria writes (Settings and the setup wizard) ────────

const RAISE_MONEY: (keyof RaiseUpsert)[] = ['target_amount', 'committed_amount', 'prior_capital_raised', 'annual_revenue', 'revenue_growth_pct', 'monthly_burn'];
const RAISE_INT: (keyof RaiseUpsert)[] = ['paying_customers', 'runway_months'];
const RAISE_KEYS: (keyof RaiseUpsert)[] = [
	'company_id', 'company_name', 'company_website', 'hq_country', 'hq_city', 'company_description', 'company_category',
	'company_sector_id', 'company_stage', 'company_stage_other', 'revenue_status', 'fundraising_process', 'round_type', 'round_type_other',
	'currency_code', 'target_close_date', 'valuation', 'structure', 'lead_investor_status', 'last_round_date',
	'pitch_deck_status', 'financial_model_status', 'data_room_status', 'has_target_list', 'status',
	...RAISE_MONEY, ...RAISE_INT,
];

function coerce(k: keyof RaiseUpsert, v: unknown): unknown {
	if (RAISE_MONEY.includes(k)) return money(v);
	if (RAISE_INT.includes(k)) return v == null || v === '' ? null : Math.trunc(Number(v));
	return v ?? null;
}

/** POST/PATCH /api/raise: patch only the provided keys (the sample raise is already set up). */
const upsertRaise = withWs((ws, ctx) => {
	const body = (ctx.body ?? {}) as RaiseUpsert;
	const patch = Object.fromEntries(RAISE_KEYS.filter((k) => k in body).map((k) => [k, coerce(k, body[k])]));
	const raise: RaiseRow = { ...ws.raise, ...patch, updated_at: daysFromNow(0) };
	return commit(ctx, { ...ws, raise }).raise;
});

const CRITERIA_MONEY: (keyof RaiseCriteria)[] = ['cheque_min', 'cheque_max'];
const CRITERIA_KEYS: (keyof RaiseCriteria)[] = ['investor_types', 'geographies', 'cheque_min', 'cheque_max', 'lead_preference', 'strategic_ok', 'excluded_investor_ids', 'desired_expertise', 'biggest_concern'];

/** PUT semantics, like raise.repository.ts putCriteria: every column is written (absent → null). */
const putCriteria = withWs((ws, ctx) => {
	const body = (ctx.body ?? {}) as RaiseCriteria;
	const next = Object.fromEntries(CRITERIA_KEYS.map((k) => [k, CRITERIA_MONEY.includes(k) ? money(body[k]) : body[k] ?? null]));
	return commit(ctx, { ...ws, criteria: { ...next, raise_id: RAISE_ID } as CriteriaRow }).criteria;
});

// ─── Home (mirror raise-home.service.ts) ────────────────────────────────────

function pipelineStats(rows: PipeRow[]) {
	const live = rows.filter((r) => !r.is_archived);
	const today = dateOnly(0);
	const count = (f: (r: PipeRow) => boolean) => live.filter(f).length;
	return {
		total: live.length,
		overdue: count((r) => !!r.next_step_due && r.next_step_due < today && !['closed', 'passed'].includes(r.stage)),
		no_next_step: count((r) => !['target', 'passed', 'closed'].includes(r.stage) && !r.next_step),
		committed_no_amount: count((r) => r.stage === 'committed' && r.potential_amount == null),
	};
}

type AttentionCard = { id: string; title: string; why: string; cta_label: string; cta_href: string; count?: number };

/** Attention cards in the server's priority order; Home shows the first three. */
function attentionFor(ws: Workspace): AttentionCard[] {
	const { raise } = ws;
	const s = pipelineStats(ws.pipeline);
	const out: AttentionCard[] = [];
	if (s.overdue > 0) out.push({ id: 'overdue', title: `Follow up with ${s.overdue} overdue investor${s.overdue > 1 ? 's' : ''}`, why: 'These conversations have a next step that is past due.', cta_label: 'Review overdue', cta_href: '/pipeline?filter=overdue', count: s.overdue });
	if (s.total < 5) out.push({ id: 'add-first', title: 'Add your first investors to the pipeline', why: 'Build a target list of at least five relevant investors to get moving.', cta_label: 'Find investors', cta_href: '/investors' });
	out.push({ id: 'matches', title: 'Investors who fit Fanloop', why: 'New matches on sector, stage and geography — with the reasons for each.', cta_label: 'See matches', cta_href: '/recommended' });
	if (s.no_next_step > 0) out.push({ id: 'next-steps', title: 'Add next steps to your active investors', why: 'Some active conversations have no next action — they will stall.', cta_label: 'Review investors', cta_href: '/pipeline?filter=no_next_step', count: s.no_next_step });
	if (raise.status === 'active' && !raise.dealflow_opt_in && raise.dealflow_status == null) {
		out.push({ id: 'dealflow', title: 'Share your round with the Investor Circle', why: 'Opt in and SportsTechX verifies your round, then shows it to vetted investors in Atlas Scout.', cta_label: 'See how it works', cta_href: '/settings' });
	}
	if (s.total >= 5 && !ws.strategyRequestedAt) out.push({ id: 'strategy', title: 'Book your strategy session', why: 'You have unlocked a session with SportsTechX leadership to pressure-test the raise.', cta_label: 'Book call', cta_href: '/strategy' });
	return out;
}

function buildHome(ws: Workspace) {
	const { raise } = ws;
	const total = pipelineStats(ws.pipeline).total;
	return {
		needs_setup: false,
		raise: {
			round_type: raise.round_type, target_amount: raise.target_amount, committed_amount: raise.committed_amount,
			currency_code: raise.currency_code, target_close_date: raise.target_close_date, status: raise.status,
			stage: 'due_diligence',
		},
		snapshot: { deck: { score: 71, status: 'done' }, pipeline_count: total },
		attention: attentionFor(ws).slice(0, 3),
		strategy: {
			status: ws.strategyRequestedAt ? 'booked' : total >= 5 ? 'available' : 'locked', scheduled_at: null, next_eligible_at: null,
			steps: [
				{ label: 'Raise profile completed', done: true },
				{ label: 'Pitch deck analysed', done: true },
				{ label: 'Five investors added', done: total >= 5 },
			],
		},
	};
}

// ─── Pipeline ───────────────────────────────────────────────────────────────

function listPipeline(ws: Workspace, url: URL): PipeRow[] {
	const list = url.searchParams.get('list');
	const filter = url.searchParams.get('filter');
	const stage = url.searchParams.get('stage');
	const today = dateOnly(0);
	return ws.pipeline
		.filter((r) => !list || (list === 'main' ? r.watchlist_id == null : r.watchlist_id === list))
		.filter((r) => (filter === 'archived' ? r.is_archived : !r.is_archived))
		.filter((r) => !stage || r.stage === stage)
		.filter((r) => filter !== 'overdue' || (!!r.next_step_due && r.next_step_due < today))
		.filter((r) => filter !== 'no_next_step' || (!['target', 'passed', 'closed'].includes(r.stage) && !r.next_step))
		.filter((r) => filter !== 'committed' || r.stage === 'committed')
		.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

const addToPipeline = withWs((ws, ctx) => {
	const body = (ctx.body ?? {}) as PipelineAdd & { watchlist_id?: string | null };
	if (!body.investor_id && !body.custom_name?.trim()) return badRequest('investor_id or custom_name required');
	const dup = body.investor_id ? ws.pipeline.find((r) => r.investor_id === body.investor_id && !r.is_archived) : undefined;
	if (dup) return dup;
	const inv = body.investor_id ? investorBy(body.investor_id) : undefined;
	if (body.investor_id && !inv) return notFound('investor not found');
	const now = daysFromNow(0);
	const stage = body.stage ?? 'target';
	const row: PipeRow = {
		id: `sample-pipe-${Date.now().toString(36)}`, raise_id: RAISE_ID,
		...(inv ? investorFields(inv) : { investor_id: null, custom_name: body.custom_name!.trim(), investor_name: null, investor_slug: null, investor_logo_url: null, investor_website: null }),
		stage, contact_name: body.contact_name ?? null, potential_amount: money(body.potential_amount),
		last_contact_at: null, next_step: body.next_step ?? null, next_step_due: body.next_step_due ?? null,
		notes: body.notes ?? null, is_archived: false, watchlist_id: body.watchlist_id ?? null, added_at: now, updated_at: now,
	};
	commit(ctx, { ...ws, pipeline: [row, ...ws.pipeline], activity: { ...ws.activity, [row.id]: [{ type: 'created', payload: { stage }, occurred_at: now }] } });
	return row;
});

const UPDATABLE: (keyof PipelineUpdate)[] = ['stage', 'contact_name', 'potential_amount', 'last_contact_at', 'next_step', 'next_step_due', 'notes', 'is_archived', 'watchlist_id'];

const updatePipeline = withWs((ws, ctx) => {
	const before = ws.pipeline.find((r) => r.id === ctx.params.id);
	if (!before) return notFound('pipeline entry not found');
	const body = (ctx.body ?? {}) as PipelineUpdate;
	const provided = UPDATABLE.filter((k) => k in body);
	if (provided.length === 0) return before;

	const patch = Object.fromEntries(provided.map((k) => [k, k === 'potential_amount' ? money(body[k]) : body[k] ?? null]));
	const now = daysFromNow(0);
	const row: PipeRow = { ...before, ...patch, is_archived: body.is_archived ?? before.is_archived, stage: body.stage ?? before.stage, updated_at: now };
	const events: PipelineActivity[] = [];
	if (body.stage && body.stage !== before.stage) events.push({ type: 'stage_change', payload: { from: before.stage, to: body.stage }, occurred_at: now });
	if (row.potential_amount != null && row.potential_amount !== before.potential_amount) events.push({ type: 'commitment', payload: { amount: Number(row.potential_amount) }, occurred_at: now });

	commit(ctx, {
		...ws,
		pipeline: ws.pipeline.map((r) => (r.id === row.id ? row : r)),
		activity: { ...ws.activity, [row.id]: [...events, ...(ws.activity[row.id] ?? [])] },
	});
	return row;
});

// ─── My Market ──────────────────────────────────────────────────────────────

const raisedBy = (company: string) => DEALS.filter((d) => d.company === company).reduce((n, d) => n + (d.amount_usd ?? 0), 0);
const fmtUsd = (n: number) => (!n ? 'Undisclosed' : n >= 1e6 ? `$${(n / 1e6).toFixed(1).replace(/\.0$/, '')}m raised` : `$${Math.round(n / 1e3)}k raised`);

/** raise-market.service.ts — no sector → `{ unavailable, reason: 'no_sector' }` (only after a Settings edit clears it). */
function buildMarket(ctx: SandboxCtx, force: boolean) {
	const ws = workspace(ctx);
	if (!ws.raise.company_sector_id) return { unavailable: true, reason: 'no_sector' };
	const competitors = COMPANIES.filter((c) => c.name !== FANLOOP.name && inFanloopSpace(c.sector))
		.map((c) => ({ c, raised: raisedBy(c.name) }))
		.sort((a, b) => b.raised - a.raised);
	const updatedAt = force ? commit(ctx, { ...ws, marketUpdatedAt: daysFromNow(0) }).marketUpdatedAt : ws.marketUpdatedAt;
	const totalFunding = competitors.reduce((n, x) => n + x.raised, 0);
	const sector = SECTOR_PATH.at(-1)!;
	return {
		raise_id: RAISE_ID,
		tam: '6800000000', sam: '540000000', cagr: '11.8',
		classification: SECTOR_PATH.join(' → '),
		insight_md: `Clubs and leagues are moving budget from one-off match-day campaigns to recurring ${sector.toLowerCase()} software tied to their own fan data. Funding in ${TOP.name} sits with a few later-stage players such as Strikezone Media and Matchday Loop, which leaves room for a seed-stage company that proves renewal uplift in Germany before expanding.`,
		methodology: {
			estimating: false,
			approach: `TAM sized bottom-up from the number of clubs, leagues and rights holders in Europe × average annual software spend; SAM narrowed to Germany and neighbouring markets reachable within 24 months. Funding, competitor counts and CAGR come from SportsTechX data (sample figures in this tutorial).`,
			grounded: { sector: TOP.name, total_funding_usd: totalFunding, funded_companies: competitors.filter((x) => x.raised > 0).length, companies_tracked: competitors.length, deals: DEALS.filter((d) => competitors.some((x) => x.c.name === d.company)).length, funding_cagr_pct: 14.2 },
			assumptions: [
				'Roughly 2,400 professional and semi-professional clubs, leagues and rights holders in Europe',
				'Average annual software spend of €280k per top-tier customer',
				'SAM limited to customers reachable from Germany within 24 months',
				'Digital budgets grow in line with media-rights revenue',
			],
			sources: ['SportsTechX deals & companies dataset (sample)', 'Club finance benchmarks (sample)'],
		},
		competitors: competitors.map(({ c, raised }) => ({ id: c.id, name: c.name, website: c.website, custom_logo_url: null, hq_country: countryName(c.country), funding: fmtUsd(raised) })),
		updated_at: updatedAt,
	};
}

// ─── Investor matches ───────────────────────────────────────────────────────

const EUROPE = new Set(['DE', 'GB', 'ES', 'NL', 'FR', 'IT', 'PT', 'IE', 'SE', 'DK', 'CH', 'AT']);

/** Deals this investor did with companies in Fanloop's space. */
const sectorDeals = (inv: WInvestor) => DEALS.filter((d) => d.investors.includes(inv.name) && inFanloopSpace(companyByName(d.company).sector)).length;

function matchOf(inv: WInvestor) {
	const deals = sectorDeals(inv);
	const sectorFit = inv.focus.some(inFanloopSpace);
	const stageFit = inv.stages.includes('Seed');
	const reasons = [
		...(sectorFit ? ['Thesis targets your sector'] : []),
		...(deals ? [`${deals} prior deal${deals === 1 ? '' : 's'} in your sector`] : []),
		...(stageFit ? ['Backs your funding stage'] : []),
		inv.country === 'DE' ? 'Targets your country (Germany)' : EUROPE.has(inv.country) ? 'Invests in your target geographies' : 'Invests internationally',
		'Actively investing',
	];
	const score = Math.min(96, 40 + (sectorFit ? 22 : 0) + deals * 7 + (stageFit ? 14 : 0) + (EUROPE.has(inv.country) ? 6 : 0));
	return {
		id: inv.id, name: inv.name, slug: inv.slug, website: inv.website, logo_url: null,
		hq_country: countryName(inv.country), category: inv.category, description: inv.description,
		score, match_reasons: reasons,
	};
}

/** Matches, investors not yet in a watchlist first (so the top match can be added). */
function buildMatches(ws: Workspace, url: URL) {
	if (!ws.raise.company_sector_id) return { company: null, reason: 'no_company_claim', results: [] };
	const limit = Math.min(Number(url.searchParams.get('limit')) || 12, MATCH_CAP);
	const hidden = new Set([...(ws.criteria.excluded_investor_ids ?? []), ...ws.dismissed]);
	const tracked = new Set(ws.pipeline.filter((r) => !r.is_archived).map((r) => r.investor_id));
	const ranked = INVESTORS.filter((i) => !hidden.has(i.id)).map(matchOf).sort((a, b) => b.score - a.score);
	const results = [...ranked.filter((m) => !tracked.has(m.id)), ...ranked.filter((m) => tracked.has(m.id))].slice(0, limit);
	return { company: { id: FANLOOP.id, name: ws.raise.company_name ?? FANLOOP.name }, results };
}

const dismiss = (on: boolean) => withWs((ws, ctx) => {
	const id = ctx.params.id;
	const dismissed = on ? [...new Set([...ws.dismissed, id])] : ws.dismissed.filter((d) => d !== id);
	commit(ctx, { ...ws, dismissed });
	return { ok: true };
});

/** `GET /api/investors/:id/thesis` — cheque, stages and geography from the made-up investor. */
function investorThesis(id: string) {
	const inv = investorBy(id);
	if (!inv) return notFound('investor not found');
	return {
		thesis: { amount_min_usd: String(inv.cheque[0]), amount_max_usd: String(inv.cheque[1]) },
		round_types: inv.stages.map((name) => ({ name })),
		geo: [{ scope_type: 'continent', scope_value: EUROPE.has(inv.country) ? 'Europe' : 'North America' }],
	};
}

// ─── Fundraising Guide (raise_resources) ────────────────────────────────────

type Phase = 'prepare' | 'connect' | 'close';
type Kind = 'guide' | 'template' | 'checklist';
interface Resource { slug: string; phase: Phase; kind: Kind; title: string; summary: string; body_md: string }

const PITCH_CHECKS = [
	'The problem is told from the club’s side, with a number',
	'Traction slide shows paying customers and growth',
	'Market size is built bottom-up',
	'Competition slide names real alternatives',
	'Use of funds ties each hire to a milestone',
	'The ask states amount, instrument and timeline',
];
const checklist = (items: string[]) => items.map((i) => `- [ ] ${i}`).join('\n');

/** Sample guide content (the real guide is edited by SportsTechX in admin). */
const RESOURCES: Resource[] = [
	{ slug: 'how-investors-read-a-deck', phase: 'prepare', kind: 'guide', title: 'How investors read your deck', summary: 'What a partner looks for in the three minutes they give a first deck.',
		body_md: '## The first three minutes\nMost investors decide whether to take a call from the first pass. They look for a clear problem, proof that someone pays, and a team that can win.\n\n> Tip: put traction on slide three, not slide nine.\n\n## What makes them stop reading\n- A market slide with only top-down numbers\n- No mention of competition\n- An ask without a timeline' },
	{ slug: 'pitch-deck-checklist', phase: 'prepare', kind: 'checklist', title: 'Pitch deck checklist', summary: 'Tick off the slides seed investors expect before you send the deck.',
		body_md: `## Before you send it\n${checklist(PITCH_CHECKS)}` },
	{ slug: 'one-pager-template', phase: 'prepare', kind: 'template', title: 'One-pager template', summary: 'A short company summary you can paste into an email.',
		body_md: '## Your one-pager\nFill in the brackets and keep it under 150 words.\n\n> [Company] helps [customer] [do what] by [how].\n> We have [traction] and are raising [amount] to [milestone].' },
	{ slug: 'building-your-target-list', phase: 'connect', kind: 'guide', title: 'Building your target list', summary: 'How to pick 40 investors who actually back companies like yours.',
		body_md: '## Start from fit, not fame\nFilter by sector, stage and cheque size first. Then look at who they backed in the last two years.\n\n## Warm beats cold\n1. List the founders in each investor’s portfolio\n2. Ask the ones you know for an intro\n3. Track every conversation in your watchlist' },
	{ slug: 'cold-email-template', phase: 'connect', kind: 'template', title: 'Investor intro email', summary: 'A short email for a warm intro or a cold first touch.',
		body_md: '## The email\n> Hi [name],\n> [Mutual contact] suggested I reach out. Fanloop helps clubs keep season-ticket holders renewing — 14 clubs live, ARR up 3x this year.\n> We are raising a €1.5m seed. Would you be open to a 20-minute call next week?' },
	{ slug: 'outreach-checklist', phase: 'connect', kind: 'checklist', title: 'Outreach checklist', summary: 'Keep every investor conversation moving.',
		body_md: `## Every week\n${checklist(['Every active investor has a next step', 'Overdue follow-ups are sent', 'New investors added from your matches', 'Committed amounts are recorded'])}` },
	{ slug: 'due-diligence-checklist', phase: 'close', kind: 'checklist', title: 'Due diligence checklist', summary: 'Have these ready before a term sheet arrives.',
		body_md: `## In your data room\n${checklist(['Cap table', 'Financial model and last 12 months of accounts', 'Customer contracts', 'Cohort retention', 'IP assignments for every founder'])}` },
	{ slug: 'term-sheet-basics', phase: 'close', kind: 'guide', title: 'Term sheet basics', summary: 'The handful of terms that matter at seed.',
		body_md: '## What to look at first\n- Valuation and the option pool\n- Liquidation preference\n- Board composition\n\n> Tip: agree the option pool size before you negotiate valuation.' },
];

const itemsOf = (r: Resource) => [...r.body_md.matchAll(/^-\s\[\s?\]\s+(.+)$/gm)].map((m) => m[1]!);
const resourceCard = (ws: Workspace, r: Resource, i: number) => {
	const items = itemsOf(r);
	return { id: `sample-resource-${i + 1}`, slug: r.slug, phase: r.phase, kind: r.kind, title: r.title, summary: r.summary, items_total: items.length, items_done: (ws.checks[r.slug] ?? []).filter((c) => items.includes(c)).length };
};

const putCheck = withWs((ws, ctx) => {
	const r = RESOURCES.find((x) => x.slug === ctx.params.slug);
	if (!r) return notFound('resource not found');
	const { item, checked } = (ctx.body ?? {}) as { item?: string; checked?: boolean };
	if (!item || !itemsOf(r).includes(item)) return badRequest('unknown checklist item');
	const cur = ws.checks[r.slug] ?? [];
	const next = checked ? [...new Set([...cur, item])] : cur.filter((c) => c !== item);
	commit(ctx, { ...ws, checks: { ...ws.checks, [r.slug]: next } });
	return { checked: next };
});

// ─── Routes ─────────────────────────────────────────────────────────────────

/** Share the round with the Investor Circle (pending review), or withdraw it. */
const setOptIn = (on: boolean) => withWs((ws, ctx) => {
	commit(ctx, { ...ws, raise: { ...ws.raise, dealflow_opt_in: on, dealflow_status: on ? 'pending' : null, dealflow_submitted_at: on ? daysFromNow(0) : null } });
	return { ok: true };
});

/** First match wins, so literal paths precede their `:id` siblings. */
export const raiseSandboxRoutes: SandboxRoute[] = [
	['GET', '/api/investors/:id/thesis', ({ params }) => investorThesis(params.id)],

	// Raise profile + criteria (Settings, the setup wizard, Investors → criteria summary).
	['GET', '/api/raise', withWs((ws) => ({ raise: ws.raise, criteria: ws.criteria }))],
	['POST', '/api/raise', upsertRaise],
	['PATCH', '/api/raise', upsertRaise],
	['GET', '/api/raise/home', withWs(buildHome)],
	['GET', '/api/raise/criteria', withWs((ws) => ws.criteria)],
	['PUT', '/api/raise/criteria', putCriteria],
	['POST', '/api/raise/strategy/book', withWs((ws, ctx) => {
		commit(ctx, { ...ws, strategyRequestedAt: daysFromNow(0) });
		return { ok: true };
	})],

	// My Market.
	['GET', '/api/raise/market', (ctx) => buildMarket(ctx, ctx.url.searchParams.get('force') === '1')],

	// Investor watchlists (pipeline): stateful, so moves / adds / edits persist.
	['GET', '/api/raise/pipeline', withWs((ws, ctx) => ({ data: listPipeline(ws, ctx.url) }))],
	['POST', '/api/raise/pipeline', addToPipeline],
	['PATCH', '/api/raise/pipeline/:id', updatePipeline],
	['GET', '/api/raise/pipeline/:id/activity', withWs((ws, ctx) => (
		ws.pipeline.some((r) => r.id === ctx.params.id) ? { data: ws.activity[ctx.params.id] ?? [] } : notFound('pipeline entry not found')
	))],

	// Fundraising Guide.
	['GET', '/api/raise/resources', withWs((ws) => ({ data: RESOURCES.map((r, i) => resourceCard(ws, r, i)) }))],
	['GET', '/api/raise/resources/:slug', withWs((ws, ctx) => {
		const i = RESOURCES.findIndex((r) => r.slug === ctx.params.slug);
		if (i < 0) return notFound('resource not found');
		return { ...resourceCard(ws, RESOURCES[i]!, i), body_md: RESOURCES[i]!.body_md, checked: ws.checks[RESOURCES[i]!.slug] ?? [] };
	})],
	['PUT', '/api/raise/resources/:slug/checks', putCheck],

	// Deal Flow opt-in (Settings): share the round with the Investor Circle, or withdraw it.
	['GET', '/api/raise/dealflow/opt-in', withWs(({ raise }) => ({
		opted_in: raise.dealflow_opt_in, status: raise.dealflow_status, review_notes: null,
		submitted_at: (raise.dealflow_submitted_at as string | null | undefined) ?? null, has_raise: true,
	}))],
	['POST', '/api/raise/dealflow/opt-in', setOptIn(true)],
	['DELETE', '/api/raise/dealflow/opt-in', setOptIn(false)],

	// Founder recommendations: matches, with "Not relevant" and its Undo.
	['GET', '/api/recommendations/investors', withWs((ws, ctx) => buildMatches(ws, ctx.url))],
	['POST', '/api/recommendations/investors/:id/dismiss', dismiss(true)],
	['DELETE', '/api/recommendations/investors/:id/dismiss', dismiss(false)],
];
