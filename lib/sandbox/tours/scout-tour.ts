/**
 * The Atlas Scout tour: every Scout page and flow, one chapter each.
 *
 * The visitor is Robin Keller, partner at Kestrel Field Ventures (fixtures/
 * world.ts), with a finished thesis (scout-routes.ts). Steps are pinned to the
 * same sample objects — Kitroom (a raising company in your stage and cheque range), the Shortlist
 * watchlist (Stridewise waiting in "Identified"), the featured Matchday Loop
 * raise — so every path is concrete and Back can always reopen it. Each
 * `target` is a `data-tour` attribute on the real page.
 */
import type { Tour } from '../tour-types';
import { SCOUT_FEATURED_DEAL_ID } from '../scout-routes';
import { SHORTLIST_ID } from '../watchlist-routes';
import { companyByName } from '../fixtures/world';

const STRIDEWISE = companyByName('Stridewise').id;

const KITROOM = '/companies/kitroom';
const SHORTLIST = `/watchlists/${SHORTLIST_ID}`;
const FEATURED = `/deal-flow/${SCOUT_FEATURED_DEAL_ID}`;
const SHARE = '/deal-flow/circle/share';

export const scoutTour: Tour = {
	product: 'scout',
	intro: {
		title: 'Welcome to Atlas Scout',
		body: 'You’re Robin Keller, partner at Kestrel Field Ventures (a made-up fund), and Atlas already knows your thesis:',
		points: [
			{ label: 'Sectors', text: 'Fan Engagement, Tracking & Analytics, Recovery & Injury Prevention' },
			{ label: 'Stage & cheque', text: 'Seed and Series A, €250k to €2m' },
			{ label: 'Geography', text: 'Europe' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home',
			steps: [
				{
					id: 'home-thesis', path: '/home', target: 'scout-home-thesis',
					title: 'Tuned to your thesis',
					body: 'Atlas ranks companies, signals and deals against these tags.',
					advance: { kind: 'next' },
				},
				{
					id: 'home-cards', path: '/home', target: 'scout-home-cards',
					title: 'What needs your attention',
					body: 'Up to three cards ranked for you, plus two standing shortcuts.',
					points: [
						{ label: 'Matches', text: 'Thesis-fit companies raising now.' },
						{ label: 'Watchlists', text: 'News on the companies you track.' },
						{ label: 'Deal Flow', text: 'Live raises, verified by SportsTechX or shared by Circle members.' },
						{ label: 'Roundup', text: 'Last month’s funding and deals on one page.' },
					],
					advance: { kind: 'next' },
				},
			],
		},
		{
			id: 'chat', title: 'Co-pilot chat',
			steps: [
				{
					id: 'chat-type', path: '/home', target: 'scout-home-composer', only: '[data-tour="scout-home-composer"] textarea',
					title: 'Ask the co-pilot',
					do: 'Click the message box, then type.',
					body: 'Ask anything about companies, deals or your thesis.',
					advance: { kind: 'type', value: 'Which seed rounds fit my thesis?' },
				},
				{
					id: 'chat-send', path: '/home', target: 'scout-home-composer', only: '[data-tour="scout-home-composer"] textarea', continues: true,
					title: 'Ask the co-pilot',
					do: 'Press {{Enter}} to send.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/chat' },
				},
				{
					id: 'chat-answer', path: '/chat/:id', target: 'chat-thread',
					title: 'An answer on your thesis',
					body: 'Answers come from Atlas data, naming the companies that fit; the real product can also add to watchlists.',
					advance: { kind: 'next' },
				},
				{
					id: 'chat-follow-up', path: '/chat/:id', target: 'chat-composer',
					title: 'Keep the conversation going',
					body: 'Ask follow-ups here; past conversations stay in your history.',
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
					body: 'Kitroom, a Berlin fan-loyalty start-up, is raising a round that fits your stage and cheque.',
					advance: { kind: 'type', value: 'Kitroom' },
				},
				{
					id: 'companies-open', path: '/companies', target: 'companies-results',
					only: `[data-tour="companies-results"] a[href="${KITROOM}"]`,
					title: 'Open the profile',
					do: 'Click {{Kitroom}} in the results.',
					advance: { kind: 'path', pattern: KITROOM },
				},
				{
					id: 'company-head', path: KITROOM, target: 'company-head',
					title: 'The company at a glance',
					body: 'Location, founding year, and whether Kitroom is verified and raising.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-thesis', path: KITROOM, target: 'company-thesis-match',
					title: 'Your thesis beside every profile',
					body: 'Judge the fit without leaving the page.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-funding', path: KITROOM, target: 'company-funding',
					title: 'Funding history',
					body: 'Every disclosed round, including Kitroom’s $2M seed led by your own fund.',
					advance: { kind: 'next' },
				},
				{
					id: 'company-save', path: KITROOM, target: 'company-save',
					allow: ['.atlas-wl-menu .atlas-menu__item'],
					title: 'Add to a watchlist',
					do: 'Click {{Add to watchlist}}, then pick {{Shortlist}}.',
					advance: { kind: 'request', method: 'POST', pattern: `/api/user-watchlists/${SHORTLIST_ID}/companies/:companyId` },
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
					body: 'Companies scored against your thesis, best fit first.',
					advance: { kind: 'next' },
				},
				{
					id: 'rec-why', path: '/recommended', target: 'rec-why',
					title: 'Why it matches',
					body: 'Sector, geography, stage and cheque fit; "From your activity" means it also matches what you’ve viewed.',
					advance: { kind: 'next' },
				},
				{
					id: 'rec-dismiss', path: '/recommended', target: 'rec-dismiss',
					title: 'Not a fit? Say so',
					do: 'Click {{Not relevant}} on the first match.',
					body: 'Atlas stops recommending it.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/recommended/:id/dismiss' },
				},
				{
					id: 'rec-undo', path: '/recommended', target: 'rec-undo',
					title: 'Changed your mind?',
					do: 'Click {{Undo}} to bring it back.',
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
					body: 'A live feed of what companies are doing, newest first.',
					points: [
						{ label: 'Funding', text: 'A round was announced.' },
						{ label: 'Fundraising', text: 'Raising right now: the moment to reach out.' },
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
					body: 'Companies you follow, kept together in lists. Anything you saved earlier is in your Shortlist.',
					advance: { kind: 'next' },
				},
				{
					id: 'watchlist-board', path: SHORTLIST, target: 'watchlist-view-toggle',
					title: 'From list to pipeline',
					do: 'Click {{Board}}.',
					body: 'Manage the Shortlist as a deal pipeline.',
					advance: { kind: 'click', on: '[data-tour="watchlist-view-toggle"] [data-key="board"]' },
				},
				{
					id: 'watchlist-stage', path: SHORTLIST, continues: true,
					// Two ways, both landing in Reviewing: drag the card onto that column
					// only, or pick it in the card's stage menu.
					target: 'board-card-stridewise',
					only: '[data-tour="board-card-stridewise"] .scout-board__select',
					dragFrom: '[data-tour="board-card-stridewise"]',
					highlights: ['board-reviewing'],
					dropOn: '[data-tour="board-reviewing"]',
					allow: ['[role="option"][data-value="Reviewing"]'],
					pointerOnly: true,
					title: 'Move a deal forward',
					do: 'Drag Stridewise to {{Reviewing}}, or pick it in the stage menu.',
					body: 'Stridewise is waiting in Identified.',
					advance: { kind: 'request', method: 'PATCH', pattern: `/api/scout/watchlists/:id/companies/${STRIDEWISE}/stage`, body: { stage: 'reviewing' } },
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
					body: 'Tidepool Sport is a seed fund in your space.',
					advance: { kind: 'type', value: 'Tidepool Sport' },
				},
				{
					id: 'investors-results', path: '/investors', target: 'investors-results',
					title: 'Who they are at a glance',
					body: 'Type, location and deal count, so you can see who to syndicate with.',
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
					body: 'Deadlines and latest cohorts: an early look at companies before they raise.',
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
					body: 'Funding and deal count for the period you pick; switch the series above for M&A.',
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
					id: 'roundup-pickers', path: '/roundup', target: 'roundup-pickers', only: '[data-tour="roundup-pickers"]', allow: ['.atlas-combo-panel'],
					title: 'A month at a glance',
					body: 'Pick a month to see its rounds, deals and news on one page.',
					advance: { kind: 'next' },
				},
				{
					id: 'roundup-kpis', path: '/roundup', target: 'roundup-kpis',
					title: 'The month’s headline numbers',
					body: 'Total raised and deal count, compared with the month before.',
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
					body: 'Newly disclosed rounds, newest first; Kickframe’s is the biggest of the last two months.',
					advance: { kind: 'type', value: 'Kickframe' },
				},
				{
					id: 'funded-result', path: '/recently-funded',
					title: 'Kickframe’s $14M Series B',
					body: 'Led by Podium Capital. Filters narrow rounds by type, country and period.',
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
					body: 'Acquisitions across sports tech, acquirer and target side by side.',
					points: [
						{ label: 'Exits', text: 'Which companies like yours got bought, and by whom.' },
						{ label: 'Acquirers', text: 'The buyers active in your sectors.' },
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
					body: 'Companies raising right now; SportsTechX picks the featured deal each month.',
					points: [
						{ label: 'Verified Raises', text: 'Founders raising on Atlas, checked by SportsTechX.' },
						{ label: 'From the Circle', text: 'Deals Investor Circle members share with each other.' },
					],
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-filter', path: '/deal-flow', target: 'dealflow-filter',
					title: 'Filter by valuation',
					body: 'A €10m maximum hides euro rounds valued above it. Rounds in other currencies stay listed.',
					advance: { kind: 'type', value: '10000000' },
				},
				{
					id: 'dealflow-verified', path: '/deal-flow', target: 'dealflow-verified',
					title: 'Verified Raises',
					body: 'Courtline, valued at €16m, has dropped out; each card shows target, committed amount and close date.',
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-circle', path: '/deal-flow', target: 'dealflow-circle',
					title: 'From the Circle',
					body: 'Deals members invest in or advise, with their relationship to the company stated.',
					advance: { kind: 'next' },
				},
				{
					id: 'dealflow-open', path: '/deal-flow', target: 'dealflow-featured',
					only: '[data-tour="dealflow-featured"] .scout-df-feat__btn',
					title: 'Open the featured deal',
					do: 'Click {{View opportunity}} on Matchday Loop.',
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
					body: 'SportsTechX’s summary, plus the deck and one-pager when the founder shares them.',
					advance: { kind: 'next' },
				},
				{
					id: 'deal-watch', path: FEATURED, target: 'deal-watch',
					title: 'Watch this raise',
					do: 'Click {{Watch}}.',
					body: 'You’ll hear when it moves.',
					advance: { kind: 'request', method: 'PUT', pattern: '/api/scout/dealflow/:id/watch' },
				},
				{
					id: 'deal-intro', path: FEATURED, target: 'deal-request-intro',
					title: 'Request an introduction',
					do: 'Click {{Request introduction}}.',
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
					do: 'Click {{Send request}}.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/dealflow/:id/interest' },
					pause: 800,
				},
				{
					id: 'deal-sent', path: FEATURED, target: 'deal-intro-status',
					title: 'Warm introductions, not cold emails',
					body: 'SportsTechX checks with the company, then connects you, usually within two working days.',
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
					do: 'Click {{+ Share a deal}}.',
					body: 'In a round you like? Share it with other Investor Circle members.',
					advance: { kind: 'path', pattern: SHARE },
				},
				{
					id: 'share-company', path: SHARE, target: 'share-company-search',
					title: 'Which company?',
					advance: { kind: 'type', value: 'Tifo Studio' },
				},
				{
					id: 'share-pick', path: SHARE, target: 'share-company-search', continues: true,
					allow: ['.fundpicker__panel [data-ci="0"]'],
					title: 'Which company?',
					do: 'Pick {{Tifo Studio}} from the list.',
					body: 'This links the deal to its Atlas profile.',
					advance: { kind: 'click', on: '.fundpicker__panel [data-ci="0"]' },
				},
				{
					id: 'share-desc', continues: true, path: SHARE, target: 'share-description',
					title: 'What it does',
					body: 'One line for Circle members.',
					advance: { kind: 'type', value: 'In-arena fan shows for basketball clubs' },
				},
				{
					id: 'share-next-1', continues: true, path: SHARE, target: 'share-continue',
					title: 'On to the round',
					do: 'Click {{Continue}}.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-round', continues: true, path: SHARE, target: 'share-round',
					title: 'The round',
					do: 'Pick {{Pre-seed}}.',
					body: 'Tifo Studio is raising a pre-seed.',
					advance: { kind: 'click', on: '[data-tour="share-round"] [data-value="Pre-seed"]' },
				},
				{
					id: 'share-target', continues: true, path: SHARE, target: 'share-target',
					title: 'How much',
					body: 'The target raise, in euros.',
					advance: { kind: 'type', value: '500000' },
				},
				{
					id: 'share-next-2', continues: true, path: SHARE, target: 'share-continue',
					title: 'On to your involvement',
					do: 'Click {{Continue}}.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-note', continues: true, path: SHARE, target: 'share-note',
					title: 'Your take',
					body: 'Why should other members look at it?',
					advance: { kind: 'type', value: 'Strong club pipeline in Italy' },
				},
				{
					id: 'share-consent', continues: true, path: SHARE, target: 'share-consent',
					title: 'Founder consent',
					do: 'Tick the consent box.',
					body: 'A deal is only shared with the founder’s agreement.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-next-3', continues: true, path: SHARE, target: 'share-continue',
					title: 'Review',
					do: 'Click {{Continue}}.',
					advance: { kind: 'click' },
				},
				{
					id: 'share-review', continues: true, path: SHARE, target: 'share-review',
					title: 'Check before you send',
					body: 'Every answer in one place, with Edit links back to each step.',
					advance: { kind: 'next' },
				},
				{
					id: 'share-submit', continues: true, path: SHARE, target: 'share-continue',
					title: 'Submit',
					do: 'Click {{Submit deal}}.',
					body: 'SportsTechX checks eligibility before it goes live.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/scout/dealflow/:id/submit' },
					pause: 600,
				},
				{
					id: 'share-done', path: SHARE, target: 'share-done',
					title: 'Submitted for review',
					body: 'It appears under Your submissions in From the Circle, with its review status.',
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
					do: 'Click {{View full analysis}}.',
					body: 'Atlas scores a founder’s deck area by area and flags what to probe; this one’s already screened.',
					advance: { kind: 'path', pattern: '/deck/:id' },
				},
				{
					id: 'deck-detail', path: '/deck/:id',
					title: 'Fit, red flags and questions',
					body: 'How the deck fits your thesis, its red flags, the questions to ask, and a score for each area.',
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
					body: 'Profile, fund, stage, cheque and investment focus: everything Scout personalises from.',
					advance: { kind: 'next' },
				},
				{
					id: 'thesis-edit', path: '/thesis', target: 'thesis-edit',
					title: 'Change it any time',
					do: 'Click {{Edit thesis}}.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-stage-edit', continues: true, path: '/thesis', target: 'thesis-review-edit-2',
					title: 'Widen your stages',
					do: 'Click {{Edit}} next to Stage & cheque.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-series-b', continues: true, path: '/thesis', target: 'thesis-stages',
					title: 'Add Series B',
					do: 'Pick {{Series B}}.',
					advance: { kind: 'click', on: '[data-tour="thesis-stages"] [data-value="Series B"]' },
				},
				{
					id: 'thesis-next-1', continues: true, path: '/thesis', target: 'thesis-next',
					title: 'Save as you go',
					do: 'Click {{Continue}}.',
					body: 'Each step is saved as you leave it.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-next-2', path: '/thesis', target: 'thesis-next', continues: true,
					title: 'Save as you go',
					do: 'Click {{Continue}} again.',
					body: 'Your investment focus stays as it is.',
					advance: { kind: 'click' },
				},
				{
					id: 'thesis-save', continues: true, path: '/thesis', target: 'thesis-next',
					title: 'Save your thesis',
					do: 'Click {{Save changes}}.',
					body: 'Recommendations, signals and Deal Flow re-rank straight away.',
					// Only the wizard's final save marks setup complete; the per-step saves don't.
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/scout', body: { setup_completed: true } },
					pause: 900,
				},
				{
					id: 'thesis-saved', path: '/thesis', target: 'thesis-summary',
					title: 'Series B is in',
					body: 'Your stages now include it.',
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
					body: 'Browse every company on one map: for athletes, for fans and for executives.',
					advance: { kind: 'next' },
				},
				{
					id: 'reports', path: '/reports',
					title: 'Reports',
					body: 'SportsTechX research to read online or download as a PDF.',
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
					body: 'Every SportsTechX newsletter issue, in one archive.',
					advance: { kind: 'next' },
				},
			],
		},
	],
	finale: {
		title: 'That’s Atlas Scout',
		body: 'You matched companies, ran a pipeline, requested an intro, shared a deal and screened a deck.\n\nNow do it for real, with your own thesis.',
	},
};
