'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { enterPractice } from '@/components/features/walkthrough/practice-actions';
import type { SandboxProduct } from '@/lib/sandbox/types';

const PRODUCTS: SandboxProduct[] = ['explore', 'raise', 'scout'];

/** Deep link into one tier's tour (`/preview/raise`), e.g. from the landing page. */
export default function Page() {
	const { product } = useParams<{ product: string }>();
	useEffect(() => {
		if (PRODUCTS.includes(product as SandboxProduct)) enterPractice(product as SandboxProduct, { replace: true });
		else window.location.replace('/');
	}, [product]);
	return null;
}
