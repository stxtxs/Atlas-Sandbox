/**
 * The Atlas Scout tour: every Scout page and flow, one chapter each.
 *
 * The visitor is Alex Morgan, partner at Kestrel Field Ventures (fixtures/
 * world.ts), with a finished thesis (scout-routes.ts). Steps are pinned to the
 * same sample objects — Kitroom (the top thesis match), the Shortlist
 * watchlist (Stridewise waiting in "Identified"), the featured Matchday Loop
 * raise — so every path is concrete and Back can always reopen it. Each
 * `target` is a `data-tour` attribute on the real page.
 */
import type { Tour } from '../tour-types';
import { SCOUT_FEATURED_DEAL_ID } from '../scout-routes';
import { SHORTLIST_ID } from '../watchlist-routes';

const KITROOM = '/companies/kitroom';
const SHORTLIST = `/watchlists/${SHORTLIST_ID}`;
const FEATURED = `/deal-flow/${SCOUT_FEATURED_DEAL_ID}`;
const SHARE = '/deal-flow/circle/share';

export const scoutTour: Tour = {
	product: 'scout',
	intro: {
		title: 'Welcome to Atlas Scout',
		body: 'You’re Alex Morgan, partner at Kestrel Field Ventures, a made-up fund. Your investment thesis is already set, so Atlas can match companies and deals to it:',
		points: [
			{ label: 'Sectors', text: 'Fan Engagement, Tracking & Analytics, Recovery & Injury Prevention' },
			{ label: 'Stage', text: 'Seed and Series A' },
			{ label: 'Geography', text: 'Europe' },
			{ label: 'Cheque', text: '€250k to €2m' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home',
			steps: [
				{
					id: 'home-thesis', path: '/home', target: 'scout-home-thesis',
					title: 'Tuned to your thesis',
					body: 'Scout Home starts from your thesis: these tags are what Atlas ranks companies, signals and deals against.',
					advance: { kind: 'next' },
				},
				{
					id: 'home-cards', path: '/home', target: 'scout-home-cards',
					title: 'What needs your attention',
					body: 'At most three cards, ranked for you, plus two standing shortcuts:',
					points: [
						{ label: 'Matches', text: 'Companies matching your thesis that are raising now.' },
						{ label: 'Watchlists', text: 'News on the companies you track.' },
						{ label: 'Deal Flow', text: 'Live raises, verified by SportsTechX or shared by Circle members.' },
						{ label: 'Roundup', text: 'Last month’s funding and deals in one page.' },
					],
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'chat', title: 'Co-pilot chat',
			steps: [
				{
					id: 'chat-type', path: '/home', target: 'scout-home-composer',
					title: 'Ask the co-pilot',
					body: 'Ask Atlas anything about companies, deals or your thesis. Type the question into the box.',
					advance: { kind: 'type', value: 'Which seed rounds fit my thesis?' },
				},
				{
					id: 'chat-send', path: '/home', target: 'scout-home-composer', continues: true,
					title: 'Ask the co-pilot',
					body: 'Now press {{Enter}} to send it.',
					advance: { kind: 'path', pattern: '/chat' },
				},
				{
					id: 'chat-answer', path: '/chat', target: 'chat-thread',
					title: 'An answer on your thesis',
					body: 'The co-pilot answers from Atlas data, with the companies that fit. In the real product it can also open lists and add to watchlists.',
					advance: { kind: 'next' },
				},
				{
					id: 'chat-follow-up', path: '/chat', target: 'chat-composer',
					title: 'Keep the conversation going',
					body: 'Follow-up questions go here, and past conversations stay in your history.',
					highlights: ['chat-history'],
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'companies', title: 'Companies & profiles',
			steps: [
				{
					id: 'companies-search', path: '/companies', target: 'filters-search',
					title: 'Search the database',
					body: 'Every sports tech company Atlas tracks is searchable here. Search for Kitroom, the top match for your thesis.',
					advance: { kind: 'type', value: 'Kitroom' },
				},
				{
					id: 'companies-open', path: '/companies', target: 'companies-results',
					only: `[data-tour="companies-results"] a[href="${KITROOM}"]`,
					title: 'Open the profile',
					body: 'Click Kitroom to open its profile.',
					advance: { kind: 'path', pattern: KITROOM },
				},
				{
					id: 'company-head', path: KITROOM, target: 'company-head',
					title: 'The company at a glance',
					body: 'Sector, location, founding year and what Kitroom does, all in one header.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-thesis', path: KITROOM, target: 'company-thesis-match',
					title: 'Your thesis, beside every profile',
					body: 'Scout keeps your thesis in view on each company, so you can judge the fit at a glance.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-funding', path: KITROOM, target: 'company-funding',
					title: 'Funding history',
					body: 'Every disclosed round, with amounts and investors. Kitroom raised a $2M seed led by Kestrel Field Ventures, your own fund.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-save', path: KITROOM, target: 'company-save',
					allow: ['.atlas-wl-menu .atlas-menu__item'],
					title: 'Add to a watchlist',
					body: 'Open Add to watchlist and pick Shortlist to keep track of Kitroom.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/user-watchlists/:id/companies/:companyId' },
					pause: 900,
				},
			],
		},
		{
			id: 'recommended', title: 'Recommended',
			steps: [
				{
					id: 'rec-list', path: '/recommended', target: 'rec-card',
					title: 'Matched to your thesis',
					body: 'Recommended lists companies scored against your thesis, best fit first.',
					advance: { kind: 'next' },
				},
				{
					id: 'rec-why', path: '/recommended', target: 'rec-why',
					title: 'Why it matches',
					body: 'Each match shows which dimensions fit: sector, geography, stage and cheque size. "From your activity" means it matches what you have been looking at too.',
					advance: { kind: 'next' },
				},
				{
					id: 'rec-dismiss', path: '/recommended', target: 'rec-dismiss',
					title: 'Not a fit? Say so',
					body: 'Click Not relevant on the first match. Atlas stops recommending it.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/recommended/:id/dismiss' },
				},
				{
					id: 'rec-undo', path: '/recommended', target: 'rec-undo',
					title: 'Changed your mind?',
					body: 'Click Undo to bring it back.',
					advance: { kind: 'request', method: 'DELETE', pattern: '/api/scout/recommended/:id/dismiss' },
					pause: 600,
				},
			],
		},
		{
			id: 'signals', title: 'Signals',
			steps: [
				{
					id: 'signals', path: '/signals',
					title: 'Company signals',
					body: 'Signals is the live feed of what companies are doing, newest first:',
					points: [
						{ label: 'Funding', text: 'A round was announced.' },
						{ label: 'Fundraising', text: 'A company is raising right now: the moment to reach out.' },
					],
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'watchlists', title: 'Watchlists & pipeline',
			steps: [
				{
					id: 'watchlists-list', path: '/watchlists', target: 'watchlists-list',
					title: 'Your watchlists',
					body: 'Watchlists keep the companies you follow together. Kitroom is in your Shortlist now.',
					advance: { kind: 'next' },
				},
				{
					id: 'watchlist-board', path: SHORTLIST, target: 'watchlist-view-toggle',
					title: 'From list to pipeline',
					body: 'Switch the Shortlist to Board to manage it as a deal pipeline.',
					advance: { kind: 'click', on: '[data-tour="watchlist-view-toggle"] [data-key="board"]' },
				},
				{
					id: 'watchlist-stage', path: SHORTLIST, continues: true,
					// Two ways, both landing in Reviewing: drag the card onto that column
					// only, or pick it in the card's stage menu.
					target: 'board-card',
					only: '[data-tour="board-card"] .scout-board__select',
					dragFrom: '[data-tour="board-card"]',
					highlights: ['board-reviewing'],
					dropOn: '[data-tour="board-reviewing"]',
					allow: ['[role="option"][data-value="Reviewing"]'],
					pointerOnly: true,
					title: 'Move a deal forward',
					body: 'Stridewise is waiting in Identified. Drag its card to Reviewing, or set Reviewing in its stage menu.',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/scout/watchlists/:id/companies/:companyId/stage', body: { stage: 'reviewing' } },
					pause: 1200,
				},
			],
		},
		{
			id: 'investors', title: 'Investors',
			steps: [
				{
					id: 'investors-search', path: '/investors', target: 'filters-search',
					title: 'Find co-investors',
					body: 'The investor database shows who backs what. Search for Tidepool Sport, a seed fund in your space.',
					advance: { kind: 'type', value: 'Tidepool Sport' },
				},
				{
					id: 'investors-results', path: '/investors', target: 'investors-results',
					title: 'Their portfolio and focus',
					body: 'Each investor shows its focus, cheque size and deals, so you can see who to syndicate with.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'programs', title: 'Programs',
			steps: [
				{
					id: 'programs', path: '/programs', target: 'programs-table',
					title: 'Accelerators and incubators',
					body: 'Programs lists accelerators with their deadlines and latest cohorts: an early look at companies before they raise.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'analysis', title: 'Market analysis',
			steps: [
				{
					id: 'analysis-kpis', path: '/analytics', target: 'analysis-kpis',
					title: 'The market in numbers',
					body: 'Funding, deal count and M&A for the period you pick.',
					advance: { kind: 'next' },
				},
				{
					id: 'analysis-sectors', path: '/analytics', target: 'analysis-sectors',
					title: 'Where the money goes',
					body: 'Sector by sector, so you can see which parts of your thesis are heating up.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'roundup', title: 'Monthly Roundup',
			steps: [
				{
					id: 'roundup-pickers', path: '/roundup', target: 'roundup-pickers',
					title: 'Last month at a glance',
					body: 'Pick a month to see its funding rounds, deals and news in one page.',
					advance: { kind: 'next' },
				},
				{
					id: 'roundup-kpis', path: '/roundup', target: 'roundup-kpis',
					title: 'The month’s headline numbers',
					body: 'Total raised, number of deals and how that compares with the month before.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'recently-funded', title: 'Recently Funded',
			steps: [
				{
					id: 'funded-search', path: '/recently-funded', target: 'filters-search',
					title: 'Fresh rounds',
					body: 'Every newly disclosed round, newest first. Search for Pitchmark to find this month’s biggest one.',
					advance: { kind: 'type', value: 'Pitchmark' },
				},
				{
					id: 'funded-result', path: '/recently-funded',
					title: 'A $14M Series B',
					body: 'Pitchmark Analytics raised $14M led by Podium Capital. Filters narrow rounds by sector, stage, country and size.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'ma', title: 'M&A',
			steps: [
				{
					id: 'ma', path: '/ma',
					title: 'Who is buying whom',
					body: 'M&A tracks acquisitions across sports tech, acquirer and target side by side.',
					points: [
						{ label: 'Exits', text: 'See which companies like yours got bought, and by whom.' },
						{ label: 'Acquirers', text: 'Spot the buyers active in your sectors.' },
					],
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'deal-flow', title: 'Deal Flow',
			steps: [
				{
					id: 'dealflow-featured', path: '/deal-flow', target: 'dealflow-featured',
					title: 'Live raises, curated',
					body: 'Deal Flow lists companies raising right now. The featured deal is picked by SportsTechX each month.',
					points: [
						{ label: 'Verified Raises', text: 'Founders who raise on Atlas, checked by SportsTechX.' },
						{ label: 'From the Circle', text: 'Deals Investor Circle members share with each other.' },
					],
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-filter', path: '/deal-flow', target: 'dealflow-filter',
					title: 'Filter by valuation',
					body: 'Set a maximum valuation to hide rounds above your range. Type 10000000 for €10m.',
					advance: { kind: 'type', value: '10000000' },
				},
				{
					id: 'dealflow-verified', path: '/deal-flow', target: 'dealflow-verified',
					title: 'Verified Raises',
					body: 'Courtline, valued at €16m, has dropped out. Each card shows the target, how much is committed and when it closes.',
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-circle', path: '/deal-flow', target: 'dealflow-circle',
					title: 'From the Circle',
					body: 'Members share deals they invest in or advise, with their relationship to the company stated.',
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-open', path: '/deal-flow', target: 'dealflow-featured',
					only: '[data-tour="dealflow-featured"] .scout-df-feat__btn',
					title: 'Open the featured deal',
					body: 'Click View opportunity on Matchday Loop.',
					advance: { kind: 'path', pattern: FEATURED },
				},
			],
		},
		{
			id: 'deal', title: 'A deal, up close',
			steps: [
				{
					id: 'deal-terms', path: FEATURED, target: 'deal-terms',
					title: 'The terms',
					body: 'Round, target, committed so far, valuation, instrument, close date and lead.',
					advance: { kind: 'next' },
				},
				{
					id: 'deal-summary', path: FEATURED, target: 'deal-summary', highlights: ['deal-documents'],
					title: 'The summary and documents',
					body: 'SportsTechX’s summary of the raise, and the deck and one-pager when the founder makes them available.',
					advance: { kind: 'next' },
				},
				{
					id: 'deal-watch', path: FEATURED, target: 'deal-watch',
					title: 'Watch it',
					body: 'Click Watch to follow this raise and hear when it moves.',
					advance: { kind: 'request', method: 'PUT', pattern: '/api/scout/dealflow/:id/watch' },
				},
				{
					id: 'deal-intro', path: FEATURED, target: 'deal-request-intro',
					title: 'Request an introduction',
					body: 'Want to meet the founders? Click Request introduction.',
					advance: { kind: 'click' },
				},
				{
					id: 'deal-note', path: FEATURED, target: 'deal-intro-note', continues: true,
					title: 'Add a note',
					body: 'Tell SportsTechX what you’d like to discuss.',
					advance: { kind: 'type', value: 'Keen to meet the founders' },
				},
				{
					id: 'deal-send', path: FEATURED, target: 'deal-intro-send', continues: true,
					title: 'Send it',
					body: 'Click Send request.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/dealflow/:id/interest' },
					pause: 800,
				},
				{
					id: 'deal-sent', path: FEATURED, target: 'deal-intro-status',
					title: 'Warm introductions, not cold emails',
					body: 'SportsTechX checks with the company first and then connects you, usually within two working days.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'share', title: 'Share a deal',
			steps: [
				{
					id: 'share-open', path: '/deal-flow/circle', target: 'dealflow-share',
					title: 'Share with the Circle',
					body: 'In a round you like? Share it with other Investor Circle members. Click + Share a deal.',
					advance: { kind: 'path', pattern: SHARE },
				},
				{
					id: 'share-company', path: SHARE, target: 'share-company-search',
					title: 'Which company?',
					body: 'Search the company by name: type Tifo Studio.',
					advance: { kind: 'type', value: 'Tifo Studio' },
				},
				{
					id: 'share-pick', path: SHARE, target: 'share-company-search', continues: true,
					allow: ['.fundpicker__panel [data-ci="0"]'],
					title: 'Which company?',
					body: 'Pick it from the list so the deal links to its Atlas profile.',
					advance: { kind: 'click', on: '.fundpicker__panel [data-ci="0"]' },
				},
				{
					id: 'share-desc', path: SHARE, target: 'share-description',
					title: 'What it does',
					body: 'One line for Circle members.',
					advance: { kind: 'type', value: 'In-arena fan shows for basketball clubs' },
				},
				{
					id: 'share-next-1', path: SHARE, target: 'share-continue',
					title: 'On to the round',
					body: 'Click Continue.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-round', path: SHARE, target: 'share-round',
					title: 'The round',
					body: 'Tifo Studio is raising a pre-seed. Pick Pre-seed.',
					advance: { kind: 'click', on: '[data-tour="share-round"] [data-value="Pre-seed"]' },
				},
				{
					id: 'share-target', path: SHARE, target: 'share-target',
					title: 'How much',
					body: 'Enter the target raise in euros.',
					advance: { kind: 'type', value: '500000' },
				},
				{
					id: 'share-next-2', path: SHARE, target: 'share-continue',
					title: 'On to your involvement',
					body: 'Click Continue.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-note', path: SHARE, target: 'share-note',
					title: 'Your take',
					body: 'Why should other members look at it?',
					advance: { kind: 'type', value: 'Strong club pipeline in Italy' },
				},
				{
					id: 'share-consent', path: SHARE, target: 'share-consent',
					title: 'Founder consent',
					body: 'A deal is only shared with the founder’s agreement. Tick the box.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-next-3', path: SHARE, target: 'share-continue',
					title: 'Review',
					body: 'Click Continue to check everything.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-review', path: SHARE, target: 'share-review',
					title: 'Check before you send',
					body: 'Every answer in one place, with Edit links back to each step.',
					advance: { kind: 'next' },
				},
				{
					id: 'share-submit', path: SHARE, target: 'share-continue',
					title: 'Submit',
					body: 'Click Submit deal. SportsTechX checks eligibility before it goes live.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/dealflow/:id/submit' },
					pause: 600,
				},
				{
					id: 'share-done', path: SHARE, target: 'share-done',
					title: 'Submitted for review',
					body: 'Your deal appears under Your submissions in From the Circle, with its review status.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'deck', title: 'Deck Screener',
			steps: [
				{
					id: 'deck-summary', path: '/deck', target: 'deck-view-analysis',
					title: 'Screen a pitch deck',
					body: 'Upload a founder’s deck and Atlas scores it area by area and flags what to probe. Here is one already screened: click View full analysis.',
					advance: { kind: 'path', pattern: '/deck/:id' },
				},
				{
					id: 'deck-detail', path: '/deck/:id',
					title: 'Scores, strengths and diligence flags',
					body: 'An overall score and verdict, a score per area with the page it came from, strengths, and the gaps to probe before a meeting.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'thesis', title: 'Your thesis',
			steps: [
				{
					id: 'thesis-summary', path: '/thesis', target: 'thesis-summary',
					title: 'Your thesis, in one place',
					body: 'Profile, fund, stage and cheque, and investment focus: everything Scout personalises from.',
					advance: { kind: 'next' },
				},
				{
					id: 'thesis-edit', path: '/thesis', target: 'thesis-edit',
					title: 'Change it any time',
					body: 'Click Edit thesis.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-stage-edit', path: '/thesis', target: 'thesis-review-edit-2',
					title: 'Widen your stages',
					body: 'Click Edit next to Stage & cheque.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-series-b', path: '/thesis', target: 'thesis-stages',
					title: 'Add Series B',
					body: 'Pick Series B.',
					advance: { kind: 'click', on: '[data-tour="thesis-stages"] [data-value="Series B"]' },
				},
				{
					id: 'thesis-next-1', path: '/thesis', target: 'thesis-next',
					title: 'Save as you go',
					body: 'Click Continue. Each step is saved as you leave it.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-next-2', path: '/thesis', target: 'thesis-next', continues: true,
					title: 'Save as you go',
					body: 'Your investment focus stays as it is. Click Continue again.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-save', path: '/thesis', target: 'thesis-next',
					title: 'Save your thesis',
					body: 'Click Save changes. Recommendations, signals and Deal Flow re-rank straight away.',
					advance: { kind: 'request', method: 'PUT', pattern: '/api/scout/thesis' },
					pause: 900,
				},
				{
					id: 'thesis-saved', path: '/thesis', target: 'thesis-summary',
					title: 'Series B is in',
					body: 'Your stages now include Series B.',
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'research', title: 'Framework, reports, events & newsletter',
			steps: [
				{
					id: 'framework', path: '/framework', target: 'framework-grid',
					title: 'The sports tech framework',
					body: 'Every company sits in a sector map you can browse, from Fans & Media to Performance.',
					advance: { kind: 'next' },
				},
				{
					id: 'reports', path: '/reports',
					title: 'Reports',
					body: 'SportsTechX research reports to read online or download as a PDF.',
					advance: { kind: 'next' },
				},
				{
					id: 'events', path: '/events', target: 'events-view',
					title: 'Events',
					body: 'Conferences, meetups and pitch nights, as a calendar or a list.',
					advance: { kind: 'next' },
				},
				{
					id: 'newsletter', path: '/newsletter',
					title: 'Newsletter',
					body: 'Every issue of the SportsTechX newsletter, in one archive.',
					advance: { kind: 'next' },
				},
			],
		},
	],
	finale: {
		title: 'That’s Atlas Scout',
		body: 'You matched companies to your thesis, ran a watchlist as a pipeline, requested an introduction on a live raise, shared a deal with the Circle and screened a deck.\n\nNow do it for real, with your own thesis and live deal flow.',
	},
};
