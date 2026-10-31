/**
 * The Atlas Raise tour: one chapter per page or flow, played as Robin Keller,
 * co-founder of Fanloop (raise-routes.ts builds that workspace; every company
 * and investor comes from fixtures/world.ts).
 *
 * Each `target` is a `data-tour` attribute on the real element (lists mark
 * every item; the first on screen is used). Every step says exactly what to
 * click or type, and only that works. A chapter's first step has a concrete
 * path, so Contents can always jump there.
 *
 * Story beats the steps rely on (see raise-routes.ts SEED):
 *   - Kestrel Field Ventures and Brightpost Ventures are NOT in the watchlist
 *     (the tour adds them); Fieldhouse Capital isn't either (added from the board);
 *   - sample-pipe-7 is Podium Capital, a Target card to drag to Contacted;
 *   - sample-pipe-2 is Sideline Family Office, in due diligence.
 */
import { investorByName } from '../fixtures/world';
import { SAMPLE_DECK_ID } from '../core-routes';
import type { Tour } from '../tour-types';

const KESTREL = investorByName('Kestrel Field Ventures').id;

/** Highlight-only CSS: the investor watchlist menu (portalled to <body>). */
const WATCHLIST_MENU = '.atlas-wl-menu .atlas-menu__item';

export const raiseTour: Tour = {
	product: 'raise',
	intro: {
		title: 'Welcome to Atlas Raise',
		body: 'You’re Robin Keller, co-founder of Fanloop, a Munich start-up building match-day apps for football clubs.',
		points: [
			{ label: 'Round', text: '€1.5m seed, €300k committed' },
			{ label: 'Investors', text: 'Eight already in your watchlist' },
			{ label: 'Data', text: 'All made-up sample data' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home', steps: [
				{ id: 'home-round', path: '/home', target: 'raise-home-round', title: 'Your round at a glance',
					body: 'Days to your target close and how much is committed so far.', advance: { kind: 'next' } },
				{ id: 'home-attention', path: '/home', target: 'raise-home-attention', title: 'What needs you today',
					body: 'Overdue follow-ups, new investor matches and conversations without a next step. Each card links straight to it.', advance: { kind: 'next' } },
				{ id: 'home-ask', path: '/home', target: 'raise-home-composer', only: '[data-tour="raise-home-composer"] .atlas-composer-box', title: 'Ask the co-pilot',
					do: 'Click into the co-pilot bar at the top, then type.', advance: { kind: 'type', value: 'Find seed investors' } },
				{ id: 'home-send', path: '/home', target: 'raise-home-composer', continues: true,
					title: 'Send it', do: 'Press {{Enter}} or click the send arrow.', advance: { kind: 'request', method: 'POST', pattern: '/api/chat' } },
			],
		},
		{
			id: 'chat', title: 'Co-pilot chat', steps: [
				{ id: 'chat-answer', path: '/chat', alsoOn: '/chat/:id', target: 'chat-thread', title: 'Answers from SportsTechX data',
					body: 'It knows your raise, so answers are about Fanloop, not founders in general. Sample data here.', advance: { kind: 'next' } },
				{ id: 'chat-follow-up', path: '/chat/:id', target: 'chat-composer', title: 'Ask a follow-up',
					advance: { kind: 'type', value: 'Draft an intro email' } },
				{ id: 'chat-send', path: '/chat/:id', target: 'chat-composer', continues: true,
					title: 'Send it', do: 'Press {{Enter}} or click the send arrow.', advance: { kind: 'request', method: 'POST', pattern: '/api/chat' }, pause: 1500 },
				{ id: 'chat-history', path: '/chat/:id', target: 'chat-history', title: 'Every conversation, kept',
					body: 'Past chats stay on the right to pick up later. New chat starts a fresh one.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'deck', title: 'Pitch Deck', steps: [
				{ id: 'deck-summary', path: '/deck', allow: ['.atlas-card--glow'], title: 'How investors read your deck',
					body: 'Atlas scores a deck out of 100, gives one verdict and the top three fixes. Fanloop’s seed deck scored 71.', advance: { kind: 'next' } },
				{ id: 'deck-open', path: '/deck', target: 'deck-view-analysis', title: 'Open the full analysis',
					do: 'Click {{View full analysis}}.', advance: { kind: 'path', pattern: `/deck/${SAMPLE_DECK_ID}` } },
				{ id: 'deck-detail', path: `/deck/${SAMPLE_DECK_ID}`, title: 'Area by area',
					body: 'Each area gets a score, the line investors will quote back, and what to fix.',
					points: [
						{ label: 'Scores by topic', text: 'Story, business and traction, numbers and team.' },
						{ label: 'Run it again', text: 'Upload a revised deck and compare the scores.' },
					],
					advance: { kind: 'next' } },
			],
		},
		{
			id: 'investors', title: 'Investors', steps: [
				{ id: 'investors-search', path: '/investors', target: 'filters-search', title: 'Search the investor database',
					body: 'Every sports tech investor Atlas tracks, with filters for sector, stage, country and more.', advance: { kind: 'type', value: 'Brightpost' } },
				{ id: 'investors-add', path: '/investors', target: 'investor-row-save', highlights: ['investor-row'], allow: [WATCHLIST_MENU],
					title: 'Add Brightpost to your watchlist', do: 'Click {{Add to watchlist}}, then pick {{Main watchlist}}.', body: 'Brightpost Ventures backs media companies at seed.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'investors-filters', path: '/investors', target: 'filters-add', title: 'Narrow it down',
					body: 'Add filter narrows by sector, stage, country, firm type or activity. Sort puts the most active first.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'investor-profile', title: 'Investor profile', steps: [
				{ id: 'profile-facts', path: `/investors/${KESTREL}`, target: 'investor-kpis', title: 'Check the fit',
					body: 'Kestrel Field Ventures: the stages they back and where they invest. Recent deals are further down.', advance: { kind: 'next' } },
				{ id: 'profile-add', path: `/investors/${KESTREL}`, target: 'investor-save', allow: [WATCHLIST_MENU],
					title: 'Add Kestrel to your watchlist', do: 'Click {{Add to watchlist}}, then pick {{Main watchlist}}.', body: 'They led Kitroom’s seed and back fan engagement.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'profile-contact', path: `/investors/${KESTREL}`, target: 'investor-record-contact', title: 'Your watchlist record',
					do: 'Click the {{Relevant contact}} field, then type.', body: 'Your Kestrel record now sits on their profile. Note who you’re talking to.',
					advance: { kind: 'type', value: 'Hannah Reed' } },
				{ id: 'profile-save', path: `/investors/${KESTREL}`, target: 'investor-record-save', continues: true,
					title: 'Save it', do: 'Click {{Save changes}}.', advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise/pipeline/:id' }, pause: 900 },
				{ id: 'profile-activity', path: `/investors/${KESTREL}`, target: 'investor-activity', title: 'Every move, logged',
					body: 'Stage moves, amounts and notes build a history, so you know where each conversation stands.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'recommended', title: 'Recommended investors', steps: [
				{ id: 'matches-criteria', path: '/recommended', target: 'matches-criteria', title: 'Matched to your raise',
					body: 'Atlas matches on sector, stage and geography, using your raise settings.', advance: { kind: 'next' } },
				{ id: 'matches-why', path: '/recommended', target: 'investor-card-why', title: 'Why each one fits',
					body: 'Each match explains itself, so you can judge the fit before you reach out.', advance: { kind: 'next' } },
				{ id: 'matches-dismiss', path: '/recommended', target: 'investor-card',
					only: '[data-tour="investor-card"] .atlas-entity-card__actions > button.atlas-action',
					title: 'Not a fit? Hide it', do: 'Click {{Not relevant}} on the first card.', body: 'Atlas leaves it out of your matches from now on.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/recommendations/investors/:id/dismiss' }, pause: 600 },
				{ id: 'matches-undo', path: '/recommended', allow: ['[data-sonner-toast] button'], continues: true,
					title: 'Changed your mind?', body: 'Undo on the message at the top right brings it back. Either way, carry on with Next.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'pipeline', title: 'Investor pipeline', steps: [
				{ id: 'pipeline-board', path: '/pipeline', target: 'pipeline-board', title: 'Your raise as a board',
					body: 'Every investor in your Main watchlist, stage by stage, from Target to Committed.', advance: { kind: 'next' } },
				{ id: 'pipeline-drag', path: '/pipeline', target: 'pipe-card-sample-pipe-7', highlights: ['pipeline-col-contacted'],
					dropOn: '[data-tour="pipeline-col-contacted"]',
					allow: ['[data-tour="pipeline-stage"]', '[role="option"][data-value="contacted"]', '[data-tour="pipeline-save"]'],
					pointerOnly: true,
					title: 'You reached out to Podium Capital', do: 'Drag the Podium Capital card to {{Contacted}}.', body: 'Or open the card, set Stage to Contacted and click Save.',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise/pipeline/:id', body: { stage: 'contacted' } }, pause: 1000 },
				{ id: 'pipeline-open', path: '/pipeline', target: 'pipe-card-sample-pipe-2', title: 'Open a conversation',
					do: 'Click the Sideline Family Office card.', body: 'They’re in due diligence.', advance: { kind: 'click' } },
				{ id: 'pipeline-detail', path: '/pipeline', allow: ['[data-tour="pipeline-fields"]', '[data-tour="pipeline-activity"]', '.atlas button[aria-label="Close"]'], continues: true,
					title: 'Everything about one investor', do: 'Close the panel with the cross when you’re done.', body: 'Contact, potential amount, next step and due date, notes and the full activity history.',
					advance: { kind: 'click', on: '.atlas button[aria-label="Close"]' } },
				{ id: 'pipeline-add', path: '/pipeline', target: 'pipeline-add', title: 'Add an investor',
					do: 'Click {{Add investor}}.', advance: { kind: 'click' } },
				{ id: 'pipeline-add-search', path: '/pipeline', target: 'pipeline-add-search', continues: true,
					title: 'Find them in Atlas', advance: { kind: 'type', value: 'Fieldhouse' } },
				{ id: 'pipeline-add-pick', path: '/pipeline', target: 'pipeline-add-results', continues: true,
					title: 'Add from the database', do: 'Click {{Fieldhouse Capital}}.', body: 'It lands in Target with its full profile.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'pipeline-filter', path: '/pipeline', target: 'pipeline-filters',
					only: '[data-tour="pipeline-filters"] button:nth-child(2)',
					title: 'What’s overdue?', do: 'Click {{Overdue next step}}.', body: 'Shows only the conversations that need a follow-up.', advance: { kind: 'click' }, pause: 1200 },
			],
		},
		{
			id: 'watchlists', title: 'Watchlists', steps: [
				{ id: 'watchlists-list', path: '/watchlists', target: 'watchlists-list', title: 'All your lists in one place',
					body: 'Company lists and named investor lists. Your Main investor watchlist is the Pipeline board.', advance: { kind: 'next' } },
				{ id: 'watchlists-create', path: '/watchlists', target: 'watchlists-create', title: 'Start a new list',
					body: 'Pick Investors or Companies, name the list and create it.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'my-market', title: 'My Market', steps: [
				{ id: 'market-kpis', path: '/my-market', target: 'my-market-kpis', title: 'Size up your market',
					body: 'Total and addressable market, growth and what competitors have raised, built on SportsTechX data.', advance: { kind: 'next' } },
				{ id: 'market-classification', path: '/my-market', target: 'my-market-classification', title: 'Where Fanloop sits',
					body: 'Atlas places Fanloop in its taxonomy; every figure on this page follows from that.', advance: { kind: 'next' } },
				{ id: 'market-competitors-tab', path: '/my-market', target: 'my-market-tabs', only: '[data-tour="my-market-tabs"] .atlas-tab:nth-child(2)',
					title: 'Who else is out there', do: 'Click the {{Competitors}} tab.', advance: { kind: 'click' }, pause: 400 },
				{ id: 'market-competitors', path: '/my-market', target: 'my-market-competitors', continues: true, title: 'Your competitors',
					body: 'Companies in your space and what each has raised. Open any for its full profile.', advance: { kind: 'next' } },
				{ id: 'market-recompute', path: '/my-market', target: 'my-market-recompute', title: 'Changed your positioning?',
					do: 'Click {{Recompute}}.', body: 'It rebuilds the analysis from your latest raise settings.', advance: { kind: 'click' }, pause: 900 },
			],
		},
		{
			id: 'guide', title: 'Fundraising Guide', steps: [
				{ id: 'guide-phases', path: '/resources', target: 'guide-phases', title: 'Prepare, Connect, Close',
					body: 'Guides, templates and checklists for every phase of the raise, by the SportsTechX team.', advance: { kind: 'next' } },
				{ id: 'guide-open', path: '/resources', target: 'guide-pitch-deck-checklist', title: 'Open a checklist',
					do: 'Click {{Pitch deck checklist}}.', advance: { kind: 'path', pattern: '/resources/pitch-deck-checklist' } },
				{ id: 'guide-tick', path: '/resources/pitch-deck-checklist', target: 'guide-checks', highlights: ['guide-progress'],
					title: 'Tick it off', do: 'Tick {{Market size is built bottom-up}}.', body: 'Your progress is saved to your account.',
					advance: { kind: 'request', method: 'PUT', pattern: '/api/raise/resources/:slug/checks' }, pause: 900 },
			],
		},
		{
			id: 'settings', title: 'Raise settings', steps: [
				{ id: 'settings-summary', path: '/settings', target: 'raise-summary', title: 'What Atlas knows about your raise',
					body: 'Your company, your round and the investors you want. Matches, My Market and Home run on this.', advance: { kind: 'next' } },
				{ id: 'settings-edit', path: '/settings', target: 'raise-edit', title: 'Edit your raise',
					do: 'Click {{Edit raise}}.', advance: { kind: 'click' } },
				{ id: 'settings-wizard', path: '/settings', allow: ['.setup-modal__scroll'], continues: true, title: 'The raise setup',
					do: 'Click {{Continue}} through the steps, then {{Save changes}}.', body: 'The same five steps you filled in when you set up your raise.',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise', body: { setup_completed: true } }, pause: 900 },
				{ id: 'settings-circle', path: '/settings', target: 'dealflow-share', highlights: ['dealflow-optin'], title: 'Share your round with investors',
					do: 'Click {{Share my round}}.', body: 'SportsTechX checks your round, then shows it to vetted investors in Atlas Scout.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/dealflow/opt-in' }, pause: 1000 },
			],
		},
		{
			id: 'strategy', title: 'Strategy session', steps: [
				{ id: 'strategy-perks', path: '/strategy', target: 'strategy-perks', title: 'A session with SportsTechX',
					body: 'Each quarter, SportsTechX leadership pressure-tests your deck and investor strategy with you.', advance: { kind: 'next' } },
				{ id: 'strategy-book', path: '/strategy', target: 'strategy-book', highlights: ['strategy-status'], title: 'Book it',
					do: 'Click {{Book your call}}.', body: 'Yours is unlocked. SportsTechX confirms a time by email.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/strategy/book' }, pause: 1000 },
			],
		},
		{
			id: 'programs', title: 'Programs', steps: [
				{ id: 'programs-table', path: '/programs', target: 'programs-table', title: 'Accelerators and programmes',
					body: 'Sports tech accelerators, incubators and corporate programmes, with deadlines and past cohorts.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'companies', title: 'Companies', steps: [
				{ id: 'companies-search', path: '/companies', target: 'filters-search', title: 'Look up any company',
					body: 'Every sports tech company Atlas tracks: competitors, partners, possible customers.', advance: { kind: 'type', value: 'Kitroom' } },
				{ id: 'companies-open', path: '/companies', target: 'companies-results', only: '[data-tour="companies-results"] a[href="/companies/kitroom"]', continues: true, title: 'Open the profile',
					do: 'Click {{Kitroom}}.', advance: { kind: 'path', pattern: '/companies/kitroom' } },
				{ id: 'company-head', path: '/companies/:slug', target: 'company-head', title: 'A company at a glance',
					body: 'Where they are, when they were founded, and whether they’re verified.', advance: { kind: 'next' } },
				{ id: 'company-funding', path: '/companies/:slug', target: 'company-funding', title: 'Every round they raised',
					body: 'Kitroom’s grant, pre-seed and seed, with their investors: handy for seeing who backs your space.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'signals', title: 'Signals', steps: [
				{ id: 'signals-filters', path: '/signals', target: 'signals-filters', title: 'Who is raising right now',
					body: 'Companies that just raised or are raising. Filter by type, sector, country or your watchlists.', advance: { kind: 'next' } },
				{ id: 'signals-list', path: '/signals', target: 'signals-list', title: 'Read the market',
					body: 'Rounds in your space show which investors are active this month.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'analysis', title: 'Market analysis', steps: [
				{ id: 'analysis-kpis', path: '/analytics', target: 'analysis-kpis', title: 'The whole market in numbers',
					body: 'Funding, deal counts and M&A across sports tech.', advance: { kind: 'next' } },
				{ id: 'analysis-series', path: '/analytics', target: 'analysis-series', only: '[data-tour="analysis-series"], [data-tour="analysis-range"]', title: 'Funding or M&A',
					body: 'Switch between the two, and change the period with the range beside it.', advance: { kind: 'next' } },
				{ id: 'analysis-sectors', path: '/analytics', target: 'analysis-sectors', title: 'Where the money goes',
					body: 'Which sectors attract the most capital: useful context for your market slide.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'roundup', title: 'Monthly Roundup', steps: [
				{ id: 'roundup-pickers', path: '/roundup', target: 'roundup-pickers', only: '[data-tour="roundup-pickers"]', title: 'One month at a time',
					body: 'Pick a month to see every round and acquisition, summed up.', advance: { kind: 'next' } },
				{ id: 'roundup-kpis', path: '/roundup', target: 'roundup-kpis', title: 'The month in numbers',
					body: 'Capital raised, average deal size and deal count, with sector and country breakdowns below.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'recently-funded', title: 'Recently Funded', steps: [
				{ id: 'funded-list', path: '/recently-funded', target: 'funded-list', title: 'The latest rounds',
					body: 'Every new sports tech round, newest first, with its investors: who’s writing cheques right now.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'ma', title: 'M&A', steps: [
				{ id: 'ma-table', path: '/ma', target: 'ma-table', title: 'Who is buying whom',
					body: 'Sports tech acquisitions with buyer, price where disclosed and date: evidence for your exit slide.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'more', title: 'Framework, reports, events and newsletter', steps: [
				{ id: 'more-framework', path: '/framework', target: 'framework-grid', title: 'The sports tech framework',
					body: 'How SportsTechX maps the industry: three pillars, each split into categories of companies.', advance: { kind: 'next' } },
				{ id: 'more-reports', path: '/reports', target: 'resources-grid', title: 'Reports',
					body: 'SportsTechX research on funding, sectors and markets. Read online or download the PDF.', advance: { kind: 'next' } },
				{ id: 'more-events', path: '/events', target: 'events-table', title: 'Events',
					body: 'Conferences, meetups and pitch nights: a good place to meet investors from your watchlist.', advance: { kind: 'next' } },
				{ id: 'more-newsletter', path: '/newsletter', target: 'resources-grid', title: 'Newsletter',
					body: 'The SportsTechX briefing on funding and deals. The latest edition is on top.', cta: 'Finish the tour', advance: { kind: 'next' } },
			],
		},
	],
	finale: {
		title: 'That’s Atlas Raise',
		body: 'You’ve seen your round, deck, investors, pipeline and market at work.\n\nNow do it for real, with your own company and live investor data.',
	},
};
