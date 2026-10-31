/**
 * The world (fixtures/world.ts) expanded into each catalog endpoint's response
 * shape — companies, investors, rounds, acquisitions, events, programs,
 * reports, signals. Shapes follow types/api.ts and the consuming components
 * named on each builder; numbers are derived from DEALS / ACQUISITIONS so every
 * page agrees (a company's total funding is the sum of its rounds).
 */
import type { Company, Deal, Investor, InvestorListItem, Page, ReportListItem, Signal } from '@/types/api';
import {
	ACQUISITIONS, ARTICLES, COMPANIES, DEALS, EVENTS, INVESTORS, PROGRAMS, REPORTS, SECTORS, SPORTS, TECH_TAGS,
	ago, agoDate, companyByName, countryByCode, investorByName, roundByName, sectorByName, slugify, topSector,
	type WAcquisition, type WCompany, type WDeal, type WEvent, type WInvestor, type WProgram,
} from '../fixtures/world';

// ─── Paging, filtering, sorting ──────────────────────────────────────────────

/** `Page<T>` from the request's page/limit/offset. */
export function paginate<T>(rows: T[], url: URL, defaultLimit = 25): Page<T> {
	const sp = url.searchParams;
	const limit = Math.max(1, Math.min(500, Number(sp.get('limit')) || defaultLimit));
	const page = Math.max(1, Number(sp.get('page')) || 1);
	const offset = sp.has('offset') ? Math.max(0, Number(sp.get('offset')) || 0) : (page - 1) * limit;
	return {
		data: rows.slice(offset, offset + limit), total: rows.length, page, limit, offset,
		totalPages: Math.max(1, Math.ceil(rows.length / limit)), nextCursor: null,
	};
}

/** `sort=-field` / `sort=field` over any row field (nulls last). */
export function sortBy<T>(rows: T[], sort: string | null, fields: Record<string, (r: T) => string | number | null>): T[] {
	if (!sort) return rows;
	const desc = sort.startsWith('-');
	const get = fields[sort.replace(/^-/, '')];
	if (!get) return rows;
	return [...rows].sort((a, b) => {
		const x = get(a); const y = get(b);
		if (x == null) return y == null ? 0 : 1;
		if (y == null) return -1;
		const c = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y));
		return desc ? -c : c;
	});
}

