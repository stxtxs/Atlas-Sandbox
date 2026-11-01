'use client';

import { useEffect, useState } from 'react';
import { useSWRConfig } from 'swr';
import { usePathname, useSearchParams } from 'next/navigation';
import { AtlasShell } from '@/components/atlas';
import { EXPLORE_COLOR } from '@/components/explore/shell-config';
import { SCOUT_COLOR } from '@/components/scout/shell-config';
import { PRODUCT_NAME } from '@/components/features/walkthrough/tours';
import { activeSandbox, currentStep, openTour, restoreStepSnapshot, setTourStep, usePractice } from '@/lib/sandbox/store';
import { readTutorialParams, withTutorialParams } from '@/lib/sandbox/tutorial-url';
import { markNavDone, navPending, trackRouterNavigations } from '@/lib/sandbox/nav-pending';
import type { SandboxProduct } from '@/lib/sandbox/types';
import '@/components/raise/raise.css';
import '@/components/explore/explore.css';
import '@/components/scout/scout.css';
import '@/components/features/walkthrough/walkthrough.css';

// A static import: the guard must be up the moment the page is, not after a lazy chunk loads.
import { WalkthroughCoach } from '@/components/features/walkthrough/walkthrough-coach';

const COLOR: Record<SandboxProduct, string | undefined> = { explore: EXPLORE_COLOR, raise: undefined, scout: SCOUT_COLOR };

/**
 * Rewrite the address bar WITHOUT telling the router. Next patches
 * `history.replaceState` to dispatch a restore action, which discards any
 * navigation still in flight (the coach's `router.push` to the step's page)
 * and pushes the new query into `useSearchParams` (remounting lists keyed on
 * it). Handing Next its own history state (it carries `__NA`) makes the patch
 * pass the call straight to the browser, keeping Next's back/forward data.
 */
function writeUrl(url: string) {
	const state = window.history.state as Record<string, unknown> | null;
	window.history.replaceState(state?.__NA ? state : (state ?? null), '', url);
}

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
	const { mutate } = useSWRConfig();
	const [mounted, setMounted] = useState(false);

	// Load: adopt the URL's position (the one render that must differ from the server's).
	useEffect(() => {
		const pos = readTutorialParams(window.location.search);
		if (pos) openTour(pos.tier, pos.step);
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setMounted(true);
	}, []);
	useEffect(() => { if (mounted && !active) window.location.replace('/'); }, [mounted, active]);

	// Router navigations in flight (lib/sandbox/nav-pending.ts): the tour holds its
	// own updates until they land, or Next loses them. A navigation has landed
	// once the pathname or query actually changes.
	const [retry, setRetry] = useState(0);
	useEffect(() => trackRouterNavigations(), []);
	useEffect(() => { markNavDone(); }, [pathname, searchParams]);

	// Keep the URL on the current position; pages and links that rewrite the query drop it.
	useEffect(() => {
		if (!mounted || !active) return;
		// A navigation still in flight: try again shortly (it commits within a few frames; 3s caps a no-op push).
		if (navPending()) {
			const t = window.setTimeout(() => setRetry((n) => n + 1), 120);
			return () => window.clearTimeout(t);
		}
		const here = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		const want = withTutorialParams(here, { tier: active, step });
		if (want !== here) writeUrl(want);
	}, [mounted, active, step, pathname, searchParams, retry]);

	// Browser Back/Forward: the URL's step wins (with that step's sample data when going back).
	useEffect(() => {
		const onPop = () => {
			const pos = readTutorialParams(window.location.search);
			const now = currentStep();
			if (!pos || pos.tier !== activeSandbox() || pos.step === now) return;
			if (pos.step < now && pos.step > 0 && restoreStepSnapshot(pos.tier, pos.step)) void mutate(() => true);
			setTourStep(pos.step);
		};
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	}, [mutate]);

	if (!mounted || !active) return null;
	return (
		<AtlasShell product={PRODUCT_NAME[active]} productColor={COLOR[active]} homePath={pathname ?? '/home'} nav={[]} overlay={<WalkthroughCoach />}>
			{children}
		</AtlasShell>
	);
}
