'use client';

import { ArrowRight, Check } from 'lucide-react';
import { AtlasLogo } from '@/components/atlas';
import { enterPractice } from '@/components/features/walkthrough/practice-actions';
import type { SandboxProduct } from '@/lib/sandbox/types';
import './chooser.css';

const TIERS: { product: SandboxProduct; name: string; color: string; audience: string; body: string; covers: string[] }[] = [
	{
		product: 'explore', name: 'Explore', color: 'var(--a-pink)', audience: 'Free · for everyone in sports tech',
		body: 'Map the sports tech market: companies, reports, events, programs and the numbers behind them.',
		covers: ['Company search and profiles', 'Reports, Framework and Newsletter', 'Market analysis and Roundup', 'Events, Programs and Watchlists'],
	},
	{
		product: 'raise', name: 'Raise', color: 'var(--a-blue)', audience: 'For founders',
		body: 'Prepare your round: sharpen the pitch, find the right investors and run the raise as a pipeline.',
		covers: ['Pitch deck analysis', 'Investor matches and profiles', 'Fundraising pipeline', 'My Market and the Fundraising Guide'],
	},
	{
		product: 'scout', name: 'Scout', color: '#0FB86A', audience: 'For investors',
		body: 'Source deals that fit your thesis, screen decks and track companies from first look to decision.',
		covers: ['Thesis and recommendations', 'Deal Flow and sharing a deal', 'Deck Screener', 'Watchlists as a stage board'],
	},
];

/**
 * The tutorial's front door: pick a tier, then a guided tour runs through
 * every page and flow of it on sample data. No account, no sign-in.
 */
export default function ChooserPage() {
	return (
		<main className="atlas tut-choose">
			<div className="tut-choose__inner">
				<AtlasLogo height={30} />
				<h1 className="tut-choose__title">Take the guided tour</h1>
				<p className="tut-choose__lead">Pick a plan and we will walk you through every page and flow of it, step by step, on sample data. No account needed.</p>
				<div className="tut-choose__grid">
					{TIERS.map((t) => (
						<button key={t.product} type="button" className="tut-choose__card" onClick={() => enterPractice(t.product)}>
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
			</div>
		</main>
	);
}
