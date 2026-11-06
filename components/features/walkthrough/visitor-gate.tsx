'use client';

import { useState, type FormEvent } from 'react';
import { Button, Field, Input } from '@/components/atlas';
import { Modal } from '@/components/atlas/patterns/modal';
import { rememberVisitor } from '@/lib/sandbox/visitor';

export type GatedTier = 'raise' | 'scout';

const TIER_NAME: Record<GatedTier, string> = { raise: 'Atlas Raise', scout: 'Atlas Scout' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Name + email before a tour starts. It cannot be dismissed (no close button,
 * Escape and outside clicks do nothing): the only way on is to submit.
 *
 * Saved through this site's /api/visitor (forwarded to the platform API). If
 * the platform can't be reached the visitor still gets into the tour, but the
 * browser is not marked as done, so the details are asked for again next time
 * rather than silently lost.
 */
export function VisitorGate({ tier, onDone }: { tier: GatedTier; onDone: () => void }) {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [website, setWebsite] = useState('');
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (busy) return;
		if (!name.trim()) return setError('Enter your name.');
		if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.');
		setError(null);
		setBusy(true);
		const res = await fetch('/api/visitor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), email: email.trim(), tier, website }),
		}).catch(() => null);
		if (res?.status === 400) {
			setBusy(false);
			setError('Enter a valid email address.');
			return;
		}
		if (res?.ok) rememberVisitor();
		onDone();
	};

	return (
		<Modal open onOpenChange={() => { /* not dismissible: submit to continue */ }} title={`Start the ${TIER_NAME[tier]} tour`} width={460}>
			<form onSubmit={(e) => void submit(e)} noValidate style={{ display: 'grid', gap: 14 }}>
				<p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--a-muted)' }}>
					A short guided tour on sample data. Tell us who you are to begin.
				</p>
				<Field label="Name" required>
					<Input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus maxLength={200} />
				</Field>
				<Field label="Work email" required>
					<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={320} />
				</Field>
				{/* Honeypot: invisible to people, filled by bots. */}
				<input
					name="website" value={website} onChange={(e) => setWebsite(e.target.value)}
					tabIndex={-1} autoComplete="off" aria-hidden
					style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }}
				/>
				{error && <p role="alert" style={{ margin: 0, fontSize: 13, color: 'var(--a-danger, #e5484d)' }}>{error}</p>}
				<Button type="submit" variant="primary" disabled={busy}>{busy ? 'Starting…' : 'Start the tour'}</Button>
				<p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: 'var(--a-faint)' }}>
					SportsTechX may contact you about Atlas. See our{' '}
					<a href="https://www.sportstechx.com/privacy-policy" target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Privacy Policy</a>.
				</p>
			</form>
		</Modal>
	);
}
