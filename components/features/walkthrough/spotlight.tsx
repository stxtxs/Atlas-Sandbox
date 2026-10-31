'use client';

import { useEffect, useRef } from 'react';
import { mergeAdjacent, type TargetBox } from './use-tour-target';

/** How long a step waits for its element to render before offering "Next". */
const FIND_TIMEOUT_MS = 5000;
/** At or below this width the coach is a bottom sheet, so targets scroll to the top half instead of the centre. */
const SHEET_BREAKPOINT = 1024;
/** Breathing room around a highlighted element. */
const PAD = 8;
/** Highlight elements kept in the pool — a step never shows more. */
const POOL = 6;
/** A target closer than this to the viewport edge is scrolled into view. */
const EDGE = 72;

function boxOf(el: Element | null): TargetBox | null {
	if (!el) return null;
	const r = el.getBoundingClientRect();
	if (r.width === 0 && r.height === 0) return null;
	const radius = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 8;
	return { top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2, radius: Math.min(radius + PAD / 2, 22) };
}

/** Whether the element sits comfortably inside the area the visitor can see beside the panel. */
function inView(el: Element): boolean {
	const r = el.getBoundingClientRect();
	const sheet = window.innerWidth <= SHEET_BREAKPOINT;
	const bottom = sheet ? window.innerHeight * 0.4 : window.innerHeight;
	return r.top >= EDGE && r.bottom <= bottom - EDGE / 2;
}

function place(node: HTMLDivElement, b: TargetBox | undefined) {
	if (!b) { node.style.visibility = 'hidden'; return; }
	node.style.visibility = 'visible';
	node.style.transform = `translate3d(${b.left}px, ${b.top}px, 0)`;
	node.style.width = `${b.width}px`;
	node.style.height = `${b.height}px`;
	node.style.setProperty('--wt-r', `${b.radius}px`);
}

/**
 * The step's highlight: a clean outline around each highlighted element, in the
 * tier's colour — no veil over the page, no shadow.
 *
 * Smooth by construction:
 *   - one rAF loop reads the elements every frame and writes positions straight
 *     to the DOM (transform, no CSS transition on position, no React render),
 *     so a highlight sticks to its element through scrolls and reflows instead
 *     of chasing it;
 *   - on a step change the old highlights fade out where they were while the new
 *     ones fade/scale in once found — never a blank blink or a slide across;
 *   - the page is only scrolled when the target isn't comfortably in view.
 *
 * Reports `missing` (no primary element for FIND_TIMEOUT_MS) so the coach can
 * offer Next. Without a primary selector, the first `extra` element leads.
 */
export function Spotlight({ primary, extra, stepKey, merge, onMissing }: {
	primary?: string;
	extra: string[];
	stepKey: string;
	/** Join adjacent boxes into one (orientation highlights). */
	merge: boolean;
	onMissing: (missing: boolean) => void;
}) {
	const live = useRef<(HTMLDivElement | null)[]>([]);
	const ghosts = useRef<(HTMLDivElement | null)[]>([]);
	const missingCb = useRef(onMissing);
	useEffect(() => { missingCb.current = onMissing; }, [onMissing]);
	const extraKey = extra.join('\n');

	useEffect(() => {
		const others = extraKey ? extraKey.split('\n') : [];
		// The previous step's highlights fade out where they were.
		live.current.forEach((n, i) => {
			const g = ghosts.current[i];
			if (!n || !g) return;
			g.style.cssText = n.style.cssText;
			g.classList.remove('is-leaving');
			if (n.style.visibility === 'visible') { void g.offsetWidth; g.classList.add('is-leaving'); }
			n.classList.remove('is-shown');
			n.style.visibility = 'hidden';
		});

		let raf = 0;
		let shown = false;
		let scrolled = false;
		let lastSeen = performance.now();
		let missing = false;
		missingCb.current(false);
		const tick = () => {
			const lead = primary ? document.querySelector(primary) : others.length ? document.querySelector(others[0]) : null;
			const main = boxOf(lead);
			const rest = others.flatMap((sel) => Array.from(document.querySelectorAll(sel)).map(boxOf).filter((b): b is TargetBox => !!b));
			let boxes = primary ? (main ? [main, ...rest] : rest) : rest;
			if (merge) boxes = mergeAdjacent(boxes);
			boxes = boxes.slice(0, POOL);

			if (lead && main && !scrolled) {
				scrolled = true;
				if (!inView(lead)) lead.scrollIntoView({ block: window.innerWidth <= SHEET_BREAKPOINT ? 'start' : 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
			}
			live.current.forEach((n, i) => n && place(n, boxes[i]));
			if (boxes.length && !shown) {
				shown = true;
				live.current.forEach((n) => n?.classList.add('is-shown'));
			}

			const now = performance.now();
			const found = primary ? !!main : rest.length > 0;
			if (found) lastSeen = now;
			const next = !!(primary || others.length) && !found && now - lastSeen > FIND_TIMEOUT_MS;
			if (next !== missing) { missing = next; missingCb.current(next); }
			raf = requestAnimationFrame(tick);
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	}, [primary, extraKey, stepKey, merge]);

	const slots = Array.from({ length: POOL }, (_, i) => i);
	return (
		<div className="wt-spot" aria-hidden="true">
			{slots.map((i) => <div key={`g${i}`} ref={(el) => { ghosts.current[i] = el; }} className="wt-hl wt-hl--ghost"><span /></div>)}
			{slots.map((i) => <div key={`l${i}`} ref={(el) => { live.current[i] = el; }} className="wt-hl"><span /></div>)}
		</div>
	);
}
