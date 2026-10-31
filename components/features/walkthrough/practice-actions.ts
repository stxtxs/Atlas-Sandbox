'use client';

import { activeSandbox, exitPractice, startWalkthrough } from '@/lib/sandbox/store';
import type { SandboxProduct } from '@/lib/sandbox/types';

/*
 * Starting, replaying and leaving a tour all end in a full page load, so the
 * SWR cache and every tier reader start fresh on the new tier's sample data.
 */

/** Start a tier's tour on its home page. `replace` for a deep link, so Back doesn't land on it and restart the tour. */
export function enterPractice(product: SandboxProduct, { replace = false } = {}) {
	startWalkthrough(product);
	if (replace) window.location.replace('/home');
	else window.location.assign('/home');
}

/** Run the current tour again from the start, on a fresh sample workspace. */
export function restartPractice() {
	const product = activeSandbox();
	if (product) enterPractice(product);
}

/** Leave the tour for the tier chooser. */
export function leavePractice() {
	exitPractice();
	window.location.assign('/');
}
