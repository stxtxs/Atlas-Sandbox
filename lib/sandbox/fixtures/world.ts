/**
 * The tutorial's one made-up world. Every company, investor, round, acquisition,
 * event, program, report and article any tier shows comes from here, so the
 * three tours tell the same story: the same Kitroom raises the same seed from
 * the same Kestrel Field Ventures on every page that mentions it.
 *
 * Nothing here is real. Names were picked to be plausible and not to collide
 * with real sports tech companies; if one ever does, rename it here.
 *
 * Ids are UUID-shaped (some UI checks for a UUID to tell an id from a slug).
 * Route handlers (core-routes.ts, explore/raise/scout-routes.ts) expand these
 * into each endpoint's full response shape.
 */

const uuid = (kind: number, n: number) => `${kind.toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;
const DAY = 864e5;
/** ISO timestamp n days from now (negative = past). */
export const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
/** YYYY-MM-DD, n days ago. */
export const agoDate = (days: number) => ago(days).slice(0, 10);
export const slugify = (s: string) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ─── Taxonomy ────────────────────────────────────────────────────────────────

export interface WSector { id: string; name: string; slug: string; parent_id: string | null }
const sector = (n: number, name: string, parent: number | null = null, slug = slugify(name)): WSector =>
	({ id: uuid(0x5ec, n), name, slug, parent_id: parent === null ? null : uuid(0x5ec, parent) });

/**
 * The SportsTechX framework: pillar → category → sub-category. Pillar and
 * category slugs are the keys the Framework page's copy is written against
 * (components/features/framework/framework-content.ts); the sub-categories are
 * the sample world's own and are what companies are filed under.
 */
export const SECTORS: WSector[] = [
	sector(100, 'Activity & Performance', null, 'activity_performance'),
	sector(101, 'For Activity: Hardware', 100, 'activity_performance__for_activity_hardware'),
	sector(102, 'For Activity: Software', 100, 'activity_performance__for_activity_software'),
	sector(103, 'Before & After Activity', 100, 'activity_performance__before_after_activity'),
	sector(11, 'Wearables', 101),
	sector(12, 'Tracking & Analytics', 102), sector(14, 'Video Analysis', 102),
	sector(13, 'Recovery & Injury Prevention', 103), sector(31, 'Health & Fitness', 103), sector(32, 'Booking & Community', 103),
	sector(200, 'Fans & Content', null, 'fans_content'),
	sector(201, 'Content Platforms', 200, 'fans_content__content_platforms'),
	sector(202, 'Fan Experiences', 200, 'fans_content__fan_experiences'),
	sector(203, 'Fantasy Sports & Betting', 200, 'fans_content__fantasy_sports_betting'),
	sector(3, 'Media & Broadcasting', 201), sector(41, 'Competitive Gaming', 201),
	sector(2, 'Fan Engagement', 202), sector(5, 'Loyalty & Rewards', 202), sector(6, 'Second Screen', 202), sector(23, 'Ticketing', 202),
	sector(4, 'Betting & Fantasy', 203),
	sector(300, 'Management & Organisation', null, 'management_organisation'),
	sector(301, 'Organisations & Venues', 300, 'management_organisation__organisations_venues'),
	sector(302, 'Media & Sponsors', 300, 'management_organisation__media_sponsors'),
	sector(21, 'Club & League Management', 301), sector(22, 'Venue & Facility Management', 301),
	sector(24, 'Sponsorship & Advertising', 302),
];
export const sectorByName = (name: string) => SECTORS.find((s) => s.name === name)!;
/** The sector a sub-sector or niche rolls up to. */
export const topSector = (s: WSector): WSector => (s.parent_id ? topSector(SECTORS.find((p) => p.id === s.parent_id)!) : s);

export interface WNamed { id: string; name: string; slug: string }
const named = (kind: number) => (n: number, name: string): WNamed => ({ id: uuid(kind, n), name, slug: slugify(name) });
const sport = named(0x5b0);
export const SPORTS: WNamed[] = [
	sport(1, 'Football / Soccer'), sport(2, 'Basketball'), sport(3, 'Tennis'), sport(4, 'Padel'), sport(5, 'Running'),
	sport(6, 'Cycling'), sport(7, 'Swimming'), sport(8, 'Rugby'), sport(9, 'Climbing'), sport(10, 'Skiing'), sport(11, 'Multi-sport'),
];
const round = named(0x40d);
export const ROUND_TYPES: WNamed[] = [
	// Atlas's own round-type names (the Scout thesis chips and claim forms match on them).
	round(1, 'Pre Seed Round'), round(2, 'Seed Round'), round(3, 'Series A'), round(4, 'Series B'), round(5, 'Series C'), round(6, 'Grant'),
];
const tag = named(0x7a6);
export const TECH_TAGS: WNamed[] = [
	tag(1, 'AI / Machine Learning'), tag(2, 'Computer Vision'), tag(3, 'Wearable Sensors'), tag(4, 'SaaS'), tag(5, 'Marketplace'), tag(6, 'Mobile App'),
];
/** Short labels ('Seed', 'Pre-Seed') used in DEALS resolve to the full names. */
export const roundByName = (name: string) => ROUND_TYPES.find((r) => r.name === name || r.name === `${name.replace('-', ' ')} Round`)!;

export interface WCountry { code: string; name: string; region: string; continent: string }
export const COUNTRIES: WCountry[] = [
	{ code: 'DE', name: 'Germany', region: 'Western Europe', continent: 'Europe' },
	{ code: 'GB', name: 'United Kingdom', region: 'Northern Europe', continent: 'Europe' },
	{ code: 'ES', name: 'Spain', region: 'Southern Europe', continent: 'Europe' },
	{ code: 'NL', name: 'Netherlands', region: 'Western Europe', continent: 'Europe' },
	{ code: 'FR', name: 'France', region: 'Western Europe', continent: 'Europe' },
	{ code: 'IT', name: 'Italy', region: 'Southern Europe', continent: 'Europe' },
	{ code: 'PT', name: 'Portugal', region: 'Southern Europe', continent: 'Europe' },
	{ code: 'IE', name: 'Ireland', region: 'Northern Europe', continent: 'Europe' },
	{ code: 'SE', name: 'Sweden', region: 'Northern Europe', continent: 'Europe' },
	{ code: 'DK', name: 'Denmark', region: 'Northern Europe', continent: 'Europe' },
	{ code: 'CH', name: 'Switzerland', region: 'Western Europe', continent: 'Europe' },
	{ code: 'AT', name: 'Austria', region: 'Western Europe', continent: 'Europe' },
	{ code: 'US', name: 'United States', region: 'Northern America', continent: 'North America' },
];
export const countryByCode = (code: string) => COUNTRIES.find((c) => c.code === code)!;

// ─── Companies ───────────────────────────────────────────────────────────────

export type WBusinessModel = 'b2b' | 'b2c' | 'b2b2c' | 'd2c';
export interface WCompany {
	id: string; name: string; slug: string; website: string;
	/** Niche or sub-sector name from SECTORS. */
	sector: string;
	sport: string; country: string; city: string;
	founded: number; model: WBusinessModel; description: string;
	tags: string[];
	is_verified?: boolean; is_actively_raising?: boolean;
	/** Set for the two that were acquired (see ACQUISITIONS). */
	status?: 'active' | 'acquired';
	accelerator?: string;
}
const company = (n: number, name: string, c: Omit<WCompany, 'id' | 'name' | 'slug' | 'website'>): WCompany =>
	({ id: uuid(0xc0, n), name, slug: slugify(name), website: `${slugify(name).replace(/-/g, '')}.example`, ...c });

/**
 * Kitroom is Explore's "type this" search company and Scout's lead match;
 * Fanloop is the Raise visitor's own company; Matchday Loop is the verified,
 * actively raising deal that shows up across all three tiers.
 */
export const COMPANIES: WCompany[] = [
	company(1, 'Kitroom', { sector: 'Loyalty & Rewards', sport: 'Football / Soccer', country: 'DE', city: 'Berlin', founded: 2021, model: 'b2b2c', tags: ['Mobile App', 'SaaS'], is_verified: true, is_actively_raising: true,
		description: 'Kitroom turns match attendance into a loyalty programme: fans collect points for every game, clubs learn who their most loyal supporters are and reward them directly.' }),
	company(2, 'Fanloop', { sector: 'Second Screen', sport: 'Football / Soccer', country: 'DE', city: 'Munich', founded: 2022, model: 'b2b', tags: ['SaaS', 'AI / Machine Learning'], is_actively_raising: true,
		description: 'Fanloop gives clubs a live second-screen app for match days: polls, predictions and sponsor moments that keep season-ticket holders engaged and renewing.' }),
	company(3, 'Matchday Loop', { sector: 'Fan Engagement', sport: 'Football / Soccer', country: 'GB', city: 'Manchester', founded: 2020, model: 'b2b', tags: ['SaaS', 'Mobile App'], is_verified: true, is_actively_raising: true,
		description: 'Matchday Loop runs the digital match-day for lower-league clubs: ticketing reminders, in-stadium offers and post-match highlights in one white-label app.' }),
	company(4, 'Courtline', { sector: 'Venue & Facility Management', sport: 'Padel', country: 'ES', city: 'Madrid', founded: 2021, model: 'b2b', tags: ['SaaS', 'Marketplace'], is_actively_raising: true,
		description: 'Courtline is the operating system for padel clubs: court booking, coaching schedules, memberships and payments, now running more than 300 clubs in Spain.' }),
	company(5, 'Stridewise', { sector: 'Wearables', sport: 'Running', country: 'NL', city: 'Amsterdam', founded: 2019, model: 'd2c', tags: ['Wearable Sensors', 'AI / Machine Learning'], is_actively_raising: true,
		description: 'Stridewise makes an insole sensor that coaches running form in real time and warns runners before overload turns into injury.' }),
	company(6, 'Kickframe Analytics', { sector: 'Video Analysis', sport: 'Football / Soccer', country: 'GB', city: 'London', founded: 2018, model: 'b2b', tags: ['Computer Vision', 'AI / Machine Learning'], is_verified: true,
		description: 'Kickframe Analytics tags match video automatically, so academies and semi-pro clubs get pro-level performance analysis without an analyst team.' }),
	company(7, 'Velodata', { sector: 'Tracking & Analytics', sport: 'Cycling', country: 'ES', city: 'Girona', founded: 2020, model: 'b2c', tags: ['Wearable Sensors', 'Mobile App'],
		description: 'Velodata combines power-meter and GPS data into training plans for amateur cyclists, built with coaches from the pro peloton.' }),
	company(8, 'Replaykit', { sector: 'Media & Broadcasting', sport: 'Multi-sport', country: 'FR', city: 'Paris', founded: 2019, model: 'b2b', tags: ['Computer Vision', 'SaaS'],
		description: 'Replaykit films grassroots games with a single fixed camera and cuts automatic highlights for clubs to share and sell.' }),
	company(9, 'Huddle Health', { sector: 'Health & Fitness', sport: 'Multi-sport', country: 'IE', city: 'Dublin', founded: 2021, model: 'b2c', tags: ['Mobile App'],
		description: 'Huddle Health runs small-group fitness programmes for former athletes, coached remotely and tracked through one app.' }),
	company(10, 'Arenaflow', { sector: 'Venue & Facility Management', sport: 'Multi-sport', country: 'SE', city: 'Stockholm', founded: 2017, model: 'b2b', tags: ['AI / Machine Learning', 'SaaS'], is_verified: true,
		description: 'Arenaflow predicts crowd flow in stadiums and arenas, cutting queue times at gates and concessions on event days.' }),
	company(11, 'Oddsmith', { sector: 'Betting & Fantasy', sport: 'Football / Soccer', country: 'PT', city: 'Lisbon', founded: 2020, model: 'b2c', tags: ['AI / Machine Learning', 'Mobile App'],
		description: 'Oddsmith is a free-to-play prediction game for football fans, with leagues among friends and prizes from club partners.' }),
	company(12, 'Scrumcap Labs', { sector: 'Recovery & Injury Prevention', sport: 'Rugby', country: 'GB', city: 'Edinburgh', founded: 2019, model: 'b2b', tags: ['Wearable Sensors'], status: 'acquired',
		description: 'Scrumcap Labs built impact sensors for rugby headgear that flag possible concussions to the medical team in real time.' }),
	company(13, 'Laneline', { sector: 'Tracking & Analytics', sport: 'Swimming', country: 'DK', city: 'Copenhagen', founded: 2022, model: 'd2c', tags: ['Wearable Sensors', 'Mobile App'],
		description: 'Laneline is a pair of swim goggles with a heads-up display for pace, splits and stroke count.' }),
	company(14, 'Gripstat', { sector: 'Booking & Community', sport: 'Climbing', country: 'CH', city: 'Zurich', founded: 2021, model: 'b2b2c', tags: ['Mobile App', 'Marketplace'],
		description: 'Gripstat connects climbing gyms and their members: route logging, competitions and day passes in one community app.' }),
	company(15, 'Tifo Studio', { sector: 'Fan Engagement', sport: 'Basketball', country: 'IT', city: 'Milan', founded: 2022, model: 'b2b', tags: ['SaaS'],
		description: 'Tifo Studio produces interactive in-arena shows for basketball clubs, synced to fans’ phones and the big screen.' }),
	company(16, 'Benchside', { sector: 'Club & League Management', sport: 'Basketball', country: 'US', city: 'Austin', founded: 2018, model: 'b2b', tags: ['SaaS'], status: 'acquired',
		description: 'Benchside ran registrations, schedules and payments for youth basketball leagues across Texas.' }),
	company(17, 'Racketlab', { sector: 'Tracking & Analytics', sport: 'Tennis', country: 'ES', city: 'Barcelona', founded: 2020, model: 'b2c', tags: ['Wearable Sensors', 'AI / Machine Learning'], accelerator: 'Baseline Accelerator',
		description: 'Racketlab clips onto any racket and turns every stroke into data, with drills that adapt to how a player actually hits.' }),
	company(18, 'Snowpath', { sector: 'Booking & Community', sport: 'Skiing', country: 'AT', city: 'Innsbruck', founded: 2019, model: 'b2c', tags: ['Mobile App', 'Marketplace'],
		description: 'Snowpath sells lift passes, lessons and rentals across small Alpine resorts in one booking app.' }),
	company(19, 'Coachboard', { sector: 'Club & League Management', sport: 'Football / Soccer', country: 'GB', city: 'Leeds', founded: 2021, model: 'b2b', tags: ['SaaS'], accelerator: 'Clubhouse Lab',
		description: 'Coachboard plans training sessions for grassroots coaches and shares them with players and parents in one tap.' }),
	company(20, 'Strikezone Media', { sector: 'Media & Broadcasting', sport: 'Multi-sport', country: 'US', city: 'New York', founded: 2017, model: 'b2c', tags: ['AI / Machine Learning'], is_verified: true,
		description: 'Strikezone Media publishes data-driven sports stories and short-form video for a Gen Z audience.' }),
	company(21, 'Pacekeeper', { sector: 'Health & Fitness', sport: 'Running', country: 'US', city: 'Boston', founded: 2020, model: 'd2c', tags: ['AI / Machine Learning', 'Mobile App'],
		description: 'Pacekeeper is an AI running coach that rewrites the week’s plan around sleep, stress and missed sessions.' }),
	company(22, 'Goalsight', { sector: 'Video Analysis', sport: 'Football / Soccer', country: 'PT', city: 'Porto', founded: 2021, model: 'b2b', tags: ['Computer Vision'], accelerator: 'Baseline Accelerator', is_actively_raising: true,
		description: 'Goalsight scouts young players from match video, ranking them on the actions that predict a professional career.' }),
	company(23, 'Clubvault', { sector: 'Ticketing', sport: 'Rugby', country: 'FR', city: 'Lyon', founded: 2019, model: 'b2b', tags: ['SaaS', 'Marketplace'],
		description: 'Clubvault runs season tickets and resale for mid-size rugby and football clubs, with fraud checks built in.' }),
	company(24, 'Respawn Arena', { sector: 'Competitive Gaming', sport: 'Multi-sport', country: 'SE', city: 'Malmö', founded: 2020, model: 'b2c', tags: ['Marketplace'],
		description: 'Respawn Arena hosts amateur eSports tournaments for football and racing games, with club-branded leagues.' }),
	company(25, 'Shirtfront Metrics', { sector: 'Sponsorship & Advertising', sport: 'Football / Soccer', country: 'NL', city: 'Rotterdam', founded: 2021, model: 'b2b', tags: ['Computer Vision', 'SaaS'],
		description: 'Shirtfront Metrics measures the exposure sponsors get from broadcasts and social clips, so clubs can price sponsorship on evidence.' }),
];
export const companyBy = (idOrSlug: string) => COMPANIES.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
export const companyByName = (name: string) => COMPANIES.find((c) => c.name === name)!;

// ─── Investors ───────────────────────────────────────────────────────────────

export type WInvestorCategory = 'venture_capital' | 'private_equity' | 'family_investment_office' | 'angel';
export interface WInvestor {
	id: string; name: string; slug: string; website: string;
	category: WInvestorCategory; country: string; city: string; launched: number;
	/** Cheque range in USD. */
	cheque: [number, number];
	stages: string[]; focus: string[]; description: string;
	aum_usd?: number; is_verified?: boolean;
}
const investor = (n: number, name: string, i: Omit<WInvestor, 'id' | 'name' | 'slug' | 'website'>): WInvestor =>
	({ id: uuid(0x1a, n), name, slug: slugify(name), website: `${slugify(name).replace(/-/g, '')}.example`, ...i });

export const INVESTORS: WInvestor[] = [
	investor(1, 'Kestrel Field Ventures', { category: 'venture_capital', country: 'GB', city: 'London', launched: 2016, cheque: [500_000, 2_000_000], stages: ['Seed', 'Series A'], focus: ['Fan Engagement', 'Media & Broadcasting'], aum_usd: 180_000_000, is_verified: true,
		description: 'Seed and Series A fund backing fan engagement and media companies across Europe. Usually leads, with a partner on the board.' }),
	investor(2, 'Tidepool Sport', { category: 'venture_capital', country: 'NL', city: 'Amsterdam', launched: 2018, cheque: [250_000, 1_500_000], stages: ['Pre-Seed', 'Seed'], focus: ['Wearables', 'Health & Fitness'], aum_usd: 75_000_000, is_verified: true,
		description: 'Early-stage fund for performance and health tech, with a lab programme that tests products with partner clubs.' }),
	investor(3, 'Northline Capital', { category: 'venture_capital', country: 'DE', city: 'Berlin', launched: 2014, cheque: [2_000_000, 10_000_000], stages: ['Series A', 'Series B'], focus: ['Club & League Management', 'Venue & Facility Management'], aum_usd: 420_000_000,
		description: 'Growth-stage investor in B2B software for clubs, leagues and venues. Follows on through Series B.' }),
	investor(4, 'Halfway Line Partners', { category: 'venture_capital', country: 'ES', city: 'Madrid', launched: 2019, cheque: [300_000, 1_500_000], stages: ['Seed', 'Series A'], focus: ['Venue & Facility Management', 'Booking & Community'], aum_usd: 60_000_000,
		description: 'Iberian seed fund for sports software and marketplaces, close to the padel and football ecosystems.' }),
	investor(5, 'Extra Time Angels', { category: 'angel', country: 'IE', city: 'Dublin', launched: 2020, cheque: [50_000, 300_000], stages: ['Pre-Seed', 'Seed'], focus: ['Fan Engagement', 'Health & Fitness'],
		description: 'Network of former athletes and sports executives writing first cheques into sports tech founders.' }),
	investor(6, 'Brightpost Ventures', { category: 'venture_capital', country: 'FR', city: 'Paris', launched: 2015, cheque: [1_000_000, 5_000_000], stages: ['Seed', 'Series A'], focus: ['Media & Broadcasting', 'Competitive Gaming'], aum_usd: 210_000_000,
		description: 'Media and entertainment fund investing in sports content, streaming and gaming.' }),
	investor(7, 'Grandstand Growth', { category: 'private_equity', country: 'US', city: 'New York', launched: 2011, cheque: [10_000_000, 50_000_000], stages: ['Series B', 'Series C'], focus: ['Media & Broadcasting', 'Ticketing'], aum_usd: 1_400_000_000,
		description: 'Growth equity investor in scaled sports and live-entertainment businesses; active acquirer through its portfolio.' }),
	investor(8, 'Sideline Family Office', { category: 'family_investment_office', country: 'CH', city: 'Zurich', launched: 2012, cheque: [500_000, 3_000_000], stages: ['Seed', 'Series A', 'Series B'], focus: ['Booking & Community', 'Health & Fitness'],
		description: 'Single-family office with a long-term sports and leisure portfolio, often co-investing alongside VCs.' }),
	investor(9, 'Fieldhouse Capital', { category: 'venture_capital', country: 'SE', city: 'Stockholm', launched: 2017, cheque: [1_000_000, 6_000_000], stages: ['Series A', 'Series B'], focus: ['Tracking & Analytics', 'Venue & Facility Management'], aum_usd: 150_000_000, is_verified: true,
		description: 'Nordic fund for data-driven sports businesses, from performance analytics to smart venues.' }),
	investor(10, 'Stoppage Time Capital', { category: 'venture_capital', country: 'US', city: 'Boston', launched: 2016, cheque: [500_000, 4_000_000], stages: ['Seed', 'Series A'], focus: ['Health & Fitness', 'Wearables'], aum_usd: 95_000_000,
		description: 'Consumer health and fitness fund with a focus on connected devices and coaching apps.' }),
	investor(11, 'Corner Flag Ventures', { category: 'venture_capital', country: 'IT', city: 'Milan', launched: 2021, cheque: [200_000, 1_000_000], stages: ['Pre-Seed', 'Seed'], focus: ['Fan Engagement', 'Club & League Management'], aum_usd: 40_000_000,
		description: 'Pre-seed and seed fund built by club executives, investing in tools clubs actually buy.' }),
	investor(12, 'Podium Capital', { category: 'venture_capital', country: 'DE', city: 'Munich', launched: 2013, cheque: [3_000_000, 15_000_000], stages: ['Series A', 'Series B'], focus: ['Tracking & Analytics', 'Wearables'], aum_usd: 320_000_000,
		description: 'Deep-tech fund backing sensor and computer-vision companies in sport, often alongside corporate partners.' }),
];
export const investorBy = (idOrSlug: string) => INVESTORS.find((i) => i.id === idOrSlug || i.slug === idOrSlug);
export const investorByName = (name: string) => INVESTORS.find((i) => i.name === name)!;

// ─── Funding rounds ──────────────────────────────────────────────────────────

export interface WDeal {
	id: string; company: string; round: string;
	/** USD; null = undisclosed. */
	amount_usd: number | null;
	/** Days before today it was announced. */
	daysAgo: number;
	/** Investor names, lead first. */
	investors: string[];
}
let dealN = 0;
const deal = (company: string, round: string, amount_usd: number | null, daysAgo: number, investors: string[]): WDeal =>
	({ id: uuid(0xd1, ++dealN), company, round, amount_usd, daysAgo, investors });

export const DEALS: WDeal[] = [
	deal('Kitroom', 'Pre-Seed', 400_000, 620, ['Extra Time Angels']),
	deal('Kitroom', 'Seed', 2_000_000, 160, ['Kestrel Field Ventures', 'Corner Flag Ventures']),
	deal('Fanloop', 'Pre-Seed', 350_000, 410, ['Extra Time Angels', 'Corner Flag Ventures']),
	deal('Matchday Loop', 'Seed', 1_800_000, 700, ['Kestrel Field Ventures']),
	deal('Matchday Loop', 'Series A', 5_100_000, 45, ['Brightpost Ventures', 'Kestrel Field Ventures']),
	deal('Courtline', 'Seed', 1_800_000, 300, ['Halfway Line Partners', 'Sideline Family Office']),
	deal('Stridewise', 'Seed', 1_200_000, 820, ['Tidepool Sport']),
	deal('Stridewise', 'Series A', 3_200_000, 95, ['Stoppage Time Capital', 'Tidepool Sport']),
	deal('Kickframe Analytics', 'Series A', 6_500_000, 540, ['Fieldhouse Capital']),
	deal('Kickframe Analytics', 'Series B', 14_000_000, 30, ['Podium Capital', 'Fieldhouse Capital']),
	deal('Velodata', 'Seed', 900_000, 380, ['Halfway Line Partners']),
	deal('Replaykit', 'Series A', 4_000_000, 260, ['Brightpost Ventures']),
	deal('Huddle Health', 'Seed', 1_100_000, 200, ['Stoppage Time Capital', 'Extra Time Angels']),
	deal('Arenaflow', 'Series A', 7_000_000, 900, ['Northline Capital']),
	deal('Arenaflow', 'Series B', 18_000_000, 120, ['Northline Capital', 'Fieldhouse Capital']),
	deal('Oddsmith', 'Seed', 1_500_000, 330, ['Brightpost Ventures']),
	deal('Scrumcap Labs', 'Seed', 1_000_000, 1100, ['Tidepool Sport']),
	deal('Laneline', 'Pre-Seed', 600_000, 140, ['Tidepool Sport']),
	deal('Gripstat', 'Seed', 1_300_000, 75, ['Sideline Family Office', 'Halfway Line Partners']),
	deal('Tifo Studio', 'Pre-Seed', 300_000, 60, ['Corner Flag Ventures']),
	deal('Benchside', 'Series A', 5_500_000, 1300, ['Grandstand Growth']),
	deal('Racketlab', 'Seed', 1_600_000, 230, ['Halfway Line Partners', 'Stoppage Time Capital']),
	deal('Snowpath', 'Seed', null, 450, ['Sideline Family Office']),
	deal('Coachboard', 'Pre-Seed', 250_000, 20, ['Corner Flag Ventures']),
	deal('Strikezone Media', 'Series B', 22_000_000, 280, ['Grandstand Growth', 'Brightpost Ventures']),
	deal('Pacekeeper', 'Series A', 4_500_000, 110, ['Stoppage Time Capital']),
	deal('Goalsight', 'Seed', 1_400_000, 170, ['Fieldhouse Capital', 'Corner Flag Ventures']),
	deal('Clubvault', 'Series A', 3_800_000, 360, ['Northline Capital']),
	deal('Respawn Arena', 'Seed', 1_000_000, 90, ['Brightpost Ventures']),
	deal('Courtline', 'Grant', 150_000, 12, []),
	deal('Shirtfront Metrics', 'Seed', 1_200_000, 210, ['Brightpost Ventures']),
	// Follow-ons and bridges, so every recent month of the Monthly Roundup has a few rounds.
	deal('Velodata', 'Seed', 600_000, 8, ['Halfway Line Partners']),
	deal('Laneline', 'Seed', 1_100_000, 26, ['Fieldhouse Capital', 'Tidepool Sport']),
	deal('Huddle Health', 'Seed', 500_000, 40, ['Extra Time Angels']),
	deal('Replaykit', 'Series B', 9_000_000, 55, ['Brightpost Ventures', 'Podium Capital']),
	deal('Gripstat', 'Grant', 80_000, 66, []),
	deal('Snowpath', 'Series A', 2_500_000, 100, ['Sideline Family Office', 'Halfway Line Partners']),
	deal('Oddsmith', 'Series A', 3_000_000, 125, ['Brightpost Ventures']),
	deal('Clubvault', 'Grant', 200_000, 150, []),
	deal('Snowpath', 'Seed', 800_000, 185, ['Sideline Family Office']),
	deal('Respawn Arena', 'Pre-Seed', 250_000, 200, ['Extra Time Angels']),
	deal('Goalsight', 'Pre-Seed', 300_000, 215, ['Corner Flag Ventures']),
	deal('Coachboard', 'Grant', 50_000, 240, []),
	deal('Pacekeeper', 'Seed', 1_500_000, 270, ['Stoppage Time Capital']),
	deal('Racketlab', 'Pre-Seed', 400_000, 300, ['Halfway Line Partners']),
	deal('Kitroom', 'Grant', 100_000, 320, []),
	deal('Arenaflow', 'Grant', 250_000, 335, []),
	deal('Velodata', 'Grant', 150_000, 350, []),
	deal('Shirtfront Metrics', 'Pre-Seed', 300_000, 360, ['Brightpost Ventures']),
];

// ─── Acquisitions ────────────────────────────────────────────────────────────

export interface WAcquisition {
	id: string; target: string; acquirer: string;
	/** USD; null = undisclosed. */
	price_usd: number | null;
	daysAgo: number; type: 'acquisition' | 'merger' | 'asset_purchase';
	/** Whether the acquirer is a company in this world (else a corporate outside it). */
	acquirerCountry: string;
}
let acqN = 0;
const acquisition = (target: string, acquirer: string, price_usd: number | null, daysAgo: number, type: WAcquisition['type'], acquirerCountry: string): WAcquisition =>
	({ id: uuid(0xac, ++acqN), target, acquirer, price_usd, daysAgo, type, acquirerCountry });

export const ACQUISITIONS: WAcquisition[] = [
	acquisition('Scrumcap Labs', 'Kickframe Analytics', 8_000_000, 150, 'acquisition', 'GB'),
	acquisition('Benchside', 'Grandstand Growth', 40_000_000, 400, 'acquisition', 'US'),
	acquisition('Huddle Fit (product line)', 'Huddle Health', null, 520, 'asset_purchase', 'IE'),
	acquisition('Linesman AI', 'Arenaflow', 12_000_000, 85, 'acquisition', 'SE'),
	acquisition('Ticketnest', 'Clubvault', 3_500_000, 260, 'merger', 'FR'),
	acquisition('Stadium Stories', 'Strikezone Media', 6_000_000, 35, 'acquisition', 'US'),
	acquisition('Pitchside Clips', 'Replaykit', 2_500_000, 15, 'acquisition', 'FR'),
	acquisition('Rinkside Data', 'Kickframe Analytics', null, 110, 'acquisition', 'GB'),
	acquisition('Padelpoint', 'Courtline', 1_800_000, 200, 'acquisition', 'ES'),
	acquisition('Fanpass Loyalty', 'Kitroom', null, 290, 'acquisition', 'DE'),
];

// ─── Ecosystem: events and programs ──────────────────────────────────────────

export interface WEvent {
	id: string; name: string; slug: string; city: string; country: string;
	/** Days from today it starts (negative = past). */
	inDays: number; days: number; format: 'conference' | 'meetup' | 'pitch' | 'webinar';
	description: string;
}
const event = (n: number, name: string, e: Omit<WEvent, 'id' | 'name' | 'slug'>): WEvent => ({ id: uuid(0xe7, n), name, slug: slugify(name), ...e });
export const EVENTS: WEvent[] = [
	event(1, 'Matchpoint Sports Tech Summit', { city: 'Berlin', country: 'DE', inDays: 18, days: 2, format: 'conference',
		description: 'Two days of talks and investor meetings on fan engagement, performance and club tech.' }),
	event(2, 'Padel Business Forum', { city: 'Madrid', country: 'ES', inDays: 32, days: 1, format: 'conference',
		description: 'Club owners, federations and start-ups on the business of the fastest-growing racket sport.' }),
	event(3, 'Founders on the Touchline', { city: 'London', country: 'GB', inDays: 9, days: 1, format: 'meetup',
		description: 'An evening meetup for sports tech founders raising in the next twelve months.' }),
	event(4, 'Sports Tech Pitch Night', { city: 'Amsterdam', country: 'NL', inDays: 46, days: 1, format: 'pitch',
		description: 'Ten seed-stage start-ups pitch to a panel of sports investors.' }),
	event(5, 'Fan Data Deep Dive', { city: 'Online', country: 'DE', inDays: 4, days: 1, format: 'webinar',
		description: 'How clubs turn ticketing and app data into renewals — with three case studies.' }),
	event(6, 'Alpine Outdoor Innovation Days', { city: 'Innsbruck', country: 'AT', inDays: 70, days: 3, format: 'conference',
		description: 'Winter and outdoor sports innovation, from snow safety to resort booking.' }),
	event(7, 'Club Tech Roundtable', { city: 'Milan', country: 'IT', inDays: -14, days: 1, format: 'meetup',
		description: 'Club executives compare notes on the tools they bought this season.' }),
	event(8, 'Performance Analytics Expo', { city: 'Stockholm', country: 'SE', inDays: 58, days: 2, format: 'conference',
		description: 'Tracking, video and wearables for elite and academy sport.' }),
];

export interface WProgram {
	id: string; name: string; slug: string; city: string; country: string;
	kind: 'accelerator' | 'incubator' | 'corporate';
	/** Days until applications close (negative = closed). */
	deadlineInDays: number; weeks: number; description: string;
	/** Company names in the latest cohort. */
	cohort: string[];
}
const program = (n: number, name: string, p: Omit<WProgram, 'id' | 'name' | 'slug'>): WProgram => ({ id: uuid(0x94, n), name, slug: slugify(name), ...p });
export const PROGRAMS: WProgram[] = [
	program(1, 'Baseline Accelerator', { city: 'Barcelona', country: 'ES', kind: 'accelerator', deadlineInDays: 21, weeks: 12, cohort: ['Racketlab', 'Goalsight'],
		description: 'Twelve weeks for performance and racket-sport start-ups, ending in a demo day with Iberian investors.' }),
	program(2, 'Clubhouse Lab', { city: 'Leeds', country: 'GB', kind: 'corporate', deadlineInDays: 40, weeks: 10, cohort: ['Coachboard'],
		description: 'A club-run programme that pilots grassroots and academy tools with real teams.' }),
	program(3, 'Northern Lights Sport Incubator', { city: 'Copenhagen', country: 'DK', kind: 'incubator', deadlineInDays: 65, weeks: 24, cohort: ['Laneline'],
		description: 'Six months of desk space, mentoring and lab access for Nordic sports hardware teams.' }),
	program(4, 'Fan Futures Programme', { city: 'Berlin', country: 'DE', kind: 'accelerator', deadlineInDays: -10, weeks: 8, cohort: ['Kitroom', 'Fanloop'],
		description: 'Eight weeks with league partners for fan engagement start-ups, closed for this year’s intake.' }),
	program(5, 'Summit Ventures Studio', { city: 'Innsbruck', country: 'AT', kind: 'incubator', deadlineInDays: 90, weeks: 16, cohort: ['Snowpath'],
		description: 'A venture studio for outdoor and winter sports, co-building with resort partners.' }),
];

// ─── Content: reports and newsletter ────────────────────────────────────────

export interface WReport { id: string; slug: string; title: string; short_title: string; month: number; year: number; tags: string[]; description: string; cover: string }
const report = (n: number, slug: string, r: Omit<WReport, 'id' | 'slug'>): WReport => ({ id: uuid(0x4e, n), slug, ...r });
/** Covers are local SVGs in public/sample/ — no remote images. */
export const REPORTS: WReport[] = [
	report(1, 'sports-tech-ecosystem-2026', { title: 'Sports Tech Ecosystem Report 2026', short_title: 'Ecosystem 2026', month: 9, year: 2026, tags: ['Ecosystem', 'Funding'], cover: '/sample/report-ecosystem.svg',
		description: 'The year in sports tech: where the money went, which sectors grew and the companies that defined 2026 (sample report).' }),
	report(2, 'fan-engagement-deep-dive-2026', { title: 'Fan Engagement Deep Dive 2026', short_title: 'Fan Engagement', month: 6, year: 2026, tags: ['Fan Engagement'], cover: '/sample/report-fans.svg',
		description: 'How clubs and leagues use apps, loyalty and data to keep fans coming back (sample report).' }),
	report(3, 'investor-sourcing-benchmark-2026', { title: 'Sports Tech Investor Sourcing Benchmark 2026', short_title: 'Investor Benchmark', month: 10, year: 2026, tags: ['Investors'], cover: '/sample/report-investors.svg',
		description: 'How sports tech investors find, screen and close deals, from a survey of thirty funds (sample report).' }),
	report(4, 'performance-tech-outlook-2025', { title: 'Performance Tech Outlook 2025', short_title: 'Performance 2025', month: 11, year: 2025, tags: ['Performance', 'Wearables'], cover: '/sample/report-performance.svg',
		description: 'Wearables, tracking and video analysis: the state of performance tech and what comes next (sample report).' }),
];

export interface WArticle { slug: string; title: string; description: string; daysAgo: number; categories: string[] }
export const ARTICLES: WArticle[] = [
	{ slug: 'the-week-padel-went-pro', title: 'The week padel went pro', daysAgo: 3, categories: ['Funding', 'Padel'],
		description: 'Courtline’s grant, two new club chains and why investors are suddenly paying attention to padel software.' },
	{ slug: 'kickframe-raises-14m', title: 'Kickframe Analytics raises $14M to bring video analysis to academies', daysAgo: 10, categories: ['Funding', 'Performance'],
		description: 'Podium Capital leads the Series B; the plan is 2,000 academy clubs by 2028.' },
	{ slug: 'loyalty-is-the-new-ticket', title: 'Loyalty is the new ticket', daysAgo: 17, categories: ['Fan Engagement'],
		description: 'Kitroom, Matchday Loop and the clubs rewarding attendance instead of just selling it.' },
	{ slug: 'm-and-a-roundup-q3', title: 'M&A round-up: a busy quarter for performance tech', daysAgo: 24, categories: ['M&A'],
		description: 'Arenaflow buys Linesman AI, Kickframe picks up Scrumcap Labs — and what it says about consolidation.' },
	{ slug: 'what-seed-investors-want-2026', title: 'What seed investors want to see in 2026', daysAgo: 38, categories: ['Investors'],
		description: 'Five sports tech investors on traction, team and the slides they skip.' },
	{ slug: 'wearables-beyond-the-wrist', title: 'Wearables beyond the wrist', daysAgo: 52, categories: ['Wearables'],
		description: 'Insoles, goggles and headgear: where sports sensors are going next.' },
];
