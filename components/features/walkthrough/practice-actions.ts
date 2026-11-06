'use client';

import { activeSandbox, exitPractice, startWalkthrough } from '@/lib/sandbox/store';
import type { SandboxProduct } from '@/lib/sandbox/types';
import { withTutorialParams } from '@/lib/sandbox/tutorial-url';

/*
 * Starting, replaying and leaving a tour all end in a full page load, so the
 * SWR cache and every tier reader start fresh on the new tier's sample data.
 */

/** Start a tier's tour on its home page. `replace` for a deep link, so Back doesn't land on it and restart the tour. */
export function enterPractice(product: SandboxProduct, { replace = false } = {}) {
	startWalkthrough(product);
	const url = withTutorialParams('/home', { tier: product, step: 0 });
	if (replace) window.location.replace(url);
	else window.location.assign(url);
}

/** Run the current tour again from the start, on a fresh sample workspace. */
export function restartPractice() {
	const product = activeSandbox();
	if (product) enterPractice(product);
}

/** Leave the tour for the tier chooser. */
/** True once the visitor chose to leave (Exit / Try another plan): the shell
 *  must not re-open the tour from the URL while the page unloads. */
let leaving = false;
export const isLeavingPractice = () => leaving;

export function leavePractice() {
	leaving = true;
	exitPractice();
	window.location.assign('/');
}
