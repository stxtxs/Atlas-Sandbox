'use client';

import { useSyncExternalStore } from 'react';
import type { SandboxProduct } from './types';

/**
 * The tutorial's state, kept in this browser only: which tier is being toured,
 * the current step, and that tier's sample workspace (pipeline moves, saved
 * companies, thesis edits…) for the mock API.
 */
export interface PracticeState {
	/** Tier being toured, or null before one is picked. */
	active: SandboxProduct | null;
	/** Current tour step (index into the tour's flattened steps; === steps.length is the finale). */
	step: number;
}

const KEY = 'stx:tutorial:v3';
const EVENT = 'stx:tutorial';
const PRODUCTS: SandboxProduct[] = ['explore', 'raise', 'scout'];
const EMPTY: PracticeState = { active: null, step: 0 };

function parse(raw: string | null): PracticeState {
	if (!raw) return EMPTY;
	try {
		const v = JSON.parse(raw) as Partial<PracticeState>;
		const active = PRODUCTS.includes(v.active as SandboxProduct) ? (v.active as SandboxProduct) : null;
		const step = Number.isInteger(v.step) && (v.step as number) >= 0 ? (v.step as number) : 0;
		return { active, step };
	} catch { return EMPTY; }
}

function rawState(): string | null {
	if (typeof window === 'undefined') return null;
	try { return localStorage.getItem(KEY); } catch { return null; }
}

const read = (): PracticeState => parse(rawState());

function write(next: PracticeState) {
	try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
	window.dispatchEvent(new Event(EVENT));
}

/** The tier being toured, or null. */
export function activeSandbox(): SandboxProduct | null {
	return read().active;
}

/** Start a tier's tour at its first step, on a fresh sample workspace. */
export function startWalkthrough(product: SandboxProduct) {
	try { localStorage.removeItem(DATA_KEY(product)); } catch { /* storage unavailable */ }
	clearStepSnapshots(product);
	write({ active: product, step: 0 });
}

export function setTourStep(step: number) {
	const s = read();
	if (!s.active) return;
	write({ ...s, step: Math.max(0, Math.floor(step)) });
}

export function exitPractice() {
	write(EMPTY);
}

function subscribe(cb: () => void) {
	window.addEventListener(EVENT, cb);
	window.addEventListener('storage', cb);
	return () => { window.removeEventListener(EVENT, cb); window.removeEventListener('storage', cb); };
}

/** React view of the tutorial state. Re-renders on any change (also from other tabs). */
export function usePractice(): PracticeState {
	const raw = useSyncExternalStore(subscribe, () => rawState() ?? '', () => '');
	return parse(raw || null);
}

/** Per-tier sample workspace for the mock API's write handlers. */
const DATA_KEY = (p: SandboxProduct) => `stx:tutorial:data:${p}`;
export function readSandboxData(p: SandboxProduct): Record<string, unknown> {
	try { return JSON.parse(localStorage.getItem(DATA_KEY(p)) ?? '{}') as Record<string, unknown>; } catch { return {}; }
}
export function writeSandboxData(p: SandboxProduct, data: Record<string, unknown>) {
	try { localStorage.setItem(DATA_KEY(p), JSON.stringify(data)); } catch { /* storage unavailable */ }
}

/*
 * Step snapshots: the sample workspace as it was when each step first opened,
 * so Back (and jumping to an earlier chapter) puts that step's data back too.
 */
const SNAP_KEY = (p: SandboxProduct) => `stx:tutorial:snap:${p}`;
const PATHS_KEY = (p: SandboxProduct) => `stx:tutorial:paths:${p}`;

function readSnapshots(p: SandboxProduct): Record<string, string | null> {
	try { return JSON.parse(sessionStorage.getItem(SNAP_KEY(p)) ?? '{}') as Record<string, string | null>; } catch { return {}; }
}
function clearStepSnapshots(p: SandboxProduct) {
	try { sessionStorage.removeItem(SNAP_KEY(p)); sessionStorage.removeItem(PATHS_KEY(p)); } catch { /* storage unavailable */ }
}

/** Record the workspace as step `step` opens — once; re-entering the step keeps the first one. */
export function saveStepSnapshot(p: SandboxProduct, step: number) {
	const all = readSnapshots(p);
	if (step in all) return;
	try { sessionStorage.setItem(SNAP_KEY(p), JSON.stringify({ ...all, [step]: localStorage.getItem(DATA_KEY(p)) })); } catch { /* storage unavailable */ }
}

/** Put the workspace back to how it was when step `step` opened. False when there is no snapshot. */
export function restoreStepSnapshot(p: SandboxProduct, step: number): boolean {
	const all = readSnapshots(p);
	if (!(step in all)) return false;
	try {
		const data = all[step];
		if (data === null) localStorage.removeItem(DATA_KEY(p));
		else localStorage.setItem(DATA_KEY(p), data);
		// Later snapshots describe a future that no longer happened.
		sessionStorage.setItem(SNAP_KEY(p), JSON.stringify(Object.fromEntries(Object.entries(all).filter(([k]) => Number(k) <= step))));
	} catch { return false; }
	return true;
}

/** Where each step actually ran — the concrete URL behind a `:param` step path, so Back can reopen it. */
export function recordStepPath(p: SandboxProduct, step: number, path: string) {
	try {
		const all = JSON.parse(sessionStorage.getItem(PATHS_KEY(p)) ?? '{}') as Record<string, string>;
		if (all[step] !== path) sessionStorage.setItem(PATHS_KEY(p), JSON.stringify({ ...all, [step]: path }));
	} catch { /* storage unavailable */ }
}
export function stepPath(p: SandboxProduct, step: number): string | null {
	try { return (JSON.parse(sessionStorage.getItem(PATHS_KEY(p)) ?? '{}') as Record<string, string>)[step] ?? null; } catch { return null; }
}
