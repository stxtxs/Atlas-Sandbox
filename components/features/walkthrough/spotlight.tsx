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
	// A big target (a whole list) gets the hairline only — a tint over it would wash out the page.
	node.classList.toggle('is-large', b.width * b.height > window.innerWidth * window.innerHeight * 0.3);
}

/**
 * The step's highlight: a light veil over the page with soft cut-outs, and a
 * soft hairline + tint + glow on each highlighted element.
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
export function Spotlight({ primary, extra, stepKey, merge, action, onMissing }: {
	primary?: string;
	extra: string[];
	stepKey: string;
	/** Join adjacent boxes into one (orientation highlights). */
	merge: boolean;
	/** The step waits for the visitor to act: the highlight breathes gently. */
	action: boolean;
	onMissing: (missing: boolean) => void;
}) {
	const live = useRef<(HTMLDivElement | null)[]>([]);
	const ghosts = useRef<(HTMLDivElement | null)[]>([]);
	const holes = useRef<(SVGRectElement | null)[]>([]);
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
		holes.current.forEach((h) => h?.setAttribute('width', '0'));

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
				if (!inView(lead)) lead.scrollIntoView({ block: window.innerWidth <= SHEET_BREAKPOINT ? 'start' : 'center', behavior: 'smooth' });
			}
			live.current.forEach((n, i) => n && place(n, boxes[i]));
			holes.current.forEach((h, i) => {
				const b = boxes[i];
				if (!h) return;
				if (!b) { h.setAttribute('width', '0'); return; }
				h.setAttribute('x', String(b.left)); h.setAttribute('y', String(b.top));
				h.setAttribute('width', String(b.width)); h.setAttribute('height', String(b.height));
				h.setAttribute('rx', String(b.radius));
			});
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
		<div className={`wt-spot${action ? ' wt-spot--action' : ''}`} aria-hidden="true">
			<svg className="wt-veil" width="100%" height="100%">
				<defs>
					<mask id="wt-veil-mask">
						<rect width="100%" height="100%" fill="white" />
						{slots.map((i) => <rect key={i} ref={(el) => { holes.current[i] = el; }} width="0" height="0" fill="black" />)}
					</mask>
				</defs>
				<rect className="wt-veil__fill" width="100%" height="100%" mask="url(#wt-veil-mask)" />
			</svg>
			{slots.map((i) => <div key={`g${i}`} ref={(el) => { ghosts.current[i] = el; }} className="wt-hl wt-hl--ghost"><span /></div>)}
			{slots.map((i) => <div key={`l${i}`} ref={(el) => { live.current[i] = el; }} className="wt-hl"><span /></div>)}
		</div>
	);
}
