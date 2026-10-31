import type { Tour } from '../tour-types';

/** Atlas Explore tour. Chapters are filled in per page and flow. */
export const exploreTour: Tour = {
	product: 'explore',
	intro: { title: 'Welcome to Atlas Explore', body: 'A guided tour on sample data.' },
	chapters: [
		{ id: 'home', title: 'Home', steps: [
			{ id: 'home', path: '/home', title: 'Your home', body: 'Everything starts here.', advance: { kind: 'next' } },
		] },
	],
	finale: { title: "That's Atlas Explore", body: 'Get started for real, replay the tour or try another plan.' },
};
