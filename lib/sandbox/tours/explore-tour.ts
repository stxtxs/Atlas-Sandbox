import type { Tour } from '../tour-types';

/*
 * Atlas Explore — the free tier — one chapter per page. Every step says exactly
 * what to click or type; the data is the made-up world in fixtures/world.ts
 * (Kitroom, Pitchmark Analytics, the Matchpoint summit…).
 *
 * Anchors are `data-tour` attributes on the real components; shared ones:
 * filters-search / filters-add / filters-sort (FilterBar), resources-* (Reports
 * and Newsletter), company-* (company profile).
 */

const scoped = (anchor: string, sel: string) => `[data-tour="${anchor}"] ${sel}`;

export const exploreTour: Tour = {
	product: 'explore',
	intro: {
		title: 'Welcome to Atlas Explore',
		body: 'Explore is the free way into the sports tech market. In this tour you will search companies, save a watchlist, read the research and check the numbers — one page at a time.',
		points: [
			{ label: 'How it works', text: 'This panel tells you what to do next. Only the highlighted part of the page responds.' },
			{ label: 'Sample data', text: 'Every company, round and event here is made up, so nothing you do is real.' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home', steps: [
				{ id: 'home-ask', path: '/home', target: 'home-ask', title: 'Ask anything', body: 'Your home starts with the Atlas assistant. Ask it about companies, funding or events — you will try it in the Chat chapter.', advance: { kind: 'next' } },
				{ id: 'home-feed', path: '/home', target: 'home-feed', title: 'What needs your attention', body: 'The latest newsletter, the newest report, last month’s roundup and a pick based on your interests. Each card takes you straight there.', advance: { kind: 'next' } },
				{ id: 'home-interests', path: '/home', target: 'home-interests', title: 'Tune it to you', body: 'Right now your view is the whole market. Click {{Interests}} to tell Atlas what you follow.', advance: { kind: 'path', pattern: '/interests' } },
			],
		},
		{
			id: 'interests', title: 'Interests', steps: [
				{ id: 'interests-sector', path: '/interests', target: 'interests-sectors', only: scoped('interests-sectors', '.explore-chip:first-child'), title: 'Pick a sector', body: 'Click the first sector in the list.', advance: { kind: 'click' } },
				{ id: 'interests-sub', path: '/interests', target: 'interests-subs', only: scoped('interests-subs', '.explore-chip:first-child'), title: 'Narrow it down', body: 'Its sub-sectors appear underneath. Click the first one.', advance: { kind: 'click' } },
				{ id: 'interests-sport', path: '/interests', target: 'interests-sports', only: scoped('interests-sports', '.explore-chip:first-child'), title: 'Add a sport', body: 'Click the first sport.', advance: { kind: 'click' } },
				{ id: 'interests-geo', path: '/interests', target: 'interests-geos', only: scoped('interests-geos', '[data-value="Europe"]'), title: 'Where you look', body: 'Click {{Europe}}.', advance: { kind: 'click' } },
				{ id: 'interests-goal', path: '/interests', target: 'interests-goals', only: scoped('interests-goals', '[data-value="Track companies"]'), title: 'What you are here for', body: 'Click {{Track companies}}.', advance: { kind: 'click' } },
				{ id: 'interests-save', path: '/interests', target: 'interests-save', only: scoped('interests-save', 'button:first-child'), title: 'Save your interests', body: 'Click {{Save interests}}. Interests shape your home page — they never hide anything from you.', advance: { kind: 'request', method: 'PUT', pattern: '/api/explore/interests' } },
				{ id: 'interests-result', path: '/home', target: 'home-feed', title: 'Home, personalised', body: 'Back on Home, the “For you” card now points at companies in the sector you picked.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'chat', title: 'Ask the assistant', steps: [
				{ id: 'chat-suggestions', path: '/chat', target: 'chat-suggestions', title: 'The Atlas assistant', body: 'Ask questions in plain English and get answers from Atlas data. Suggestions get you started; you can also type your own.', advance: { kind: 'next' } },
				{ id: 'chat-type', path: '/chat', target: 'chat-composer', title: 'Ask a question', body: 'Click the box at the bottom and type the question below.', advance: { kind: 'type', value: 'Who is funding fan engagement?' } },
				{ id: 'chat-send', path: '/chat', target: 'chat-composer', only: `${scoped('chat-composer', '.atlas-composer-send')}, ${scoped('chat-composer', 'textarea')}`, title: 'Send it', body: 'Press {{Enter}} or click the send arrow.', advance: { kind: 'request', method: 'POST', pattern: '/api/chat' } },
				{ id: 'chat-answer', path: '/chat/:id', target: 'chat-thread', title: 'Your answer', body: 'The assistant answers with figures and names you can follow up on. In the real Atlas it reads the live database.', advance: { kind: 'next' } },
				{ id: 'chat-history', path: '/chat/:id', target: 'chat-history', title: 'Your conversations', body: 'Every chat is kept here. {{New chat}} starts a fresh one.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'companies', title: 'Companies', steps: [
				{ id: 'companies-list', path: '/companies', target: 'companies-results', title: 'The company database', body: 'Every sports tech company Atlas tracks, with sector, location, sport, model and funding.', advance: { kind: 'next' } },
				{ id: 'companies-filter-open', path: '/companies', target: 'filters-add', only: '[data-tour="filters-add"] > .atlas-btn', title: 'Add a filter', body: 'Click {{Add filter}}.', advance: { kind: 'click' } },
				{ id: 'companies-filter-raising', path: '/companies', target: 'filters-add', only: scoped('filters-add', '[data-key="raising"]'), continues: true, title: 'Only companies raising now', body: 'Click {{Raising now}}. Filters stack — sector, sport, country, funding and more.', advance: { kind: 'click' } },
				{ id: 'companies-sort-open', path: '/companies', target: 'filters-sort', only: '[data-tour="filters-sort"] > .atlas-btn', title: 'Sort the list', body: 'Click {{Sort by}}.', advance: { kind: 'click' } },
				{ id: 'companies-sort-funded', path: '/companies', target: 'filters-sort', only: scoped('filters-sort', '[data-value="-total_funding"]'), continues: true, title: 'Biggest first', body: 'Click {{Most funded}}.', advance: { kind: 'click' } },
				{ id: 'companies-view', path: '/companies', target: 'companies-view', only: scoped('companies-view', 'button[title="Card view"]'), title: 'Switch the view', body: 'Click the grid icon to see companies as cards with their descriptions.', advance: { kind: 'click' } },
				{ id: 'companies-export-open', path: '/companies', target: 'companies-export', only: '[data-tour="companies-export"] > button', title: 'Export the list', body: 'Click {{Export}}.', advance: { kind: 'click' } },
				{ id: 'companies-export-columns', path: '/companies', target: 'companies-export', only: '.export-modal', allow: ['.export-modal'], continues: true, title: 'Pick the columns', body: 'Click {{Select all}} at the top right of the column list.', advance: { kind: 'click', on: '.export-modal__all' } },
				{ id: 'companies-export-download', path: '/companies', target: 'companies-export', only: '.export-modal', allow: ['.export-modal'], continues: true, title: 'Download', body: 'Click {{Download}}. You get a small sample CSV — a real export holds every matching company.', advance: { kind: 'request', method: 'POST', pattern: '/api/exports/:entity' } },
				{ id: 'companies-search', path: '/companies', target: 'filters-search', title: 'Search by name', body: 'Click the search box and type the company name below.', advance: { kind: 'type', value: 'Kitroom' } },
				{ id: 'companies-open', path: '/companies', target: 'companies-results', only: scoped('companies-results', 'a[href="/companies/kitroom"]'), title: 'Open the profile', body: 'Click {{Kitroom}}.', advance: { kind: 'path', pattern: '/companies/kitroom' } },
			],
		},
		{
			id: 'company', title: 'Company profile', steps: [
				{ id: 'company-head', path: '/companies/kitroom', target: 'company-head', title: 'Kitroom at a glance', body: 'The check mark means Kitroom’s team verified this profile; the badge says it is raising right now.', advance: { kind: 'next' } },
				{ id: 'company-facts', path: '/companies/kitroom', target: 'company-facts', title: 'Key facts', body: 'Founded, sports, technology, headquarters, model, category, stage and total raised — in one card.', advance: { kind: 'next' } },
				{ id: 'company-funding', path: '/companies/kitroom', target: 'company-funding', title: 'Funding history', body: 'Every disclosed round with its date, size and investors. Investor names link to their profiles.', advance: { kind: 'next' } },
				{ id: 'company-save-open', path: '/companies/kitroom', target: 'company-save', only: scoped('company-save', '.atlas-action--save'), title: 'Save it to a watchlist', body: 'Click {{Add to watchlist}}.', advance: { kind: 'click' } },
				{ id: 'company-save-new', path: '/companies/kitroom', target: 'company-save', only: scoped('company-save', '.atlas-switcher__foot .atlas-menu__item'), continues: true, title: 'Start a new list', body: 'Click {{New watchlist}}.', advance: { kind: 'click' } },
				{ id: 'company-save-name', path: '/companies/kitroom', target: 'company-save', only: scoped('company-save', '.atlas-wl-new input'), continues: true, title: 'Name it', body: 'Click the name box and type the name below.', advance: { kind: 'type', value: 'Fan engagement watch' } },
				{ id: 'company-save-create', path: '/companies/kitroom', target: 'company-save', only: scoped('company-save', '.atlas-wl-create'), continues: true, title: 'Create and save', body: 'Click {{Create}}. Kitroom goes into your new list.', advance: { kind: 'request', method: 'POST', pattern: '/api/user-watchlists/:id/companies/:companyId' } },
				{ id: 'company-rail', path: '/companies/kitroom', target: 'company-signals', highlights: ['company-related'], title: 'Signals and related companies', body: 'Recent news about Kitroom on the right, and companies like it underneath — a quick way to map a niche.', advance: { kind: 'next' } },
				{ id: 'company-ma', path: '/companies/pitchmark-analytics', target: 'company-ma', title: 'M&A activity', body: 'Companies that buy or get bought show it here. Pitchmark Analytics acquired Scrumcap Labs — in Atlas, clicking a row opens the full deal.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'watchlists', title: 'Watchlists', steps: [
				{ id: 'watchlists-intro', path: '/watchlists', target: 'watchlists-list', title: 'Your watchlists', body: 'Lists of companies you follow, with how many each holds. Open, rename or delete them from here.', advance: { kind: 'next' } },
				{ id: 'watchlists-name', path: '/watchlists', target: 'watchlists-create', title: 'Make another one', body: 'Click the name box and type the name below.', advance: { kind: 'type', value: 'Padel picks' } },
				{ id: 'watchlists-create', path: '/watchlists', target: 'watchlists-create', only: scoped('watchlists-create', 'button[type="submit"]'), title: 'Create it', body: 'Click {{New watchlist}}.', advance: { kind: 'request', method: 'POST', pattern: '/api/user-watchlists' } },
				{ id: 'watchlists-open', path: '/watchlists', target: 'watchlists-list', only: scoped('watchlists-list', 'a.atlas-wl-title'), title: 'Open a list', body: 'Click any list name to open it.', advance: { kind: 'path', pattern: '/watchlists/:id' } },
				{ id: 'watchlist-detail', path: '/watchlists/:id', target: 'watchlist-head', title: 'Inside a list', body: 'The companies you saved, as a table or cards. Remove one with the cross; add more from any company page.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'framework', title: 'Framework', steps: [
				{ id: 'framework-grid', path: '/framework', target: 'framework-grid', title: 'How the market is organised', body: 'The SportsTechX framework sorts sports tech by who it serves — athletes, fans and executives — then by category.', advance: { kind: 'next' } },
				{ id: 'framework-open', path: '/framework', target: 'framework-grid', only: scoped('framework-grid', '.atlas-fw-block__title a'), title: 'Open a category', body: 'Click any category name.', advance: { kind: 'path', pattern: '/framework/:slug' } },
				{ id: 'framework-detail', path: '/framework/:slug', target: 'framework-detail', title: 'Inside a category', body: 'Its sub-categories, the technologies it covers and typical use cases. The arrows step through the categories.', advance: { kind: 'next' } },
				{ id: 'framework-companies', path: '/framework/:slug', target: 'framework-companies', title: 'Who leads it', body: 'The best-funded companies in this category.', advance: { kind: 'next' } },
				{ id: 'framework-explore', path: '/framework/:slug', target: 'framework-explore', title: 'See them all', body: 'Click the button to open every company in this category.', advance: { kind: 'path', pattern: '/companies' } },
			],
		},
		{
			id: 'reports', title: 'Reports', steps: [
				{ id: 'reports-featured', path: '/reports', target: 'resources-featured', title: 'The latest research', body: 'SportsTechX reports on funding, sectors and regions. The newest one sits on top.', advance: { kind: 'next' } },
				{ id: 'reports-view', path: '/reports', target: 'resources-featured', only: scoped('resources-featured', '.atlas-post__actions .atlas-action:first-child'), title: 'Read a report', body: 'Click {{View report}}.', advance: { kind: 'click', simulate: true } },
				{ id: 'reports-view-done', path: '/reports', title: 'Interactive reports', body: 'In Atlas the report opens in a new tab: charts, company lists and sections you can jump between.', confirm: { title: 'The report would open here', body: 'This sample report isn’t real, so the tutorial stops short of opening it.' }, cta: 'Got it', advance: { kind: 'next' } },
				{ id: 'reports-search', path: '/reports', target: 'filters-search', title: 'Search the library', body: 'Click the search box and type the word below.', advance: { kind: 'type', value: 'Performance' } },
				{ id: 'reports-download', path: '/reports', target: 'resources-grid', only: scoped('resources-grid', '.atlas-post:first-child .atlas-action:last-child'), title: 'Take it with you', body: 'Click {{Download report}} for the PDF.', advance: { kind: 'click', simulate: true } },
				{ id: 'reports-download-done', path: '/reports', title: 'PDF download', body: 'Every report comes as a PDF too — handy for sharing with your team.', confirm: { title: 'Your PDF would download now', body: 'In Atlas this saves the full report to your computer.' }, cta: 'Next', advance: { kind: 'next' } },
			],
		},
		{
			id: 'newsletter', title: 'Newsletter', steps: [
				{ id: 'newsletter-latest', path: '/newsletter', target: 'resources-featured', title: 'The SportsTechX briefing', body: 'Funding, deals and the stories that matter, every two weeks. The latest edition is on top.', advance: { kind: 'next' } },
				{ id: 'newsletter-search', path: '/newsletter', target: 'filters-search', title: 'Find an edition', body: 'Click the search box and type the word below.', advance: { kind: 'type', value: 'Wearables' } },
				{ id: 'newsletter-open', path: '/newsletter', target: 'resources-grid', only: scoped('resources-grid', '.atlas-post:first-child .atlas-action'), title: 'Open it', body: 'Click {{View edition}}.', advance: { kind: 'click', simulate: true } },
				{ id: 'newsletter-open-done', path: '/newsletter', title: 'Read the edition', body: 'Editions open on the newsletter’s own site, so you can share them.', confirm: { title: 'The edition would open in a new tab', body: 'This one is sample content, so it stays here.' }, cta: 'Next', advance: { kind: 'next' } },
			],
		},
		{
			id: 'analysis', title: 'Analysis', steps: [
				{ id: 'analysis-kpis', path: '/analytics', target: 'analysis-kpis', title: 'The market in numbers', body: 'Total funding, the latest year, rounds recorded and the years covered.', advance: { kind: 'next' } },
				{ id: 'analysis-ma', path: '/analytics', target: 'analysis-series', only: scoped('analysis-series', '[data-key="ma"]'), title: 'Switch to M&A', body: 'Click {{M&A}}. Every chart on the page follows.', advance: { kind: 'click' } },
				{ id: 'analysis-range', path: '/analytics', target: 'analysis-range', only: scoped('analysis-range', '[data-key="5y"]'), title: 'Change the period', body: 'Click {{5 yrs}}.', advance: { kind: 'click' } },
				{ id: 'analysis-funding', path: '/analytics', target: 'analysis-series', only: scoped('analysis-series', '[data-key="funding"]'), title: 'Back to funding', body: 'Click {{Funding}}.', advance: { kind: 'click' } },
				{ id: 'analysis-drill', path: '/analytics', target: 'analysis-sectors', only: scoped('analysis-sectors', '.hb-row.has-children'), title: 'Drill into a sector', body: 'Click any sector bar to see its sub-sectors.', advance: { kind: 'click' } },
				{ id: 'analysis-top', path: '/analytics', target: 'analysis-top', title: 'Who raised the most', body: 'The best-funded companies for the period — each one links to its profile.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'roundup', title: 'Monthly Roundup', steps: [
				{ id: 'roundup-pickers', path: '/roundup', target: 'roundup-pickers', only: '[data-tour="roundup-pickers"]', title: 'One month at a glance', body: 'The roundup sums up a month of funding and M&A. Pick any month and year here.', advance: { kind: 'next' } },
				{ id: 'roundup-kpis', path: '/roundup', target: 'roundup-kpis', title: 'The headline numbers', body: 'Capital raised, average deal size and deal count — with the change on the month before.', advance: { kind: 'next' } },
				{ id: 'roundup-count', path: '/roundup', target: 'roundup-metric', only: scoped('roundup-metric', '[data-key="count"]'), title: 'Count instead of amount', body: 'Click {{Count}}. The breakdowns now count deals instead of dollars.', advance: { kind: 'click' } },
				{ id: 'roundup-donuts', path: '/roundup', target: 'roundup-donuts', title: 'The breakdown', body: 'By sector, business model and country.', advance: { kind: 'next' } },
				{ id: 'roundup-ma', path: '/roundup', target: 'roundup-mode', only: scoped('roundup-mode', '[data-key="ma"]'), title: 'Switch to M&A', body: 'Click {{M&A}}. Atlas jumps to the latest month with acquisitions and sums those up instead.', advance: { kind: 'click' } },
				{ id: 'roundup-table', path: '/roundup', target: 'roundup-table', title: 'Every deal of the month', body: 'Sorted by value, each company linked to its profile.', advance: { kind: 'next' } },
				{ id: 'roundup-archive', path: '/roundup', target: 'roundup-archive', only: scoped('roundup-archive', '.mkt-archive-row:nth-child(2) button'), title: 'Go back a month', body: 'Click {{View}} next to the previous month.', advance: { kind: 'click' } },
			],
		},
		{
			id: 'events', title: 'Events', steps: [
				{ id: 'events-search', path: '/events', target: 'filters-search', title: 'Find an event', body: 'Click the search box and type the name below.', advance: { kind: 'type', value: 'Matchpoint' } },
				{ id: 'events-open', path: '/events', target: 'events-table', only: scoped('events-table', 'tbody tr td:nth-child(2)'), title: 'Open it', body: 'Click the event’s name.', advance: { kind: 'click' } },
				{ id: 'events-drawer', path: '/events', allow: ['.co-drawer'], title: 'Event details', body: 'Dates, place, format and what it is about. Close it with the cross at the top.', advance: { kind: 'click', on: '.co-drawer-head .icon-btn' } },
				{ id: 'events-calendar', path: '/events', target: 'events-view', only: scoped('events-view', 'button[title="Calendar"]'), title: 'See the calendar', body: 'Click the calendar icon.', advance: { kind: 'click' } },
				{ id: 'events-grid', path: '/events', target: 'events-calendar', title: 'Plan your season', body: 'The same events on their dates, month by month. Your search still applies, so only the matching events show.', advance: { kind: 'next' } },
				{ id: 'events-next-month', path: '/events', target: 'events-calendar-nav', only: scoped('events-calendar-nav', '[aria-label="Next month"]'), title: 'Look ahead', body: 'Click the right arrow to move to next month.', advance: { kind: 'click' } },
			],
		},
		{
			id: 'programs', title: 'Programs', steps: [
				{ id: 'programs-filter-open', path: '/programs', target: 'filters-add', only: '[data-tour="filters-add"] > .atlas-btn', title: 'Accelerators and incubators', body: 'Programs that take sports tech start-ups. Click {{Add filter}}.', advance: { kind: 'click' } },
				{ id: 'programs-filter-open-entries', path: '/programs', target: 'filters-add', only: scoped('filters-add', '[data-key="entriesOpen"]'), continues: true, title: 'Only open calls', body: 'Click {{Entries open}}.', advance: { kind: 'click' } },
				{ id: 'programs-open', path: '/programs', target: 'programs-table', only: scoped('programs-table', '.atlas-table__row .atlas-table__name'), title: 'Open a program', body: 'Click any program’s name.', advance: { kind: 'click' } },
				{ id: 'programs-portfolio', path: '/programs', allow: ['.co-drawer'], title: 'Who took part', body: 'Click the {{Portfolio}} tab to see the start-ups in its cohorts.', advance: { kind: 'click', on: '.co-drawer-tab:nth-child(2)' } },
				{ id: 'programs-close', path: '/programs', allow: ['.co-drawer'], title: 'Close it', body: 'Click the cross at the top.', advance: { kind: 'click', on: '.co-drawer-head .icon-btn' } },
			],
		},
		{
			id: 'more', title: 'Raise and Scout', steps: [
				{ id: 'more', path: '/home', title: 'There is more in Atlas', body: 'Explore is the free base. Two plans build on it.', points: [
					{ label: 'Atlas Raise — for founders', text: 'Pitch-deck analysis, investor matches and a fundraising pipeline.' },
					{ label: 'Atlas Scout — for investors', text: 'Deals matched to your thesis, the investor deal flow and a deck screener.' },
				], cta: 'Finish', advance: { kind: 'next' } },
			],
		},
	],
	finale: {
		title: 'That’s Atlas Explore',
		body: 'You searched the market, saved a watchlist, read the research and checked the numbers.\n\nCreate a free account to do it on live data, replay this tour, or try the Raise and Scout tours.',
	},
};
