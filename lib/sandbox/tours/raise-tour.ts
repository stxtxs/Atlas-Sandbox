/**
 * "The Warm-Up" for Atlas Raise: a short run over the real app, played as
 * Lena Hoffmann, co-founder of Fanloop (raise-routes.ts builds that workspace;
 * every company and investor comes from fixtures/world.ts). A different name
 * from the Scout persona (Robin Keller, partner at Kestrel), whom Lena pitches.
 *
 * Each `target` is a `data-tour` attribute on the real element (lists mark
 * every item; the first on screen is used). Every step says exactly what to
 * click, and only that works. A chapter's first step has a concrete path, so
 * Contents can always jump there.
 *
 * Story beats the steps rely on (see raise-routes.ts SEED):
 *   - Kestrel Field Ventures is the top match and NOT in the watchlist (the tour adds it);
 *   - once added it sits in Target as sample-pipe-kestrel-field-ventures, the card
 *     the visitor then drags to Contacted.
 *
 * Left out: chat, the deck and every other page. The tutorial has no sidebar,
 * so the last step lists what else Atlas Raise covers.
 */
import { investorByName } from '../fixtures/world';
import type { Tour } from '../tour-types';

const KESTREL_INVESTOR = investorByName('Kestrel Field Ventures');
const KESTREL = `/investors/${KESTREL_INVESTOR.id}`;
/** Kestrel's watchlist card once the tour adds it (raise-routes.ts addToPipeline). */
const KESTREL_CARD = `pipe-card-sample-pipe-${KESTREL_INVESTOR.slug}`;

/** The one option the profile step allows in the investor watchlist menu (portalled to <body>). */
const MAIN_WATCHLIST = '.atlas-wl-menu .atlas-menu__item[data-tour-option="Main watchlist"]';

export const raiseTour: Tour = {
	product: 'raise',
	intro: {
		title: 'Welcome to Atlas Raise',
		body: 'You’re Lena Hoffmann, co-founder of Fanloop, a Munich start-up building match-day apps for football clubs.',
		points: [
			{ label: 'Round', text: '€1.5m seed, €300k committed' },
			{ label: 'Investors', text: 'Eight already in your watchlist' },
			{ label: 'Data', text: 'All made-up sample data' },
		],
	},
	chapters: [
		{
			id: 'home', title: 'Home', steps: [
				{ id: 'home', path: '/home', target: 'raise-home-attention', only: '[data-tour="raise-home-attention"] a[href="/recommended"]',
					title: 'Your raise at a glance', do: 'Click {{See matches}} on Investors who fit Fanloop.',
					body: 'Home puts your round and what needs you today up front.', advance: { kind: 'path', pattern: '/recommended' } },
			],
		},
		{
			id: 'recommended', title: 'Recommended investors', steps: [
				{ id: 'investors', path: '/recommended', target: 'investor-card', only: `[data-tour="investor-card"] a[href="${KESTREL}"]`,
					title: 'Investors who fit Fanloop', do: 'Click {{View profile}} on Kestrel Field Ventures, your top match.',
					body: 'Atlas matches on sector, stage and geography, and says why each one fits.', advance: { kind: 'path', pattern: KESTREL } },
			],
		},
		{
			id: 'investor-profile', title: 'Investor profile', steps: [
				{ id: 'profile-add', path: KESTREL, target: 'investor-save', allow: [MAIN_WATCHLIST],
					title: 'Check the fit, then add', do: 'Click {{Add to watchlist}}, then pick {{Main watchlist}}.',
					body: 'Stages, geography and recent deals show whether they back teams like yours.',
					advance: { kind: 'request', method: 'POST', pattern: '/api/raise/pipeline' }, pause: 900 },
			],
		},
		{
			id: 'pipeline', title: 'Investor pipeline', steps: [
				{ id: 'pipeline-drag', path: '/pipeline', target: KESTREL_CARD, highlights: ['pipeline-col-contacted'],
					dropOn: '[data-tour="pipeline-col-contacted"]',
					allow: ['[data-tour="pipeline-stage"]', '[role="option"][data-value="contacted"]', '[data-tour="pipeline-save"]'],
					pointerOnly: true,
					title: 'You reached out to Kestrel Field Ventures', do: 'Drag the Kestrel Field Ventures card to {{Contacted}}.',
					body: 'Your watchlist tracks every investor, stage by stage. Or open the card, set Stage to Contacted and save.',
					advance: { kind: 'request', method: 'PATCH', pattern: '/api/raise/pipeline/:id', body: { stage: 'contacted' } }, pause: 1000 },
			],
		},
		{
			id: 'my-market', title: 'My Market', steps: [
				{ id: 'market-kpis', path: '/my-market', target: 'my-market-kpis', title: 'Know your playing field',
					body: 'Market size, growth and what competitors have raised, built on SportsTechX data.', advance: { kind: 'next' } },
			],
		},
		{
			id: 'platform', title: 'Explore the platform', steps: [
				{ id: 'platform', path: '/home', title: 'Explore the platform',
					body: 'Atlas Raise has more for your round than this warm-up showed:',
					points: [
						{ label: 'Pitch Deck', text: 'Upload your deck to see strengths, gaps and likely investor concerns.' },
						{ label: 'Investors', text: 'Search every sports tech investor and accelerator programme.' },
						{ label: 'Watchlists', text: 'Track every investor conversation, stage by stage.' },
						{ label: 'Intelligence', text: 'Research your market, competitors and funding trends.' },
					],
					cta: 'Finish Warm-Up', advance: { kind: 'next' } },
			],
		},
	],
	finale: {
		title: 'Warm-Up Complete. Ready to Play?',
		body: 'You’ve seen your raise at a glance, found investors who fit, moved one through your pipeline and sized up your market.\n\nNow put Atlas Raise to work with your own deck, company and live investor data.',
		note: '30-day money-back guarantee',
	},
};
