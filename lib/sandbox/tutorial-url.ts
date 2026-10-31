/**
 * Tutorial progress in the URL: every tutorial page carries
 * `?tour=<explore|raise|scout>&step=<n>`, so a reload, a bookmark or a shared
 * link opens the same step.
 *
 *   step 0      → the welcome screen
 *   step 1…N    → the tour's steps (flat index n-1, see walkthrough/tours.ts `flatten`)
 *   step N+1    → the finale
 *
 * Pure functions only (no React), so `tours.check.ts` can run them under node.
 */
import type { SandboxProduct } from './types';

export const TOUR_PARAM = 'tour';
export const STEP_PARAM = 'step';
const TIERS: readonly SandboxProduct[] = ['explore', 'raise', 'scout'];

export interface TutorialPosition { tier: SandboxProduct; step: number }

/** The tour and step a query string names, or null when it names none (or a bad one). */
export function readTutorialParams(search: string): TutorialPosition | null {
	const q = new URLSearchParams(search);
	const tier = q.get(TOUR_PARAM) as SandboxProduct | null;
	const raw = q.get(STEP_PARAM);
	if (!tier || !TIERS.includes(tier)) return null;
	const step = raw !== null && /^\d{1,4}$/.test(raw) ? Number(raw) : 0;
	return { tier, step };
}

/** `path` (which may carry its own query and hash) with the tutorial params set, everything else kept. */
export function withTutorialParams(path: string, pos: TutorialPosition): string {
	const hashAt = path.indexOf('#');
	const hash = hashAt === -1 ? '' : path.slice(hashAt);
	const bare = hashAt === -1 ? path : path.slice(0, hashAt);
	const [pathname, query = ''] = bare.split('?');
	const q = new URLSearchParams(query);
	q.set(TOUR_PARAM, pos.tier);
	q.set(STEP_PARAM, String(pos.step));
	return `${pathname}?${q.toString()}${hash}`;
}

/** The URL's step number for a flat step index, and back. */
export const urlStepOf = (flatIndex: number) => flatIndex + 1;
export const flatIndexOf = (urlStep: number) => urlStep - 1;
