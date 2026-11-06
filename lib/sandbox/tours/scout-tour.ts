/**
 * "The Warm-Up" for Atlas Scout: a short run over the real app, played as
 * Robin Keller, partner at Kestrel Field Ventures (fixtures/world.ts), with a
 * finished thesis (scout-routes.ts).
 *
 * Steps are pinned to the same sample objects — Laneline (the top thesis
 * match) and the Shortlist watchlist (Stridewise waiting in "Identified") — so
 * every path is concrete and Back can always reopen it. Each `target` is a
 * `data-tour` attribute on the real page.
 *
 * Left out: chat, Deal Flow ("Coming soon" in Atlas) and every other page.
 * The tutorial has no sidebar, so the last step lists what else Scout covers.
 */
import type { Tour } from '../tour-types';
import { SHORTLIST_ID } from '../watchlist-routes';
import { companyByName } from '../fixtures/world';

const STRIDEWISE = companyByName('Stridewise').id;

const LANELINE = '/companies/laneline';
const SHORTLIST = `/watchlists/${SHORTLIST_ID}`;

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
					id: 'home-matches', path: '/home', target: 'scout-card-new-matches',
					only: '[data-tour="scout-card-new-matches"] a[href="/recommended"]',
					title: 'Fresh matches',
					do: 'Click {{Review matches}}.',
					body: 'Atlas finds companies matching your investment thesis. Let’s see who made the shortlist.',
					advance: { kind: 'path', pattern: '/recommended' },
				},
			],
		},
		{
			id: 'recommended', title: 'Recommended',
			steps: [
				{
					id: 'recommended', path: '/recommended', target: 'rec-card',
					only: `[data-tour="rec-card"] a[href="${LANELINE}"]`,
					title: 'Evaluate a match',
					do: 'Click {{View company}} on Laneline, your top match.',
					body: 'Each match shows why it fits, from sector and geography to stage and cheque.',
					advance: { kind: 'path', pattern: LANELINE },
				},
			],
		},
		{
			id: 'company', title: 'Company profile',
			steps: [
				{
					id: 'company-save', path: LANELINE, target: 'company-save',
					allow: ['.atlas-wl-menu .atlas-menu__item'],
					title: 'Add to watchlist',
					do: 'Click {{Add to watchlist}}, then pick {{Shortlist}}.',
					body: 'Found something interesting? Save it so you can keep track of the company.',
					advance: { kind: 'request', method: 'POST', pattern: `/api/user-watchlists/${SHORTLIST_ID}/companies/:companyId` },
					pause: 900,
				},
			],
		},
		{
			id: 'watchlists', title: 'Watchlists',
			steps: [
				{
					id: 'watchlist-open', path: '/watchlists', target: 'watchlists-list',
					only: `[data-tour="watchlists-list"] a[href="${SHORTLIST}"]`,
					title: 'Explore watchlists',
					do: 'Click {{Shortlist}} to open it.',
					body: 'All the companies you track live in your watchlists.',
					advance: { kind: 'path', pattern: SHORTLIST },
				},
			],
		},
		{
			id: 'pipeline', title: 'Your pipeline',
			steps: [
				{
					id: 'watchlist-board', path: SHORTLIST, target: 'watchlist-view-toggle',
					title: 'Manage your pipeline',
					do: 'Click {{Board}}.',
					body: 'Board view organises your opportunities by deal stage.',
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
					body: 'Stridewise is waiting in Identified. Moving it tracks your progress.',
					advance: { kind: 'request', method: 'PATCH', pattern: `/api/scout/watchlists/:id/companies/${STRIDEWISE}/stage`, body: { stage: 'reviewing' } },
					pause: 1200,
				},
			],
		},
		{
			id: 'platform', title: 'Explore the platform',
			steps: [
				{
					id: 'platform', path: '/home',
					title: 'Explore the platform',
					body: 'Atlas Scout has more for your thesis than this warm-up showed:',
					points: [
						{ label: 'Discover', text: 'Find companies matching your investment thesis.' },
						{ label: 'Watchlists', text: 'Track companies and manage your investment pipeline.' },
						{ label: 'Ecosystem', text: 'Map the investors and programs around your sectors.' },
						{ label: 'Intelligence', text: 'Research the market, companies and investment trends.' },
					],
					cta: 'Finish Warm-Up',
					advance: { kind: 'next' },
				},
			],
		},
	],
	finale: {
		title: 'Warm-Up Complete. Ready to Play?',
		body: 'You’ve found companies matching your thesis, built a watchlist and managed your pipeline.\n\nNow put Atlas Scout to work with your own investment thesis and real companies.',
	},
};
