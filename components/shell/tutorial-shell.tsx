'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { AtlasShell } from '@/components/atlas';
import { EXPLORE_COLOR } from '@/components/explore/shell-config';
import { SCOUT_COLOR } from '@/components/scout/shell-config';
import { PRODUCT_NAME } from '@/components/features/walkthrough/tours';
import { openTour, usePractice } from '@/lib/sandbox/store';
import { readTutorialParams, withTutorialParams } from '@/lib/sandbox/tutorial-url';
import type { SandboxProduct } from '@/lib/sandbox/types';
import '@/components/raise/raise.css';
import '@/components/explore/explore.css';
import '@/components/scout/scout.css';
import '@/components/features/walkthrough/walkthrough.css';

// A static import: the guard must be up the moment the page is, not after a lazy chunk loads.
import { WalkthroughCoach } from '@/components/features/walkthrough/walkthrough-coach';

const COLOR: Record<SandboxProduct, string | undefined> = { explore: EXPLORE_COLOR, raise: undefined, scout: SCOUT_COLOR };

/**
 * The app frame for the tutorial: the real AtlasShell with no sidebar and no
 * top bar (the tour does all the navigating; Get Atlas, theme and Exit live in
 * the tour panel on the right).
 *
 * The URL is the source of truth for where the visitor is
 * (`?tour=&step=`, lib/sandbox/tutorial-url.ts): read once on load, so a
 * reload or shared link opens the same step, and written back after every
 * step and navigation. Client-only — a visitor with no tour in the URL or this
 * tab goes back to the tier chooser.
 */
export function TutorialShell({ children }: { children: React.ReactNode }) {
	const { active, step } = usePractice();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [mounted, setMounted] = useState(false);

	// Load: adopt the URL's position (the one render that must differ from the server's).
	useEffect(() => {
		const pos = readTutorialParams(window.location.search);
		if (pos) openTour(pos.tier, pos.step);
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);
	useEffect(() => { if (mounted && !active) window.location.replace('/'); }, [mounted, active]);

	// Keep the URL on the current position; pages and links that rewrite the query drop it.
	useEffect(() => {
		if (!mounted || !active) return;
		const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		const want = withTutorialParams(here, { tier: active, step });
		if (want !== here) window.history.replaceState(null, '', want);
	}, [mounted, active, step, pathname, searchParams]);

	if (!mounted || !active) return null;
	return (
		<AtlasShell product={PRODUCT_NAME[active]} productColor={COLOR[active]} homePath={pathname ?? '/home'} nav={[]} overlay={<WalkthroughCoach />}>
			{children}
		</AtlasShell>
	);
}
