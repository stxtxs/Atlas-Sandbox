'use client';

import { useEffect, useRef } from 'react';
import { matchPath } from '@/lib/sandbox/match-path';
import { PRACTICE_REQUEST_EVENT, type PracticeRequestDetail } from '@/lib/sandbox/events';
import type { TourStep } from '@/lib/sandbox/tour-types';
import { tourSelector } from './use-tour-target';

/**
 * Wires a step's `advance` condition to `onDone`:
 *   - click   — a click (or change, for selects) on or inside the target, or
 *               inside `on` when given; `simulate` swallows the click so the
 *               app never acts on it;
 *   - request — a practice request matching method + pattern (lib/sandbox/events.ts),
 *               and carrying `body`'s values when given;
 *   - path    — the pathname matches the pattern, after having not matched
 *               (so going Back onto a page that already matches doesn't skip ahead);
 *   - type    — the target field (or a field inside it) holds the step's text;
 *   - next    — nothing here; the coach's Next button.
 * A `click` step with `dropOn` also completes on a drop there (drag or pick,
 * either way the same move).
 */
export function useTourAdvance(step: TourStep | null, pathname: string, onDone: () => void) {
	const done = useRef(onDone);
	useEffect(() => { done.current = onDone; }, [onDone]);

	const adv = step?.advance;
	const target = step?.target;

	// click
	const clickOn = adv?.kind === 'click' ? adv.on ?? (target ? tourSelector(target) : null) : null;
	const simulate = adv?.kind === 'click' && !!adv.simulate;
	useEffect(() => {
		if (!clickOn) return;
		const selector = clickOn;
		const onEvent = (e: Event) => {
			const el = e.target instanceof Element ? e.target : null;
			// A <select>'s 'click' just opens the native dropdown — it fires before a
			// value is actually picked. Wait for 'change' there so the step doesn't
			// advance while the step's own instruction ("pick X") isn't done yet.
			if (e.type === 'click' && el?.tagName === 'SELECT') return;
			if (!el?.closest(selector)) return;
			// The target can be a real link whose destination is sample data, not the
			// tour's own script (e.g. Raise home's "attention" card — whatever's most
			// urgent in the sample pipeline, not necessarily the deck). The coach's own
			// effect is about to navigate to the next step's page; letting this link's
			// navigation fire too is a race it can win, stranding the step on the wrong
			// page. Only the coach drives navigation once a step has advanced.
			const link = el.closest('a');
			if (e.type === 'click' && link) e.preventDefault();
			// A simulated action (e.g. Request introduction) never reaches the app:
			// no modal, no request — the next step shows what would happen.
			if (simulate) { e.preventDefault(); e.stopImmediatePropagation(); }
			// After the app has handled this click: advancing now (capture phase)
			// would arm the next step's `request` listener in time to catch the
			// request this very click sends (e.g. a wizard's per-step save).
			window.setTimeout(() => done.current(), 0);
		};
		document.addEventListener('click', onEvent, true);
		document.addEventListener('change', onEvent, true);
		return () => {
			document.removeEventListener('click', onEvent, true);
			document.removeEventListener('change', onEvent, true);
		};
	}, [clickOn, simulate]);

	// drop — the drag-and-drop route of a click step
	const dropOn = adv?.kind === 'click' ? step?.dropOn ?? null : null;
	useEffect(() => {
		if (!dropOn) return;
		const onDrop = (e: Event) => {
			if (e.target instanceof Element && e.target.closest(dropOn)) done.current();
		};
		document.addEventListener('drop', onDrop, true);
		return () => document.removeEventListener('drop', onDrop, true);
	}, [dropOn]);

	// request
	const reqMethod = adv?.kind === 'request' ? adv.method.toUpperCase() : null;
	const reqPattern = adv?.kind === 'request' ? adv.pattern : null;
	const reqBody = adv?.kind === 'request' && adv.body ? JSON.stringify(adv.body) : null;
	useEffect(() => {
		if (!reqMethod || !reqPattern) return;
		const want = reqBody ? (JSON.parse(reqBody) as Record<string, unknown>) : null;
		const onRequest = (e: Event) => {
			const d = (e as CustomEvent<PracticeRequestDetail>).detail;
			if (!d || d.method.toUpperCase() !== reqMethod || !matchPath(reqPattern, d.path)) return;
			const sent = d.body && typeof d.body === 'object' ? (d.body as Record<string, unknown>) : {};
			if (want && Object.entries(want).some(([k, v]) => sent[k] !== v)) return;
			done.current();
		};
		window.addEventListener(PRACTICE_REQUEST_EVENT, onRequest);
		return () => window.removeEventListener(PRACTICE_REQUEST_EVENT, onRequest);
	}, [reqMethod, reqPattern, reqBody]);

	// type — the target field holds the step's text
	const typeWant = adv?.kind === 'type' ? adv.value.trim().toLowerCase() : null;
	const typeOn = adv?.kind === 'type' && target ? tourSelector(target) : null;
	useEffect(() => {
		if (!typeWant || !typeOn) return;
		const onInput = (e: Event) => {
			const el = e.target;
			if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) || !el.closest(typeOn)) return;
			if (el.value.trim().toLowerCase() === typeWant) done.current();
		};
		document.addEventListener('input', onInput, true);
		return () => document.removeEventListener('input', onInput, true);
	}, [typeWant, typeOn]);

	// path
	const pathPattern = adv?.kind === 'path' ? adv.pattern : null;
	const armed = useRef<{ id: string; armed: boolean }>({ id: '', armed: false });
	const stepId = step?.id ?? '';
	useEffect(() => {
		if (!pathPattern) return;
		if (armed.current.id !== stepId) armed.current = { id: stepId, armed: false };
		if (!matchPath(pathPattern, pathname)) { armed.current.armed = true; return; }
		if (armed.current.armed) done.current();
	}, [pathPattern, pathname, stepId]);
}
