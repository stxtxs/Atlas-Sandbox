'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Compass, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AtlasShell } from '@/components/atlas';
import { EXPLORE_COLOR } from '@/components/explore/shell-config';
import { SCOUT_COLOR } from '@/components/scout/shell-config';
import { PRODUCT_NAME } from '@/components/features/walkthrough/tours';
import { leavePractice } from '@/components/features/walkthrough/practice-actions';
import { ATLAS_SIGNUP_URL } from '@/lib/sandbox/signup';
import { usePractice } from '@/lib/sandbox/store';
import type { SandboxProduct } from '@/lib/sandbox/types';
import '@/components/raise/raise.css';
import '@/components/explore/explore.css';
import '@/components/scout/scout.css';
import '@/components/features/walkthrough/walkthrough.css';

const WalkthroughCoach = dynamic(() => import('@/components/features/walkthrough/walkthrough-coach').then((m) => m.WalkthroughCoach), { ssr: false });

const COLOR: Record<SandboxProduct, string | undefined> = { explore: EXPLORE_COLOR, raise: undefined, scout: SCOUT_COLOR };

/**
 * The app frame for the tutorial: the real AtlasShell with no sidebar (the
 * tour does all the navigating), a slim top bar in place of the navbar
 * (which needs a real account) and the tour panel on the right.
 *
 * Client-only: the tier lives in this browser's tutorial state, so there is
 * nothing a server render could show. A visitor with no tour running
 * (e.g. a bookmarked /home) goes back to the tier chooser.
 */
export function TutorialShell({ children }: { children: React.ReactNode }) {
	const { active } = usePractice();
	const pathname = usePathname();
	const { resolvedTheme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);
	// The one render that must differ from the server's: the tier is only known in the browser.
	// eslint-disable-next-line react-hooks/set-state-in-effect
	useEffect(() => setMounted(true), []);
	useEffect(() => { if (mounted && !active) window.location.replace('/'); }, [mounted, active]);
	if (!mounted || !active) return null;
	const name = PRODUCT_NAME[active];

	return (
		<AtlasShell
			product={name}
			productColor={COLOR[active]}
			homePath={pathname ?? '/home'}
			nav={[]}
			topbar={
				<div className="wt-bar" role="status">
					<span className="wt-bar__tag"><Compass size={12} aria-hidden="true" /> Atlas {name} · Tutorial</span>
					<span className="wt-bar__text">A guided tour on sample data. Follow the panel on the right.</span>
					<span className="wt-bar__actions">
						<button type="button" className="wt-bar__btn" aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}>
							{resolvedTheme === 'dark' ? <Sun size={11} aria-hidden="true" /> : <Moon size={11} aria-hidden="true" />}
						</button>
						<a className="wt-bar__btn wt-bar__btn--solid" href={ATLAS_SIGNUP_URL} target="_blank" rel="noopener">Get Atlas {name}</a>
						<button type="button" className="wt-bar__btn" onClick={() => leavePractice()}><LogOut size={11} aria-hidden="true" /> Exit</button>
					</span>
				</div>
			}
			overlay={<WalkthroughCoach />}
		>
			{children}
		</AtlasShell>
	);
}