const has = (hay: Array<string | null | undefined>, q: string) => hay.some((h) => h?.toLowerCase().includes(q.toLowerCase()));
/** Comma-separated param as a list (sector_slug is sent expanded: "a,b,c"). */
export const listParam = (url: URL, key: string) => (url.searchParams.get(key) ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const flag = (url: URL, key: string) => url.searchParams.get(key) === 'true';

/** A sector id or slug plus every sector beneath it. */
function sectorFamily(idOrSlug: string): Set<string> {
	const root = SECTORS.find((s) => s.id === idOrSlug || s.slug === idOrSlug);
	if (!root) return new Set();
	const out = new Set([root.slug]);
	for (let grew = true; grew;) {
		grew = false;
		for (const s of SECTORS) if (s.parent_id && !out.has(s.slug) && out.has(SECTORS.find((p) => p.id === s.parent_id)!.slug)) { out.add(s.slug); grew = true; }
	}
	return out;
}
/** Slugs a sector filter matches: `sector_slug` (already expanded by the UI) or `sector_id` (expanded here). */
function sectorFilter(url: URL): Set<string> | null {
	const slugs = listParam(url, 'sector_slug');
	if (slugs.length) return new Set(slugs);
	const id = url.searchParams.get('sector_id');
	return id ? sectorFamily(id) : null;
}

// ─── Companies ───────────────────────────────────────────────────────────────

const usd = (n: number | null) => (n == null ? null : String(n));
const dealsOf = (c: WCompany) => DEALS.filter((d) => d.company === c.name).sort((a, b) => a.daysAgo - b.daysAgo);
export const fundingOf = (c: WCompany) => dealsOf(c).reduce((sum, d) => sum + (d.amount_usd ?? 0), 0);
/** Added to Atlas at a steady pace, newest last in the list — stable "Newest" sort. */
const addedAt = (c: WCompany) => ago(30 + COMPANIES.indexOf(c) * 23);

export function companyListItem(c: WCompany): Company & { total_funding: number } {
	const sector = sectorByName(c.sector);
	const country = countryByCode(c.country);
	const deals = dealsOf(c);
	const funding = fundingOf(c);
	return {
		id: c.id, name: c.name, website: c.website, slug: c.slug, custom_logo_url: null, description: c.description,
		status: c.status ?? 'active', founded_year: c.founded, ipo_date: null, sector_id: sector.id, business_model: c.model,
		location_id: null, social_profile_id: null, is_verified: !!c.is_verified, is_unicorn: false,
		is_actively_raising: !!c.is_actively_raising,
		poc_first_name: null, poc_last_name: null, poc_job_position: null, poc_email: null, poc_linkedin: null,
		accelerator: c.accelerator ?? null, cohort: c.accelerator ? '2026' : null, added_by_profile_id: null,
		created_at: addedAt(c), updated_at: ago(7),
		primary_sector: sector.name, primary_sector_slug: sector.slug, hq_city: c.city, hq_country: country.name,
		primary_sport: c.sport, total_funding_usd: funding,
		// Company detail extras (detailSql) — the list carries them too, harmlessly.
		hq_region: country.region, twitter_url: null, instagram_url: null, facebook_url: null,
		linkedin_url: null, youtube_url: null, contact_email: `hello@${c.website}`,
		sport_count: 1, tech_tag_count: c.tags.length, deal_count: deals.length,
		last_deal_date: deals[0] ? agoDate(deals[0].daysAgo) : null, last_round_type: deals[0]?.round ?? null,
		// framework-category.tsx reads `total_funding`.
		total_funding: funding,
	};
}

/** `GET /api/companies` — filters as market-companies.tsx, framework and raise-setup send them. */
export function listCompanies(url: URL) {
	const sp = url.searchParams;
	const q = sp.get('q')?.trim();
	const sectors = sectorFilter(url);
	const tech = sp.get('tech_tag_slug');
	let rows = COMPANIES.filter((c) => {
		const country = countryByCode(c.country);
		if (q && !has([c.name, c.description, c.website], q)) return false;
		if (sectors && !sectors.has(sectorByName(c.sector).slug)) return false;
		if (sp.get('business_model') && c.model !== sp.get('business_model')) return false;
		if (sp.get('sport_id') && SPORTS.find((s) => s.id === sp.get('sport_id'))?.name !== c.sport) return false;
		if (sp.get('country') && country.name !== sp.get('country')) return false;
		if (sp.get('city') && c.city !== sp.get('city')) return false;
		if (sp.get('continent') && country.continent !== sp.get('continent')) return false;
		if (sp.get('region') && country.region !== sp.get('region')) return false;
		if (sp.get('min_funding') && fundingOf(c) < Number(sp.get('min_funding'))) return false;
		if (sp.get('founded_year_min') && c.founded < Number(sp.get('founded_year_min'))) return false;
		if (flag(url, 'is_verified') && !c.is_verified) return false;
		if (flag(url, 'is_actively_raising') && !c.is_actively_raising) return false;
		if (flag(url, 'is_unicorn')) return false;
		if (tech && !c.tags.some((t) => slugify(t) === tech)) return false;
		if (sp.get('ids') && !listParam(url, 'ids').includes(c.id)) return false;
		return true;
	}).map(companyListItem);
	rows = sortBy(rows, sp.get('sort') ?? '-created_at', {
		created_at: (r) => r.created_at, name: (r) => r.name, total_funding: (r) => r.total_funding_usd,
	});
	return paginate(rows, url);
}

export const companyTechTags = (c: WCompany) => c.tags.map((name) => TECH_TAGS.find((t) => t.name === name)!).filter(Boolean);
export const companySports = (c: WCompany) => SPORTS.filter((s) => s.name === c.sport).map((s) => ({ ...s, is_primary: true }));

/** Same top-level sector, closest funding first — company-profile.tsx "Similar". */
export function similarCompanies(c: WCompany) {
	const top = topSector(sectorByName(c.sector)).id;
	return COMPANIES.filter((o) => o.id !== c.id && topSector(sectorByName(o.sector)).id === top).slice(0, 5).map((o) => ({
		id: o.id, name: o.name, slug: o.slug, hq_city: o.city, hq_country: countryByCode(o.country).name,
		last_round_type: dealsOf(o)[0]?.round ?? null, primary_sector: o.sector,
	}));
}

const money = (n: number | null) => (n == null ? 'an undisclosed amount' : n >= 1e6 ? `$${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M` : `$${Math.round(n / 1e3)}k`);

/** Company news — its own rounds and deals from the world, written as headlines. */
export function companyNews(c: WCompany) {
	const rounds = dealsOf(c).map((d) => ({
		id: `${d.id}-news`, title: `${c.name} raises ${money(d.amount_usd)} ${d.round}${d.investors[0] ? ` led by ${d.investors[0]}` : ''}`,
		url: null, source: 'SportsTechX Wire', summary: null, published_at: ago(d.daysAgo), daysAgo: d.daysAgo,
	}));
	const deals = ACQUISITIONS.filter((a) => a.target === c.name || a.acquirer === c.name).map((a) => ({
		id: `${a.id}-news`, title: `${a.acquirer} acquires ${a.target}${a.price_usd ? ` for ${money(a.price_usd)}` : ''}`,
		url: null, source: 'SportsTechX Wire', summary: null, published_at: ago(a.daysAgo), daysAgo: a.daysAgo,
	}));
	return [...rounds, ...deals].sort((a, b) => a.daysAgo - b.daysAgo).map(({ daysAgo: _, ...n }) => n);
}

/** Primary contact (use-primary-contact.ts) — a made-up person at the company. */
const FIRST = ['Lena', 'Tom', 'Sofia', 'Jonas', 'Maya', 'Lucas', 'Ines', 'Oliver', 'Nora', 'Mateo', 'Freya', 'Daniel'];
const LAST = ['Vogt', 'Hughes', 'Romero', 'de Vries', 'Laurent', 'Rossi', 'Costa', 'Byrne', 'Lindqvist', 'Hansen', 'Keller', 'Weber'];
export function companyContact(c: WCompany) {
	const i = COMPANIES.indexOf(c);
	const first = FIRST[i % FIRST.length]; const last = LAST[(i * 5) % LAST.length];
	return {
		id: `${c.id}-contact`, full_name: `${first} ${last}`, job_position: 'Co-founder & CEO',
		email: `${first.toLowerCase()}@${c.website}`, linkedin_url: null,
		phone: null, role: 'founder',
	};
}

// ─── Funding rounds ──────────────────────────────────────────────────────────

export function dealRow(d: WDeal): Deal {
	const c = companyByName(d.company);
	const sector = sectorByName(c.sector);
	const round = roundByName(d.round);
	const date = agoDate(d.daysAgo);
	const investors = d.investors.map(investorByName);
	return {
		id: d.id, company_id: c.id, round_type_id: round.id, announced_date: date, announced_year: Number(date.slice(0, 4)),
		amount: usd(d.amount_usd), amount_usd: usd(d.amount_usd), currency_code: 'USD',
		deal_size_bucket: d.amount_usd == null ? null : d.amount_usd < 1e6 ? 'under_1m' : d.amount_usd < 1e7 ? 'from_1m_to_10m' : d.amount_usd < 1e8 ? 'from_10m_to_100m' : 'over_100m',
		status: 'active', sector_id: sector.id, business_model: c.model, source_url: null, transaction_url: null,
		location_id: null, added_by_profile_id: null, created_at: ago(d.daysAgo), updated_at: ago(d.daysAgo),
		company_name: c.name, company_slug: c.slug, company_website: c.website, company_custom_logo_url: null,
		company_description: c.description, company_is_verified: !!c.is_verified, primary_sector: sector.name, sector_slug: sector.slug,
		round_type_name: round.name, round_type_slug: round.slug, hq_city: c.city, hq_country: countryByCode(c.country).name,
		total_funding_usd: String(fundingOf(c)), lead_investor: investors[0]?.name ?? null,
		investors: investors.map((i) => i.name),
		investor_links: investors.map((i, n) => ({ name: i.name, slug: i.slug, is_lead: n === 0 })),
	};
}

/** `GET /api/deals` — company profile, investor profile, Recently Funded and the Monthly Roundup. */
export function listDeals(url: URL) {
	const sp = url.searchParams;
	const q = sp.get('q')?.trim();
	const inv = sp.get('investor_id');
	const investor = inv ? INVESTORS.find((i) => i.id === inv || i.slug === inv) : null;
	const from = sp.get('from'); const to = sp.get('to');
	let rows = DEALS.map(dealRow).filter((d) => {
		if (sp.get('company_id') && d.company_id !== sp.get('company_id')) return false;
		if (inv && !d.investors?.includes(investor?.name ?? '')) return false;
		if (q && !has([d.company_name, d.company_description, ...(d.investors ?? [])], q)) return false;
		if (sp.get('round_type_slug') && d.round_type_slug !== sp.get('round_type_slug')) return false;
		if (sp.get('country') && d.hq_country !== sp.get('country')) return false;
		if (from && d.announced_date! < from.slice(0, 10)) return false;
		if (to && d.announced_date! > to.slice(0, 10)) return false;
		return true;
	});
	rows = sortBy(rows, sp.get('sort') ?? '-announced_date', {
		announced_date: (r) => r.announced_date, amount_usd: (r) => (r.amount_usd == null ? null : Number(r.amount_usd)),
	});
	return paginate(rows, url);
}

// ─── Investors ───────────────────────────────────────────────────────────────

const dealsWith = (i: WInvestor) => DEALS.filter((d) => d.investors.includes(i.name)).sort((a, b) => a.daysAgo - b.daysAgo);

export function investorRow(i: WInvestor): InvestorListItem & Investor {
	const deals = dealsWith(i);
	const country = countryByCode(i.country);
	const latest = deals[0];
	return {
		id: i.id, name: i.name, website: i.website, slug: i.slug, description: i.description, status: 'active',
		category: i.category, year_launched: i.launched, location_id: null, social_profile_id: null,
		is_verified: !!i.is_verified, actively_investing: true, keywords: i.focus.join(', '), num_employees: null,
		logo_url: null, total_funding: null, latest_funding: latest ? latest.company : null,
		latest_funding_amount: latest ? usd(latest.amount_usd) : null, last_raised_at: latest ? agoDate(latest.daysAgo) : null,
		annual_revenue: null, num_exits: ACQUISITIONS.filter((a) => deals.some((d) => d.company === a.target)).length,
		num_investments: deals.length, analyst_notes: null, added_by_profile_id: null,
		created_at: ago(60 + INVESTORS.indexOf(i) * 31), updated_at: ago(10),
		deals_count: deals.length, hq_city: i.city, hq_country: country.name,
		thesis: `${i.stages.join(' and ')} rounds in ${i.focus.join(' and ')}, cheques of ${money(i.cheque[0])}–${money(i.cheque[1])}.`,
		total_aum_usd: usd(i.aum_usd ?? null),
		hq_region: country.region, twitter_url: null, instagram_url: null, facebook_url: null,
		linkedin_url: null, youtube_url: null, contact_email: `deals@${i.website}`,
	};
}

/** `GET /api/investors` — filters as components/raise/investors.tsx sends them. */
export function listInvestors(url: URL) {
	const sp = url.searchParams;
	const q = sp.get('q')?.trim();
	const sectors = sectorFilter(url);
	const ids = listParam(url, 'ids');
	const sport = sp.get('sport_id') ? SPORTS.find((s) => s.id === sp.get('sport_id'))?.name : null;
	let rows = INVESTORS.filter((i) => {
		const country = countryByCode(i.country);
		const companies = dealsWith(i).map((d) => companyByName(d.company));
		if (ids.length && !ids.includes(i.id)) return false;
		if (q && !has([i.name, i.description, i.website], q)) return false;
		if (sp.get('category') && i.category !== sp.get('category')) return false;
		if (sp.get('round_type_slug') && !i.stages.some((s) => slugify(s) === sp.get('round_type_slug'))) return false;
		if (sectors && !i.focus.some((f) => sectors.has(slugify(f))) && !companies.some((c) => sectors.has(sectorByName(c.sector).slug))) return false;
		if (sport && !companies.some((c) => c.sport === sport)) return false;
		if (sp.get('country') && country.name !== sp.get('country')) return false;
		if (sp.get('city') && i.city !== sp.get('city')) return false;
		if (sp.get('continent') && country.continent !== sp.get('continent')) return false;
		if (sp.get('region') && country.region !== sp.get('region')) return false;
		if (sp.get('year_launched_min') && i.launched < Number(sp.get('year_launched_min'))) return false;
		if (sp.get('deals_min') && dealsWith(i).length < Number(sp.get('deals_min'))) return false;
		if (flag(url, 'is_verified') && !i.is_verified) return false;
		return true;
	}).map(investorRow);
	rows = sortBy(rows, sp.get('sort') ?? '-deals', {
		deals: (r) => r.deals_count, created_at: (r) => r.created_at, name: (r) => r.name,
	});
	return paginate(rows, url);
}

/** `GET /api/investors/:id/thesis` — app/(dashboard)/investors/[id]/page.tsx `ThesisBundle`. */
export function investorThesis(i: WInvestor) {
	const country = countryByCode(i.country);
	return {
		thesis: { amount_min_usd: String(i.cheque[0]), amount_max_usd: String(i.cheque[1]) },
		round_types: i.stages.map((name) => ({ name })),
		geo: [{ scope_type: 'continent', scope_value: country.continent }, { scope_type: 'country', scope_value: country.name }],
	};
}

// ─── Acquisitions ────────────────────────────────────────────────────────────

/** `MaDeal` (components/features/market/ma-deals.tsx). Targets/acquirers outside the world's companies have no profile. */
export function acquisitionRow(a: WAcquisition) {
	const target = COMPANIES.find((c) => c.name === a.target);
	const buyer = COMPANIES.find((c) => c.name === a.acquirer);
	const buyerInvestor = INVESTORS.find((i) => i.name === a.acquirer);
	const sector = target ? sectorByName(target.sector) : buyer ? sectorByName(buyer.sector) : null;
	const country = countryByCode(target?.country ?? a.acquirerCountry);
	const date = agoDate(a.daysAgo);
	return {
		id: a.id, acquiree_name: a.target, acquiree_slug: target?.slug ?? null, acquiree_website: target?.website ?? null,
		acquiree_website_snapshot: target?.website ?? `${slugify(a.target).replace(/-/g, '')}.example`, acquiree_logo: null,
		acquiree_business_model: target?.model ?? 'b2b', acquiree_company_id: target?.id ?? null,
		acquirer_name: a.acquirer, acquirer_slug: buyer?.slug ?? null, acquirer_company_id: buyer?.id ?? null,
		acquirer_website_snapshot: buyer?.website ?? buyerInvestor?.website ?? null, acquirer_website: buyer?.website ?? buyerInvestor?.website ?? null,
		acquirer_logo: null, acquirer_business_model: buyer?.model ?? null,
		primary_sector: sector?.name ?? null, hq_country: country.name, hq_city: target?.city ?? buyer?.city ?? null,
		acquisition_date: date, acquisition_year: Number(date.slice(0, 4)), acquisition_type: a.type,
		amount_usd: a.price_usd, currency_code: 'USD', source_url: null,
	};
}

/** `GET /api/acquisitions` — filters as ma-deals.tsx, company-ma.tsx, company-drawer.tsx and the roundup send them. */
export function listAcquisitions(url: URL) {
	const sp = url.searchParams;
	const q = sp.get('q')?.trim();
	const from = sp.get('from'); const to = sp.get('to');
	const sectors = sectorFilter(url);
	let rows = ACQUISITIONS.map(acquisitionRow).filter((a) => {
		if (sp.get('acquiree_company_id') && a.acquiree_company_id !== sp.get('acquiree_company_id')) return false;
		if (sp.get('acquirer_company_id') && a.acquirer_company_id !== sp.get('acquirer_company_id')) return false;
		if (q && !has([a.acquiree_name, a.acquirer_name], q)) return false;
		if (sp.get('acquisition_type') && a.acquisition_type !== sp.get('acquisition_type')) return false;
		if (sp.get('year_min') && a.acquisition_year < Number(sp.get('year_min'))) return false;
		if (sp.get('month') && Number(a.acquisition_date.slice(5, 7)) !== Number(sp.get('month'))) return false;
		if (sp.get('amount_usd_min') && (a.amount_usd ?? 0) < Number(sp.get('amount_usd_min'))) return false;
		if (sp.get('amount_usd_max') && (a.amount_usd == null || a.amount_usd > Number(sp.get('amount_usd_max')))) return false;
		if (flag(url, 'disclosed_only') && a.amount_usd == null) return false;
		if (sectors && !(a.primary_sector && sectors.has(slugify(a.primary_sector)))) return false;
		if (sp.get('country') && a.hq_country !== sp.get('country')) return false;
		if (from && a.acquisition_date < from.slice(0, 10)) return false;
		if (to && a.acquisition_date > to.slice(0, 10)) return false;
		return true;
	});
	rows = sortBy(rows, sp.get('sort') ?? '-acquisition_date', {
		acquisition_date: (r) => r.acquisition_date, amount_usd: (r) => r.amount_usd, acquiree_name: (r) => r.acquiree_name,
	});
	return paginate(rows, url);
}

/** `GET /api/acquisitions/:id/sports` — ma-deal-panel.tsx, one row per party. */
export function acquisitionSports(a: WAcquisition) {
	return (['acquiree', 'acquirer'] as const).flatMap((party) => {
		const c = COMPANIES.find((x) => x.name === (party === 'acquiree' ? a.target : a.acquirer));
		return c ? [{ party, name: c.sport, slug: slugify(c.sport) }] : [];
	});
}

// ─── Signals ─────────────────────────────────────────────────────────────────

/**
 * The Signals feed (types/api.ts `Signal`): a `funding` signal per round in the
 * last eight months, and a `fundraising` signal per company marked actively
 * raising. Newest first.
 */
export function allSignals(): Signal[] {
	const signal = (id: string, type: Signal['signal_type'], c: WCompany, headline: string, daysAgo: number): Signal & { daysAgo: number } => ({
		id, signal_type: type, source: 'SportsTechX Wire', headline, body: null, occurred_at: ago(daysAgo),
		company_id: c.id, company_name: c.name, company_slug: c.slug, company_website: c.website, company_custom_logo_url: null,
		sector: sectorByName(c.sector).name, hq_city: c.city, hq_country: countryByCode(c.country).name,
		last_round_type: dealsOf(c)[0]?.round ?? null, daysAgo,
	});
	const funding = DEALS.filter((d) => d.daysAgo <= 240).map((d) => {
		const c = companyByName(d.company);
		return signal(`${d.id}-signal`, 'funding', c, `${c.name} raises ${money(d.amount_usd)} ${d.round}${d.investors[0] ? ` led by ${d.investors[0]}` : ''}`, d.daysAgo);
	});
	const raising = COMPANIES.filter((c) => c.is_actively_raising).map((c, n) =>
		signal(`${c.id}-raising`, 'fundraising', c, `${c.name} is raising its next round`, 2 + n * 3));
	return [...funding, ...raising].sort((a, b) => a.daysAgo - b.daysAgo).map(({ daysAgo: _, ...s }) => s);
}

// ─── Ecosystem: events and programs ──────────────────────────────────────────

const EVENT_CATEGORY: Record<WEvent['format'], string> = { conference: 'Conference', meetup: 'Meetup', pitch: 'Pitch Competition', webinar: 'Webinar' };
const PROGRAM_CATEGORY: Record<WProgram['kind'], string> = { accelerator: 'Accelerator', incubator: 'Incubator', corporate: 'Accelerator' };
const eventStart = (e: WEvent) => agoDate(-e.inDays);
const eventEnd = (e: WEvent) => agoDate(-(e.inDays + e.days - 1));

export function eventRow(e: WEvent) {
	const online = e.format === 'webinar';
	return {
		id: e.id, name: e.name, slug: e.slug, entity_type: 'event', category: EVENT_CATEGORY[e.format], description: e.description,
		website: `${e.slug.replace(/-/g, '')}.example`, hq_country: countryByCode(e.country).name, hq_city: online ? null : e.city,
		start_date: eventStart(e), end_date: eventEnd(e), mode: online ? 'virtual' : 'in_person', cover_url: null,
		founded_year: null, latest_activity_year: Number(eventStart(e).slice(0, 4)),
	};
}

export function programRow(p: WProgram) {
	return {
		id: p.id, name: p.name, slug: p.slug, entity_type: 'program', category: PROGRAM_CATEGORY[p.kind], description: p.description,
		website: `${p.slug.replace(/-/g, '')}.example`, hq_country: countryByCode(p.country).name, hq_city: p.city,
		start_date: null, end_date: null, mode: null, cover_url: null, founded_year: 2018 + (PROGRAMS.indexOf(p) % 5), latest_activity_year: 2026,
	};
}

export const findEvent = (idOrSlug: string) => EVENTS.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
export const findProgram = (idOrSlug: string) => PROGRAMS.find((p) => p.id === idOrSlug || p.slug === idOrSlug);

/** `GET /api/ecosystem-entities` — ecosystem.tsx (programs list, events list + calendar) and the claim search. */
export function listEcosystem(url: URL) {
	const sp = url.searchParams;
	const type = sp.get('entity_type') ?? sp.get('type');
	const q = sp.get('q')?.trim();
	const today = agoDate(0);
	type Row = ReturnType<typeof eventRow> | ReturnType<typeof programRow>;
	let rows: Row[] = [
		...(type !== 'program' ? EVENTS.map(eventRow) : []),
		...(type !== 'event' ? PROGRAMS.map(programRow) : []),
	];
	rows = rows.filter((r) => {
		if (q && !has([r.name, r.description, r.website], q)) return false;
		if (sp.get('category') && r.category !== sp.get('category')) return false;
		if (sp.get('country') && r.hq_country !== sp.get('country')) return false;
		if (sp.get('city') && r.hq_city !== sp.get('city')) return false;
		if (sp.get('mode') && r.mode !== sp.get('mode')) return false;
		if (flag(url, 'entries_open') && r.entity_type === 'program' && (findProgram(r.id)!.deadlineInDays <= 0)) return false;
		if (flag(url, 'upcoming_only') && (!r.start_date || r.start_date < today)) return false;
		if (sp.get('start_month') && (!r.start_date || Number(r.start_date.slice(5, 7)) !== Number(sp.get('start_month')))) return false;
		if (sp.get('start_date_min') && (!r.start_date || r.start_date < sp.get('start_date_min')!)) return false;
		if (sp.get('start_date_max') && (!r.start_date || r.start_date > sp.get('start_date_max')!)) return false;
		return true;
	});
	rows = sortBy(rows, sp.get('sort') ?? 'name', {
		start_date: (r) => r.start_date, created_at: (r) => r.latest_activity_year, name: (r) => r.name,
	});
	return paginate(rows, url, 24);
}

/** `.../event-details` — event-drawer.tsx `EventDetails`. One event carries a member discount, to show the field. */
export function eventDetails(e: WEvent) {
	const r = eventRow(e);
	const discount = e.format === 'conference' && EVENTS.indexOf(e) === 0;
	return {
		mode: r.mode, start_date: r.start_date, end_date: r.end_date, cover_url: null,
		discount_code: discount ? 'ATLAS20' : null, discount_description: discount ? '20% off tickets for Atlas members (sample code).' : null,
	};
}

/** `.../program-details` — program-drawer.tsx `ProgramDetails`. */
export function programDetails(p: WProgram) {
	return {
		duration_label: `${p.weeks} weeks`, interval_label: 'Once a year', investment_label: p.kind === 'incubator' ? 'No investment' : 'Up to $100k',
		equity_label: p.kind === 'incubator' ? 'None' : '6%', stage_label: 'Pre-Seed – Seed', cohort_size: Math.max(6, p.cohort.length * 4),
		virtual_mode: p.kind === 'corporate' ? 'hybrid' : 'no', has_office_space: p.kind !== 'corporate', latest_cohort_year: 2026,
		details: p.description, entries_open: p.deadlineInDays > 0,
	} as const;
}

/** `GET /api/program-participations` — company-programs.tsx (by company) and program-drawer.tsx (by program). */
export function listParticipations(url: URL) {
	const sp = url.searchParams;
	const rows = PROGRAMS.flatMap((p) => p.cohort.map((name, n) => {
		const c = companyByName(name);
		return {
			id: `${p.id}-${c.id}`, program_entity_id: p.id, company_id: c.id, cohort_year: 2026 - (n % 2), cohort_name: `Cohort ${2026 - (n % 2)}`,
			participation_status: 'graduated' as const, program_name: p.name, program_website: `${p.slug.replace(/-/g, '')}.example`,
			startup_name_snapshot: c.name, startup_website_snapshot: c.website,
		};
	})).filter((r) => (!sp.get('company_id') || r.company_id === sp.get('company_id'))
		&& (!sp.get('program_entity_id') || r.program_entity_id === sp.get('program_entity_id')));
	return paginate(rows, url, 50);
}

// ─── Content: reports and newsletter ────────────────────────────────────────

export function reportRow(r: (typeof REPORTS)[number]): ReportListItem {
	return {
		id: r.id, slug: r.slug, title: r.title, short_title: r.short_title, report_month: r.month, report_year: r.year,
		has_pro_version: false, show_on_dashboard: true, has_sections: false, is_published: true, has_pdf: true, can_download: true,
		created_at: new Date(Date.UTC(r.year, r.month - 1, 15)).toISOString(), updated_at: ago(20),
		tags: r.tags, cover_url: r.cover, description: r.description,
	};
}
export const findReport = (idOrSlug: string) => REPORTS.find((r) => r.id === idOrSlug || r.slug === idOrSlug);

/** `GET /api/newsletter/articles` — a bare `NewsletterArticle[]` (types/api.ts). */
export function articles() {
	return ARTICLES.map((a) => ({
		slug: a.slug, title: a.title, link: '#', description: a.description,
		content: `<p>${a.description}</p><p>This is a sample newsletter issue in the Atlas tutorial.</p>`,
		thumbnail: '', pubDate: new Date(Date.now() - a.daysAgo * 864e5).toUTCString(), author: 'SportsTechX', categories: a.categories,
	}));
}
