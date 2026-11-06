'use client';

import { useRef, useState, type FormEvent } from 'react';
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
	const nameRef = useRef<HTMLInputElement>(null);
	const emailRef = useRef<HTMLInputElement>(null);
	const fail = (msg: string, field: 'name' | 'email') => {
		setError(msg);
		(field === 'name' ? nameRef : emailRef).current?.focus();
	};

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (busy) return;
		if (!name.trim()) return fail('Enter your name.', 'name');
		if (!EMAIL.test(email.trim())) return fail('Enter a valid email address.', 'email');
		setError(null);
		setBusy(true);
		const res = await fetch('/api/visitor', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ name: name.trim(), email: email.trim(), tier, website }),
		}).catch(() => null);
		if (res?.status === 400) {
			setBusy(false);
			// After the button re-enables, or focus would land on a disabled control.
			requestAnimationFrame(() => fail('Enter a valid email address.', 'email'));
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
					<Input ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus maxLength={200} aria-invalid={error === 'Enter your name.' || undefined} />
				</Field>
				<Field label="Work email" required>
					<Input ref={emailRef} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={320} aria-invalid={error === 'Enter a valid email address.' || undefined} />
				</Field>
				{/* Honeypot: invisible to people, filled by bots. NOT named "website"
				    (or anything autofill knows): browsers and password managers filled
				    that, and real visitors were silently dropped as bots. */}
				<input
					name="stx_hp" value={website} onChange={(e) => setWebsite(e.target.value)}
					tabIndex={-1} autoComplete="off" aria-hidden
					data-lpignore="true" data-1p-ignore="true" data-bwignore="true" data-form-type="other"
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
