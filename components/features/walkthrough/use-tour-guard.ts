'use client';

import { useEffect } from 'react';

/**
 * Always usable during the tour: the tour panel (incl. Get Atlas X, theme and
 * Exit in its footer) and the simulated confirmation card.
 */
const ALWAYS = ['.wt-coach', '.wt-confirm'];

// Not touchstart: cancelling it would stop touch scrolling, and the tap's click is caught anyway.
const POINTER_EVENTS = ['pointerdown', 'mousedown', 'mouseup', 'click', 'dblclick', 'auxclick', 'contextmenu', 'dragstart'] as const;
/** Moving focus and dismissing stay possible; they can't trigger anything on their own. */
const FREE_KEYS = new Set(['Tab', 'Escape', 'Shift']);
/** The pointer events that pick something up — everything a drag needs, nothing that clicks. */
const DRAG_EVENTS = new Set(['pointerdown', 'mousedown', 'mouseup', 'dragstart']);

function within(el: EventTarget | null, selectors: string[]): boolean {
	return el instanceof Element && selectors.some((s) => !!el.closest(s));
}

/**
 * The tutorial is a guided demo, not a sandbox: while it runs, only the current
 * step's own elements (`allowed` — its target and whatever popover option it
 * permits) and the coach's controls react. Every other click, tap, key press
 * and form submit is swallowed before the app sees it — capture phase on
 * `window`, the first listener on the path, so React's own handlers (attached
 * at the root) never run.
 *
 * Keys aimed at the page itself (`body`) pass, so the coach's Enter/Escape
 * shortcuts keep working; `pointerOnly` blocks keys on the allowed elements
 * too, for a control whose keyboard could make a choice the step forbids.
 * `dragFrom` can be dragged without being clickable. Drags can only be dropped on `dropOn` (or, without it, inside the allowed
 * elements). Scrolling is never blocked — reading the page is part of the demo.
 */
export function useTourGuard(allowed: string[], pointerOnly: boolean, dropOn?: string, dragFrom?: string) {
	const allowedKey = allowed.join('\n');

	useEffect(() => {
		const pointerOk = [...ALWAYS, ...(allowedKey ? allowedKey.split('\n') : [])];
		const dropOk = dropOn ? [dropOn] : pointerOk;
		const keysOk = pointerOnly ? ALWAYS : pointerOk;
		const swallow = (e: Event) => { e.preventDefault(); e.stopImmediatePropagation(); };

		// `dragFrom` can be picked up (press + drag) but not clicked — its links stay dead.
		const dragOk = dragFrom ? [dragFrom] : [];
		const onPointer = (e: Event) => {
			// The app's own programmatic clicks (an export's or a download's
			// `a.click()`) aren't the visitor acting — let them through.
			if (!e.isTrusted) return;
			if (within(e.target, pointerOk)) return;
			if (DRAG_EVENTS.has(e.type) && within(e.target, dragOk)) return;
			swallow(e);
		};
		const onKey = (e: KeyboardEvent) => {
			if (FREE_KEYS.has(e.key) || e.target === document.body || e.target === document.documentElement) return;
			if (!within(e.target, keysOk)) swallow(e);
		};
		// A form submits when the step allows its button (or the form itself);
		// any other submit — Enter in some other field — is swallowed.
		const onSubmit = (e: Event) => {
			const submitter = (e as SubmitEvent).submitter ?? null;
			if (!within(submitter, pointerOk) && !within(e.target, pointerOk)) swallow(e);
		};
		// A refused drop zone must not even look droppable: stopping its dragover
		// (without preventDefault) leaves the browser's "no drop" default in place.
		const onDragOver = (e: Event) => { if (!within(e.target, dropOk)) e.stopImmediatePropagation(); };
		const onDrop = (e: Event) => { if (!within(e.target, dropOk)) swallow(e); };
		// A field that grabs focus on its own (autoFocus) mustn't take typing either.
		const onFocus = (e: FocusEvent) => {
			const el = e.target;
			if (el instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) && !within(el, keysOk)) el.blur();
		};

		const opts = { capture: true, passive: false } as const;
		POINTER_EVENTS.forEach((t) => window.addEventListener(t, onPointer, opts));
		window.addEventListener('keydown', onKey, opts);
		window.addEventListener('submit', onSubmit, opts);
		window.addEventListener('focusin', onFocus, true);
		window.addEventListener('dragenter', onDragOver, opts);
		window.addEventListener('dragover', onDragOver, opts);
		window.addEventListener('drop', onDrop, opts);
		return () => {
			POINTER_EVENTS.forEach((t) => window.removeEventListener(t, onPointer, opts));
			window.removeEventListener('keydown', onKey, opts);
			window.removeEventListener('submit', onSubmit, opts);
			window.removeEventListener('focusin', onFocus, true);
			window.removeEventListener('dragenter', onDragOver, opts);
			window.removeEventListener('dragover', onDragOver, opts);
			window.removeEventListener('drop', onDrop, opts);
		};
	}, [allowedKey, pointerOnly, dropOn, dragFrom]);
}
