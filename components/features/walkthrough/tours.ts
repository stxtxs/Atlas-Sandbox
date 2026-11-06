import { raiseTour } from '@/lib/sandbox/tours/raise-tour';
import { scoutTour } from '@/lib/sandbox/tours/scout-tour';
import type { Tour, TourStep } from '@/lib/sandbox/tour-types';
import type { SandboxProduct } from '@/lib/sandbox/types';

/** One tour per tier (lib/sandbox/tours). Explore has none: its sample data stays for the shared routes. */
export const TOURS: Partial<Record<SandboxProduct, Tour>> = { raise: raiseTour, scout: scoutTour };

/** Short tier name for copy. */
export const PRODUCT_NAME: Record<SandboxProduct, string> = { explore: 'Explore', raise: 'Raise', scout: 'Scout' };

export interface FlatTour {
	/** Every step of every chapter, in order. The store's `step` indexes this. */
	steps: TourStep[];
	/** Chapter index of each step. */
	chapterOf: number[];
	/** First step index of each chapter. */
	chapterStart: number[];
}

const cache = new Map<Tour, FlatTour>();

/** The tour's chapters as one step list, plus where each chapter starts. */
export function flatten(tour: Tour): FlatTour {
	let flat = cache.get(tour);
	if (!flat) {
		flat = { steps: [], chapterOf: [], chapterStart: [] };
		for (const [c, chapter] of tour.chapters.entries()) {
			flat.chapterStart.push(flat.steps.length);
			for (const s of chapter.steps) { flat.steps.push(s); flat.chapterOf.push(c); }
		}
		cache.set(tour, flat);
	}
	return flat;
}
