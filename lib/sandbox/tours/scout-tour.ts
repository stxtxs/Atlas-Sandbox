import type { Tour } from '../tour-types';

/** Atlas Scout tour. Chapters are filled in per page and flow. */
export const scoutTour: Tour = {
	product: 'scout',
	intro: { title: 'Welcome to Atlas Scout', body: 'A guided tour on sample data.' },
	chapters: [
		{ id: 'home', title: 'Home', steps: [
			{ id: 'home', path: '/home', title: 'Your home', body: 'Everything starts here.', advance: { kind: 'next' } },
		] },
	],
	finale: { title: "That's Atlas Scout", body: 'Get started for real, replay the tour or try another plan.' },
};
