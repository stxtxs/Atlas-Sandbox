'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { enterPractice } from '@/components/features/walkthrough/practice-actions';
import type { GatedTier } from '@/components/features/walkthrough/visitor-gate';

const PRODUCTS: GatedTier[] = ['raise', 'scout'];

/**
 * Deep link into one tier's tour (`/preview/raise`, `/preview/scout`), e.g.
 * from the Atlas landing page: straight to the tour screen, which asks for
 * name + email first (VisitorGate in tutorial-shell.tsx). Anything else
 * (incl. the retired Explore tour) goes to the chooser.
 */
export default function Page() {
	const { product } = useParams<{ product: string }>();
	useEffect(() => {
		const tier = PRODUCTS.find((p) => p === product);
		if (tier) enterPractice(tier, { replace: true });
		else window.location.replace('/');
	}, [product]);
	return null;
}
