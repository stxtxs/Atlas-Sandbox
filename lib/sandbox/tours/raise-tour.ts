import type { Tour } from '../tour-types';

/** Atlas Raise tour. Chapters are filled in per page and flow. */
export const raiseTour: Tour = {
	product: 'raise',
	intro: { title: 'Welcome to Atlas Raise', body: 'A guided tour on sample data.' },
	chapters: [
		{ id: 'home', title: 'Home', steps: [
			{ id: 'home', path: '/home', title: 'Your home', body: 'Everything starts here.', advance: { kind: 'next' } },
		] },
	],
	finale: { title: "That's Atlas Raise", body: 'Get started for real, replay the tour or try another plan.' },
};
