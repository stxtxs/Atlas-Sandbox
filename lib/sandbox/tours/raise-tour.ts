/**
 * The Atlas Raise tour: one chapter per page or flow, played as Alex Morgan,
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
		body: 'You’re Alex Morgan, co-founder of Fanloop, a Munich start-up that builds match-day apps for football clubs. Your seed round is already set up, so you can see Raise at work straight away:',
		points: [
			{ label: 'Round', text: '€1.5m seed, €300k committed' },
			{ label: 'Investors', text: 'Eight already in your watchlist' },
			{ label: 'Data', text: 'Everything you see is made-up sample data' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home', steps: [
				{ id: 'home-round', path: '/home', target: 'raise-home-round', title: 'Your round at a glance',
					body: 'Home opens on your round: days to your target close and how much is committed so far.', advance: { kind: 'next' } },
				{ id: 'home-attention', path: '/home', target: 'raise-home-attention', title: 'What needs you today',
					body: 'Atlas sorts what needs your attention: overdue follow-ups, new investor matches, the next thing to set up. Each card links straight to it.', advance: { kind: 'next' } },
				{ id: 'home-ask', path: '/home', target: 'raise-home-composer', title: 'Ask the co-pilot',
					body: 'The bar at the top is the Atlas co-pilot. Click into it and type the question below.', advance: { kind: 'type', value: 'Find seed investors' } },
				{ id: 'home-send', path: '/home', target: 'raise-home-composer', continues: true,
					title: 'Send it', body: 'Press {{Enter}} or click the send arrow.', advance: { kind: 'path', pattern: '/chat' } },
			],
		},
		{
			id: 'chat', title: 'Co-pilot chat', steps: [
				{ id: 'chat-answer', path: '/chat', target: 'chat-thread', title: 'Answers from SportsTechX data',
					body: 'The co-pilot answers from Atlas data (sample data here) and knows your raise, so its answers are about Fanloop, not founders in general.', advance: { kind: 'next' } },
				{ id: 'chat-follow-up', path: '/chat', target: 'chat-composer', title: 'Ask a follow-up',
					body: 'Keep the conversation going. Type the follow-up below.', advance: { kind: 'type', value: 'Draft an intro email' } },
				{ id: 'chat-send', path: '/chat', target: 'chat-composer', continues: true,
					title: 'Send it', body: 'Press {{Enter}} or click the send arrow.', advance: { kind: 'request', method: 'POST', pattern: '/api/chat' }, pause: 1500 },
				{ id: 'chat-history', path: '/chat', target: 'chat-history', title: 'Every conversation, kept',
					body: 'Past conversations stay on the right, so you can pick one up later. New chat starts a fresh one.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'deck', title: 'Pitch Deck', steps: [
				{ id: 'deck-summary', path: '/deck', allow: ['.atlas-card--glow'], title: 'How investors will read your deck',
					body: 'Upload a deck and Atlas scores it out of 100, sums it up in one verdict and lists the three fixes that matter most. Fanloop’s seed deck scored 71.', advance: { kind: 'next' } },
				{ id: 'deck-open', path: '/deck', target: 'deck-view-analysis', title: 'Open the full analysis',
					body: 'Click View full analysis.', advance: { kind: 'path', pattern: `/deck/${SAMPLE_DECK_ID}` } },
				{ id: 'deck-detail', path: `/deck/${SAMPLE_DECK_ID}`, title: 'Area by area',
					body: 'Every part of the deck gets a score, the line investors will quote back to you, and what to fix.',
					points: [
						{ label: 'Scores by topic', text: 'Story, business and traction, numbers and team.' },
						{ label: 'Area-by-area detail', text: 'Open any area for what works and what’s missing.' },
						{ label: 'Run it again', text: 'Upload a revised deck and compare the scores.' },
					],
					advance: { kind: 'next' } },
			],
		},
		{
			id: 'investors', title: 'Investors', steps: [
				{ id: 'investors-search', path: '/investors', target: 'filters-search', title: 'Search the investor database',
					body: 'Every sports tech investor Atlas tracks, with filters for sector, stage, country, firm type and more. Type Brightpost into the search box.', advance: { kind: 'type', value: 'Brightpost' } },
				{ id: 'investors-add', path: '/investors', target: 'investor-row-save', highlights: ['investor-row'], allow: [WATCHLIST_MENU],
					title: 'Add them to your watchlist', body: 'Brightpost Ventures backs media companies at seed. Click Add to watchlist, then choose Main watchlist.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'investors-filters', path: '/investors', target: 'filters-add', title: 'Narrow it down',
					body: 'Add filter narrows the list by sector, stage, country, cheque or how active an investor is. Sort puts the most active first.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'investor-profile', title: 'Investor profile', steps: [
				{ id: 'profile-facts', path: `/investors/${KESTREL}`, target: 'investor-kpis', title: 'Check the fit',
					body: 'Kestrel Field Ventures: the stages they back, their typical cheque and where they invest, with their recent deals below.', advance: { kind: 'next' } },
				{ id: 'profile-add', path: `/investors/${KESTREL}`, target: 'investor-save', allow: [WATCHLIST_MENU],
					title: 'Add Kestrel to your watchlist', body: 'They led Kitroom’s seed and back fan engagement. Click Add to watchlist, then choose Main watchlist.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'profile-contact', path: `/investors/${KESTREL}`, target: 'investor-record-contact', title: 'Your watchlist record',
					body: 'Your record for Kestrel now sits on their profile. Note who you’re talking to: type the contact below into Relevant contact.',
					advance: { kind: 'type', value: 'Hannah Reed' } },
				{ id: 'profile-save', path: `/investors/${KESTREL}`, target: 'investor-record-save', continues: true,
					title: 'Save it', body: 'Click Save changes.', advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise/pipeline/:id' }, pause: 900 },
				{ id: 'profile-activity', path: `/investors/${KESTREL}`, target: 'investor-activity', title: 'Every move, logged',
					body: 'Stage moves, amounts and notes build up into a history, so you always know where each conversation stands.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'recommended', title: 'Recommended investors', steps: [
				{ id: 'matches-criteria', path: '/recommended', target: 'matches-criteria', title: 'Matched to your raise',
					body: 'Atlas matches investors to Fanloop on sector, stage and geography, using the criteria from your raise settings.', advance: { kind: 'next' } },
				{ id: 'matches-why', path: '/recommended', target: 'investor-card-why', title: 'Why each one fits',
					body: 'Every match says why Atlas recommends it, so you can judge the fit before you reach out.', advance: { kind: 'next' } },
				{ id: 'matches-dismiss', path: '/recommended', target: 'investor-card',
					only: '[data-tour="investor-card"] .atlas-entity-card__actions > button.atlas-action',
					title: 'Not a fit? Hide it', body: 'Click Not relevant on the first card. Atlas leaves it out of your matches from now on.',
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
					title: 'You reached out to Podium Capital', body: 'Drag the Podium Capital card to Contacted. (Or open it, set Stage to Contacted and click Save.)',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise/pipeline/:id', body: { stage: 'contacted' } }, pause: 1000 },
				{ id: 'pipeline-open', path: '/pipeline', target: 'pipe-card-sample-pipe-2', title: 'Open a conversation',
					body: 'Sideline Family Office is in due diligence. Click their card.', advance: { kind: 'click' } },
				{ id: 'pipeline-detail', path: '/pipeline', allow: ['[data-tour="pipeline-fields"]', '[data-tour="pipeline-activity"]', '.atlas button[aria-label="Close"]'], continues: true,
					title: 'Everything about one investor', body: 'Contact, potential amount, the next step with its due date, notes and the full activity history. Close the panel with × when you’re done.',
					advance: { kind: 'click', on: '.atlas button[aria-label="Close"]' } },
				{ id: 'pipeline-add', path: '/pipeline', target: 'pipeline-add', title: 'Add an investor',
					body: 'Click Add investor.', advance: { kind: 'click' } },
				{ id: 'pipeline-add-search', path: '/pipeline', target: 'pipeline-add-search', continues: true,
					title: 'Find them in Atlas', body: 'Type the investor’s name below.', advance: { kind: 'type', value: 'Fieldhouse' } },
				{ id: 'pipeline-add-pick', path: '/pipeline', target: 'pipeline-add-results', continues: true,
					title: 'Add from the database', body: 'Click Fieldhouse Capital. It lands in Target with its full profile.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
				{ id: 'pipeline-filter', path: '/pipeline', target: 'pipeline-filters',
					only: '[data-tour="pipeline-filters"] button:nth-child(2)',
					title: 'What’s overdue?', body: 'Click Overdue next step to see only the conversations that need a follow-up.', advance: { kind: 'click' }, pause: 1200 },
			],
		},
		{
			id: 'watchlists', title: 'Watchlists', steps: [
				{ id: 'watchlists-list', path: '/watchlists', target: 'watchlists-list', title: 'All your lists in one place',
					body: 'Your Main investor watchlist sits alongside company lists, for competitors, partners or companies you follow.', advance: { kind: 'next' } },
				{ id: 'watchlists-create', path: '/watchlists', target: 'watchlists-create', title: 'Start a new list',
					body: 'Name a list here to create it. From any investor, Add to watchlist → New watchlist files them in a list of their own.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'my-market', title: 'My Market', steps: [
				{ id: 'market-kpis', path: '/my-market', target: 'my-market-kpis', title: 'Size up your market',
					body: 'Your total and addressable market, how fast it grows and how much competitors have raised, built on SportsTechX data.', advance: { kind: 'next' } },
				{ id: 'market-classification', path: '/my-market', target: 'my-market-classification', title: 'Where Fanloop sits',
					body: 'Atlas places Fanloop in its taxonomy, and every figure on this page follows from that.', advance: { kind: 'next' } },
				{ id: 'market-competitors-tab', path: '/my-market', target: 'my-market-tabs', only: '[data-tour="my-market-tabs"] .atlas-tab:nth-child(2)',
					title: 'Who else is out there', body: 'Click the Competitors tab.', advance: { kind: 'click' }, pause: 400 },
				{ id: 'market-competitors', path: '/my-market', target: 'my-market-competitors', continues: true, title: 'Your competitors',
					body: 'Companies in your space, with what each has raised. Open any of them for its full profile.', advance: { kind: 'next' } },
				{ id: 'market-recompute', path: '/my-market', target: 'my-market-recompute', title: 'Changed your positioning?',
					body: 'Click Recompute to rebuild the analysis from your latest raise settings.', advance: { kind: 'click' }, pause: 900 },
			],
		},
		{
			id: 'guide', title: 'Fundraising Guide', steps: [
				{ id: 'guide-phases', path: '/resources', target: 'guide-phases', title: 'Prepare, Connect, Close',
					body: 'Guides, templates and checklists for every phase of the raise, written by the SportsTechX team.', advance: { kind: 'next' } },
				{ id: 'guide-open', path: '/resources', target: 'guide-pitch-deck-checklist', title: 'Open a checklist',
					body: 'Click Pitch deck checklist.', advance: { kind: 'path', pattern: '/resources/pitch-deck-checklist' } },
				{ id: 'guide-tick', path: '/resources/pitch-deck-checklist', target: 'guide-checks', highlights: ['guide-progress'],
					title: 'Tick it off', body: 'Click “Market size is built bottom-up” to tick it. Your progress is saved to your account.',
					advance: { kind: 'request', method: 'PUT', pattern: '/api/raise/resources/:slug/checks' }, pause: 900 },
			],
		},
		{
			id: 'settings', title: 'Raise settings', steps: [
				{ id: 'settings-summary', path: '/settings', target: 'raise-summary', title: 'What Atlas knows about your raise',
					body: 'Your company, your round and the investors you want. Matches, My Market and your Home cards all run on this.', advance: { kind: 'next' } },
				{ id: 'settings-edit', path: '/settings', target: 'raise-edit', title: 'Edit your raise',
					body: 'Click Edit raise.', advance: { kind: 'click' } },
				{ id: 'settings-wizard', path: '/settings', allow: ['.setup-modal__scroll'], continues: true, title: 'The raise setup',
					body: 'The same five steps you filled in when you set up your raise. Click Continue through them, then Save changes.',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise', body: { setup_completed: true } }, pause: 900 },
				{ id: 'settings-circle', path: '/settings', target: 'dealflow-share', highlights: ['dealflow-optin'], title: 'Share your round with investors',
					body: 'Opt in and SportsTechX checks your round, then shows it to vetted investors in Atlas Scout. Click Share my round.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/dealflow/opt-in' }, pause: 1000 },
			],
		},
		{
			id: 'strategy', title: 'Strategy session', steps: [
				{ id: 'strategy-perks', path: '/strategy', target: 'strategy-perks', title: 'A session with SportsTechX',
					body: 'Each quarter you get a session with SportsTechX leadership to pressure-test your deck and your investor strategy.', advance: { kind: 'next' } },
				{ id: 'strategy-book', path: '/strategy', target: 'strategy-book', highlights: ['strategy-status'], title: 'Book it',
					body: 'Yours is unlocked. Click Book your call; SportsTechX confirms a time by email.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/strategy/book' }, pause: 1000 },
			],
		},
		{
			id: 'programs', title: 'Programs', steps: [
				{ id: 'programs-table', path: '/programs', target: 'programs-table', title: 'Accelerators and programmes',
					body: 'Sports tech accelerators, incubators and corporate programmes, with their deadlines and past cohorts. Open one for the details.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'companies', title: 'Companies', steps: [
				{ id: 'companies-search', path: '/companies', target: 'filters-search', title: 'Look up any company',
					body: 'Competitors, partners, possible customers: every sports tech company Atlas tracks. Type Kitroom into the search box.', advance: { kind: 'type', value: 'Kitroom' } },
				{ id: 'companies-open', path: '/companies', target: 'companies-results', continues: true, title: 'Open the profile',
					body: 'Click Kitroom.', advance: { kind: 'path', pattern: '/companies/:slug' } },
				{ id: 'company-head', path: '/companies/:slug', target: 'company-head', title: 'A company at a glance',
					body: 'What they do, where they are, and whether the company is verified.', advance: { kind: 'next' } },
				{ id: 'company-funding', path: '/companies/:slug', target: 'company-funding', title: 'Every round they raised',
					body: 'Kitroom’s pre-seed and seed, with the investors in each. Useful when you’re sizing up who backs your space.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'signals', title: 'Signals', steps: [
				{ id: 'signals-filters', path: '/signals', target: 'signals-filters', title: 'Who is raising right now',
					body: 'Signals flags companies that just raised or are raising. Filter by type, sector or country, or just your watchlists.', advance: { kind: 'next' } },
				{ id: 'signals-list', path: '/signals', target: 'signals-list', title: 'Read the market',
					body: 'Every signal links to the company. Rounds in your space tell you which investors are active this month.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'analysis', title: 'Market analysis', steps: [
				{ id: 'analysis-kpis', path: '/analytics', target: 'analysis-kpis', title: 'The whole market in numbers',
					body: 'Funding, deal counts and M&A across sports tech.', advance: { kind: 'next' } },
				{ id: 'analysis-series', path: '/analytics', target: 'analysis-series', title: 'Funding or M&A',
					body: 'Switch between funding and M&A, and change the period with the range next to it.', advance: { kind: 'next' } },
				{ id: 'analysis-sectors', path: '/analytics', target: 'analysis-sectors', title: 'Where the money goes',
					body: 'Which sectors attract the most capital: useful context for your market slide.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'roundup', title: 'Monthly Roundup', steps: [
				{ id: 'roundup-pickers', path: '/roundup', target: 'roundup-pickers', title: 'One month at a time',
					body: 'Pick a month and see what happened: every round and acquisition, summed up.', advance: { kind: 'next' } },
				{ id: 'roundup-kpis', path: '/roundup', target: 'roundup-kpis', title: 'The month in numbers',
					body: 'Total raised, number of deals and the biggest rounds, with breakdowns by sector and country below.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'recently-funded', title: 'Recently Funded', steps: [
				{ id: 'funded-list', path: '/recently-funded', target: 'funded-list', title: 'The latest rounds',
					body: 'Every new round in sports tech, newest first, with the investors in each. A quick way to see who is writing cheques right now.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'ma', title: 'M&A', steps: [
				{ id: 'ma-table', path: '/ma', target: 'ma-table', title: 'Who is buying whom',
					body: 'Acquisitions in sports tech, with buyer, price where disclosed and date. Good evidence for the exit slide investors ask about.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'more', title: 'Framework, reports, events and newsletter', steps: [
				{ id: 'more-framework', path: '/framework', target: 'framework-grid', title: 'The sports tech framework',
					body: 'How SportsTechX maps the industry. Open a category to see the companies in it.', advance: { kind: 'next' } },
				{ id: 'more-reports', path: '/reports', target: 'resources-grid', title: 'Reports',
					body: 'SportsTechX research on funding, sectors and markets. Read online or download the PDF.', advance: { kind: 'next' } },
				{ id: 'more-events', path: '/events', target: 'events-calendar', title: 'Events',
					body: 'Sports tech conferences, meetups and pitch nights: a good place to meet the investors in your watchlist.', advance: { kind: 'next' } },
				{ id: 'more-newsletter', path: '/newsletter', target: 'resources-grid', title: 'Newsletter',
					body: 'The SportsTechX briefing on funding, deals and what matters, every two weeks.', cta: 'Finish the tour', advance: { kind: 'next' } },
			],
		},
	],
	finale: {
		title: 'That’s Atlas Raise',
		body: 'You’ve seen your round at a glance, asked the co-pilot, read your deck analysis, found and added investors, run your pipeline, sized your market and shared your round with investors.\n\nNow do it for real, with your own company and live investor data.',
	},
};
