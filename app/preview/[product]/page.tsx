'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { enterPractice } from '@/components/features/walkthrough/practice-actions';
import { VisitorGate, type GatedTier } from '@/components/features/walkthrough/visitor-gate';
import { hasVisitor } from '@/lib/sandbox/visitor';
import '../../chooser.css';

const PRODUCTS: GatedTier[] = ['raise', 'scout'];

/**
 * Deep link into one tier's tour (`/preview/raise`, `/preview/scout`), e.g.
 * from the Atlas landing page. The name + email gate comes first unless this
 * browser already sent it. Anything else (incl. the retired Explore tour) goes
 * to the chooser.
 */
export default function Page() {
	const { product } = useParams<{ product: string }>();
	const [gate, setGate] = useState<GatedTier | null>(null);
	useEffect(() => {
		const tier = PRODUCTS.find((p) => p === product);
		if (!tier) return void window.location.replace('/');
		if (hasVisitor()) enterPractice(tier, { replace: true });
		// eslint-disable-next-line react-hooks/set-state-in-effect -- the gate needs localStorage, which only exists after mount
		else setGate(tier);
	}, [product]);
	return (
		<main className="atlas tut-choose">
			{gate && <VisitorGate tier={gate} onDone={() => enterPractice(gate, { replace: true })} />}
		</main>
	);
}
