'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { AtlasLogo } from '@/components/atlas';
import { enterPractice } from '@/components/features/walkthrough/practice-actions';
import { VisitorGate, type GatedTier } from '@/components/features/walkthrough/visitor-gate';
import { hasVisitor } from '@/lib/sandbox/visitor';
import './chooser.css';

const TIERS: { product: GatedTier; name: string; color: string; audience: string; body: string; covers: string[] }[] = [
	{
		product: 'raise', name: 'Raise', color: 'var(--a-blue)', audience: 'For founders',
		body: 'Prepare your round: find investors who fit, track every conversation and size up your market.',
		covers: ['Your raise at a glance', 'Investors matched to your round', 'Your investor pipeline', 'My Market'],
	},
	{
		product: 'scout', name: 'Scout', color: '#0FB86A', audience: 'For investors',
		body: 'Find companies that fit your thesis and track them from first look to decision.',
		covers: ['Companies matched to your thesis', 'Company profiles', 'Watchlists', 'Your pipeline as a board'],
	},
];

/** `#raise` / `#scout` on the chooser's URL picks that tier straight away. */
const tierFromHash = (hash: string): GatedTier | null =>
	hash === '#raise' ? 'raise' : hash === '#scout' ? 'scout' : null;

/**
 * The tutorial's front door: pick Raise or Scout, then a short guided tour runs
 * on sample data. No account, no sign-in, but a name and email first (the
 * VisitorGate), once per browser.
 *
 * Direct links: sandbox.sportstechx.com/#raise and /#scout (or /preview/raise,
 * /preview/scout) skip the choice; the gate still comes first.
 */
export default function ChooserPage() {
	const [pending, setPending] = useState<GatedTier | null>(null);
	const go = (tier: GatedTier) => (hasVisitor() ? enterPractice(tier) : setPending(tier));

	useEffect(() => {
		const fromHash = () => {
			const tier = tierFromHash(window.location.hash);
			if (tier) go(tier);
		};
		fromHash();
		window.addEventListener('hashchange', fromHash);
		return () => window.removeEventListener('hashchange', fromHash);
	}, []);

	return (
		<main className="atlas tut-choose">
			<div className="tut-choose__inner">
				<AtlasLogo height={30} />
				<h1 className="tut-choose__title">Take the guided tour</h1>
				<p className="tut-choose__lead">Pick a plan and we will walk you through it, step by step, on sample data. No account needed.</p>
				<div className="tut-choose__grid">
					{TIERS.map((t) => (
						<button key={t.product} type="button" className="tut-choose__card" onClick={() => go(t.product)}>
							<span className="tut-choose__name"><AtlasLogo height={22} product={t.name} productColor={t.color} /></span>
							<span className="tut-choose__audience">{t.audience}</span>
							<span className="tut-choose__body">{t.body}</span>
							<ul className="tut-choose__covers">
								{t.covers.map((c) => <li key={c}><Check size={13} aria-hidden="true" /> {c}</li>)}
							</ul>
							<span className="tut-choose__go">Start the {t.name} tour <ArrowRight size={13} aria-hidden="true" /></span>
						</button>
					))}
				</div>
				<p className="tut-choose__note">Everything you see in the tour is made-up sample data.</p>
				{pending && <VisitorGate tier={pending} onDone={() => enterPractice(pending)} />}
			</div>
		</main>
	);
}
