import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TutorialShell } from '@/components/shell/tutorial-shell';

// Absolute, so the root template doesn't double up; the pages name themselves.
export const metadata: Metadata = { title: { absolute: 'Atlas Tutorial' } };

/** Every product page of the tour renders inside the tutorial frame. */
export default function TutorialLayout({ children }: { children: React.ReactNode }) {
	return (
		<Suspense fallback={null}>
			<TutorialShell>{children}</TutorialShell>
		</Suspense>
	);
}
