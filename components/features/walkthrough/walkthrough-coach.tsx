'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { useTheme } from 'next-themes';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ChevronDown, ListOrdered, LogOut, Moon, MousePointerClick, RotateCcw, Shuffle, Sun } from 'lucide-react';
import { currentStep, recordStepPath, restoreStepSnapshot, saveStepSnapshot, setTourStep, stepPath, usePractice } from '@/lib/sandbox/store';
import { matchPath } from '@/lib/sandbox/match-path';
import { ATLAS_SIGNUP_URL } from '@/lib/sandbox/signup';
import { reportTour } from '@/lib/sandbox/visitor';
import { flatIndexOf, urlStepOf, withTutorialParams } from '@/lib/sandbox/tutorial-url';
import { afterNavigation } from '@/lib/sandbox/nav-pending';
import type { Tour, TourStep } from '@/lib/sandbox/tour-types';
import type { SandboxProduct } from '@/lib/sandbox/types';
import { CoachText } from './coach-text';
import { leavePractice, restartPractice } from './practice-actions';
import { Spotlight } from './spotlight';
import { PRODUCT_NAME, TOURS, flatten } from './tours';
import { useTourAdvance } from './use-tour-advance';
import { TOUR_ESCAPE, useTourGuard } from './use-tour-guard';
import { tourSelector } from './use-tour-target';
import './walkthrough.css';

const NO_SELECTORS: string[] = [];
/** Highlight accent per tier — the product colours (Explore pink, Raise blue, Scout green). */
const ACCENT: Record<SandboxProduct, string> = { explore: '#F32163', raise: '#348DDE', scout: '#0FB86A' };

const hasParams = (path: string) => /\/:/.test(path);
/** A step the app's own layout leaves nothing to point at on this screen (see TourStep.minWidth). */
const tooNarrow = (s: TourStep) => !!s.minWidth && window.innerWidth < s.minWidth;

/**
 * Close any drawer or modal the app has open (export, company/event/program
 * drawers, the pipeline drawer, the intro request), by clicking its own close
 * control — the guard lets these programmatic clicks through. Used before Back,
 * a Contents jump and opening Contents, so the step you land on is never stuck
 * under an overlay from a later step.
 */
const OVERLAY_CLOSERS = ['.export-modal__x', '.co-drawer-head .icon-btn[title="Close"]', '.pipe-drawer [aria-label="Close"]', '.scout-dd-modal__x', '.setup-modal__x', '.ma-panel [aria-label="Close"]'];
function closeOverlays() {
	for (const sel of OVERLAY_CLOSERS) document.querySelector<HTMLElement>(sel)?.click();
}

function isTyping(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false;
	return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * The tour panel (Kondo-style): a dark column on the right with one big
 * headline, the action to take as the visual focus, and at most a line of
 * context. Mounted by TutorialShell.
 *
 * Welcome → chapters of steps → finale. `step` is the URL's number
 * (lib/sandbox/tutorial-url.ts): 0 welcome, 1…N steps, N+1 finale. Each step
 * opens on its page, softly highlights its element (spotlight.tsx), lets only
 * that element be used (use-tour-guard.ts) and waits for its advance
 * condition. Back reopens the previous step with the sample data as it was;
 * Contents jumps to any chapter. A chapter's first step must have a concrete
 * path (no `:param`), so a jump can always open it.
 */
export function WalkthroughCoach() {
	const { active, step } = usePractice();
	const tour = active && TOURS[active];
	if (!active || !tour) return null;
	return <Coach product={active} tour={tour} step={step} />;
}

function Coach({ product, tour, step }: { product: SandboxProduct; tour: Tour; step: number }) {
	const router = useRouter();
	const { mutate } = useSWRConfig();
	const pathname = usePathname() ?? '';
	const { steps, chapterOf, chapterStart } = flatten(tour);
	const [contents, setContents] = useState(false);
	// Which step's target went missing — tied to the step, so a new step never inherits it.
	const [missingFor, setMissingFor] = useState('');
	const count = steps.length;
	const showIntro = step <= 0;
	const isFinale = step > count;
	const index = flatIndexOf(step);
	const current: TourStep | null = showIntro || isFinale ? null : steps[index];
	const stepKey = current ? `${step}:${current.id}` : showIntro ? 'intro' : 'finale';
	// Reaching the finale = this tier's tour completed (kept per visitor, first time).
	useEffect(() => { if (isFinale) reportTour(product, 'completed'); }, [isFinale, product]);
	const missing = missingFor === stepKey;
	const onMissing = useCallback((m: boolean) => setMissingFor(m ? stepKey : ''), [stepKey]);
	const chapter = current ? chapterOf[index] : -1;
	const chapterSteps = chapter >= 0 ? tour.chapters[chapter].steps.length : 0;
	const inChapter = chapter >= 0 ? index - chapterStart[chapter] + 1 : 0;

	// Where each step actually ran, so Back can reopen a `:param` page.
	useEffect(() => {
		if (current && matchPath(current.path, pathname)) recordStepPath(product, step, pathname);
	}, [current, pathname, step, product]);

	// Open the step's page once per step — with the tour position already in the URL.
	const navigatedFor = useRef('');
	useEffect(() => {
		if (!current || tooNarrow(current) || navigatedFor.current === stepKey) return;
		navigatedFor.current = stepKey;
		// The address bar, not usePathname(): after browser Back/Forward the hook still holds the old page for a render.
		const here = window.location.pathname;
		if (matchPath(current.path, here) || (current.alsoOn && matchPath(current.alsoOn, here))) return;
		const dest = hasParams(current.path) ? stepPath(product, step) : current.path;
		if (dest) router.push(withTutorialParams(dest, { tier: product, step }));
	}, [current, stepKey, step, pathname, router, product]);

	// A step this screen is too narrow for moves straight on (Back skips it too).
	useEffect(() => {
		if (current && tooNarrow(current)) return afterNavigation(() => { if (currentStep() === step) setTourStep(step + 1); });
	}, [current, step]);

	// Read-only view of the open step, for automated walkthroughs of the tours.
	useEffect(() => {
		const w = window as unknown as { __atlasTour?: unknown };
		w.__atlasTour = { step, count, current };
		return () => { delete w.__atlasTour; };
	}, [step, count, current]);

	// A typing step puts the cursor in its field, so the visitor can just type.
	useEffect(() => {
		if (current?.advance.kind !== 'type') return;
		const scope = current.only ?? (current.target ? tourSelector(current.target) : null);
		if (!scope) return;
		let tries = 0;
		const timer = window.setInterval(() => {
			const root = document.querySelector(scope);
			const field = root?.matches('input, textarea') ? root : root?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])');
			if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement) {
				window.clearInterval(timer);
				if (document.activeElement === field) return;
				field.focus({ preventScroll: true });
				// Text left from earlier (e.g. after Back) is selected, so typing replaces it.
				if (field.value) field.select();
			} else if (++tries > 50) window.clearInterval(timer);
		}, 100);
		return () => window.clearInterval(timer);
	}, [current, stepKey]);

	// The workspace as this step found it, for Back.
	useEffect(() => {
		if (current) saveStepSnapshot(product, step);
	}, [current, product, step]);

	// A reading step (`next`) only highlights: its links and buttons stay dead
	// unless the step names what may be used (`only`).
	const usable = current?.only ?? (current?.target && current.advance.kind !== 'next' ? tourSelector(current.target) : null);
	const allowed = current ? [...(usable ? [usable] : []), ...(current.allow ?? [])] : NO_SELECTORS;
	useTourGuard(allowed, !!current?.pointerOnly, current?.dropOn, current?.dragFrom);

	// A menu left open by an earlier step (Add filter, Sort…) that this step doesn't
	// use is closed — the way a click elsewhere would — so it never covers what
	// comes next. Menus this step works in stay open.
	const allowedKey = allowed.join('\n');
	useEffect(() => {
		if (!current) return;
		const keep = [...(allowedKey ? allowedKey.split('\n') : []), ...(current.advance.kind === 'click' && current.advance.on ? [current.advance.on] : [])];
		const timer = window.setTimeout(() => {
			const menus = Array.from(document.querySelectorAll<HTMLElement>('.atlas-menu'));
			const used = menus.find((m) => keep.some((sel) => m.matches(sel) || m.querySelector(sel)));
			// A step that works inside a menu whose content hasn't rendered yet: leave the menus alone.
			if (!used && keep.some((sel) => sel.includes('atlas-menu') || sel.includes('atlas-wl'))) return;
			if (menus.some((m) => m !== used)) (used ?? document.body).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
		}, 0);
		return () => window.clearTimeout(timer);
	}, [stepKey, current, allowedKey]);

	// A field still focused from an earlier (typing) step would swallow this step's keys, Enter for Next included:
	// focus moves to the new headline instead, which also brings a screen reader to the new step.
	useEffect(() => {
		if (!current || current.advance.kind === 'type') return;
		const el = document.activeElement;
		if (!(el instanceof HTMLElement) || !isTyping(el) || allowedKey.split('\n').some((sel) => sel && el.closest(sel))) return;
		document.querySelector<HTMLElement>('.wt-coach .wt-coach__title')?.focus({ preventScroll: true });
	}, [stepKey, current, allowedKey]);

	// A step with no target leads with its first allowed element, so it can still be "missing".
	const primarySel = current?.target ? tourSelector(current.target) : current?.allow?.[0];
	const extra = current ? [...(current.highlights ?? []).map(tourSelector), ...(current.allow ?? []).filter((s) => s !== primarySel)] : NO_SELECTORS;

	const goTo = useCallback((to: number) => {
		setContents(false);
		closeOverlays();
		// Going back: put the sample data as that step found it, then refetch everything on screen.
		if (to < step && to > 0 && restoreStepSnapshot(product, to)) void mutate(() => true);
		setTourStep(to);
	}, [step, product, mutate]);

	// One pending pause at a time, dropped if the step changes first (Back,
	// Skip chapter, Contents) — otherwise it would advance from a step already left.
	const pauseTimer = useRef<number | null>(null);
	useEffect(() => () => {
		if (pauseTimer.current !== null) window.clearTimeout(pauseTimer.current);
		pauseTimer.current = null;
	}, [stepKey]);
	const advance = useCallback(() => {
		if (!current || pauseTimer.current !== null) return;
		// The step moves on — Contents (if open) must not hide what comes next.
		// Never while a navigation the visitor's click started is in flight (a
		// drawer opening via the URL): an update now would make Next drop it.
		const go = () => afterNavigation(() => { if (currentStep() !== step) return; setContents(false); setTourStep(step + 1); });
		if (!current.pause) { go(); return; }
		pauseTimer.current = window.setTimeout(() => { pauseTimer.current = null; go(); }, current.pause);
	}, [current, step]);
	useTourAdvance(current, pathname, advance);

	const back = useCallback(() => {
		if (showIntro || isFinale) return;
		// Back lands on the start of the previous numbered step: the second half
		// of a two-part step (`continues`) needs the first half's result on screen.
		// It also skips `:param` steps never visited in this tab (e.g. after a
		// Contents jump): there is no page to reopen for them.
		let prev = index - 1;
		while (prev > 0 && (steps[prev].continues || tooNarrow(steps[prev]) || (hasParams(steps[prev].path) && !stepPath(product, urlStepOf(prev))))) prev -= 1;
		goTo(prev < 0 ? 0 : urlStepOf(prev));
	}, [showIntro, isFinale, index, steps, goTo, product]);

	const adv = current?.advance.kind;
	const canNext = !!current && (adv === 'next' || missing);
	const start = useCallback(() => setTourStep(1), []);
	const primaryAction = useCallback(() => {
		if (showIntro) start();
		else if (canNext) advance();
	}, [showIntro, canNext, advance, start]);
	const closeContents = useCallback(() => setContents(false), []);
	// With Contents open, Escape closes it and Enter does nothing.
	useCoachKeys(contents ? closeContents : back, primaryAction, !contents && (showIntro || canNext));

	// The panel takes real screen width on the right — the app gets the rest.
	useEffect(() => {
		document.body.classList.add('wt-coach-open', 'wt-coach-open--right');
		return () => document.body.classList.remove('wt-coach-open', 'wt-coach-open--right');
	}, []);

	// As a bottom sheet (phones, tablets) its live height is what app overlays leave room for.
	const panel = useRef<HTMLElement>(null);
	useEffect(() => {
		const el = panel.current;
		if (!el) return;
		const root = document.documentElement;
		const ro = new ResizeObserver(() => root.style.setProperty('--wt-sheet-h', `${el.offsetHeight}px`));
		ro.observe(el);
		return () => { ro.disconnect(); root.style.removeProperty('--wt-sheet-h'); };
	}, []);

	const label = PRODUCT_NAME[product];
	const done = (c: number) => (chapterStart[c + 1] ?? count) < step;
	const soft = showIntro || isFinale || contents;
	// Welcome, contents and finale: the app column goes softly out of focus (as Kondo).
	useEffect(() => {
		document.body.classList.toggle('wt-soft-open', soft);
		return () => document.body.classList.remove('wt-soft-open');
	}, [soft]);

	return (
		<div style={{ '--wt-accent': ACCENT[product] } as React.CSSProperties}>
			{soft ? <div className="wt-soft" aria-hidden="true" /> : current && (
				<Spotlight primary={primarySel} action={current.only} extra={extra} stepKey={stepKey} merge={!!current.highlights} onMissing={onMissing} />
			)}
			{current?.confirm && (
				<div className="wt-confirm">
					<div className="wt-confirm__card" role="status" aria-live="polite">
						<CheckCircle2 className="wt-confirm__icon" size={28} aria-hidden="true" />
						<h2 className="wt-confirm__title">{current.confirm.title}</h2>
						<p className="wt-confirm__text">{current.confirm.body}</p>
						<button type="button" className="wt-btn wt-btn--dark" onClick={advance}>{current.cta ?? 'Continue'} <ArrowRight size={15} aria-hidden="true" /></button>
					</div>
				</div>
			)}

			<aside ref={panel} className="wt-coach" aria-label={`Atlas ${label} tutorial`}>
				<header className="wt-coach__top">
					{current ? (
						<div className="wt-coach__progress">
							<span className="wt-coach__chapter-label">{tour.chapters[chapter].title} · {inChapter} of {chapterSteps}</span>
							<span className="wt-coach__track" aria-hidden="true"><span style={{ width: `${(step / count) * 100}%` }} /></span>
						</div>
					) : <span className="wt-coach__brand">Atlas {label} · Tutorial</span>}
					{!isFinale && !showIntro && (
						<button type="button" className="wt-coach__contents-btn" aria-expanded={contents} onClick={() => { if (!contents) closeOverlays(); setContents((v) => !v); }}>
							<ListOrdered size={14} aria-hidden="true" /> Contents
						</button>
					)}
				</header>

				<div className="wt-coach__main">
					{contents ? (
						<>
							<h2 className="wt-coach__title">Contents</h2>
							<ol className="wt-coach__chapters">
								{tour.chapters.map((c, i) => (
									<li key={c.id}>
										<button type="button" className={`wt-coach__chapter${i === chapter ? ' is-current' : ''}`} onClick={() => goTo(urlStepOf(chapterStart[i]))}>
											<span className="wt-coach__chapter-n">{done(i) ? <Check size={13} aria-label="done" /> : i + 1}</span>
											<span>{c.title}</span>
										</button>
									</li>
								))}
							</ol>
							<button type="button" className="wt-link" onClick={closeContents}><ArrowLeft size={14} aria-hidden="true" /> Back to the tour</button>
						</>
					) : showIntro ? (
						<>
							<h2 className="wt-coach__title wt-coach__title--hero">{tour.intro.title}</h2>
							<p className="wt-coach__lead"><CoachText text={tour.intro.body} /></p>
							{tour.intro.points && <Points points={tour.intro.points} open />}
							<p className="wt-coach__hint">{tour.chapters.length} short chapters on sample data. No account needed.</p>
							<button type="button" className="wt-keycap" onClick={start} title="Start the tour">Enter</button>
						</>
					) : isFinale ? (
						<>
							<h2 className="wt-coach__title wt-coach__title--hero">{tour.finale.title}</h2>
							{tour.finale.body.split('\n\n').map((p) => <p key={p} className="wt-coach__lead"><CoachText text={p} /></p>)}
							<div className="wt-coach__stack">
								<a className="wt-btn wt-btn--primary" href={ATLAS_SIGNUP_URL} target="_blank" rel="noopener">Get Atlas {label} <ArrowRight size={15} aria-hidden="true" /></a>
								<button type="button" className="wt-btn wt-btn--ghost" onClick={() => restartPractice()}><RotateCcw size={14} aria-hidden="true" /> Replay this tour</button>
								<button type="button" className="wt-btn wt-btn--ghost" onClick={() => leavePractice()}><Shuffle size={14} aria-hidden="true" /> Try another plan</button>
							</div>
						</>
					) : current && (
						<>
							{/* Only the headline and the action are announced — not the whole panel each step. */}
							<div className="wt-coach__focus" aria-live="polite">
								<h2 className="wt-coach__title" tabIndex={-1}>{current.title}</h2>
								<ActionCue step={current} onNext={advance} canNext={canNext && !current.confirm} />
							</div>
							{current.body && <p className="wt-coach__info"><CoachText text={current.body} /></p>}
							{current.points && <Points points={current.points} />}
							{missing && adv !== 'next' && <p className="wt-coach__hint">Can&apos;t spot it on this page? Carry on with Next.</p>}
						</>
					)}
				</div>

				{current && !contents && (
					<nav className="wt-coach__nav" aria-label="Tour">
						<button type="button" className="wt-link" onClick={back}><ArrowLeft size={14} aria-hidden="true" /> Back</button>
						<button type="button" className="wt-link" onClick={() => goTo(urlStepOf(chapterStart[chapter + 1] ?? count))}>Skip chapter</button>
					</nav>
				)}

				<footer className="wt-coach__foot">
					<ThemeButton />
					<button type="button" className="wt-icon" onClick={() => leavePractice()} aria-label="Exit the tutorial" title="Exit"><LogOut size={15} aria-hidden="true" /></button>
					<a className="wt-coach__signup" href={ATLAS_SIGNUP_URL} target="_blank" rel="noopener">Get Atlas {label} <ArrowRight size={14} aria-hidden="true" /></a>
				</footer>
			</aside>
		</div>
	);
}

/**
 * What to do now — the panel's focus. A `type` step shows the exact text as a
 * big keycap; an action step its instruction with the control as a chip; a
 * reading step a big Next button.
 */
function ActionCue({ step, onNext, canNext }: { step: TourStep; onNext: () => void; canNext: boolean }) {
	const adv = step.advance;
	return (
		<div className="wt-cue">
			{step.do && (
				<p className="wt-cue__do">
					{adv.kind !== 'type' && adv.kind !== 'next' && <MousePointerClick size={18} className="wt-cue__icon" aria-hidden="true" />}
					<span><CoachText text={step.do} /></span>
				</p>
			)}
			{adv.kind === 'type' && (
				<div className="wt-cue__type">
					<span className="wt-cue__label">Type</span>
					<kbd className="wt-cue__value">{adv.value}</kbd>
				</div>
			)}
			{canNext && (
				<div className="wt-cue__next">
					<button type="button" className="wt-btn wt-btn--primary" onClick={onNext}>{step.cta ?? 'Next'} <ArrowRight size={15} aria-hidden="true" /></button>
					<span className="wt-cue__or">or press <kbd className="wt-key">Enter</kbd></span>
				</div>
			)}
		</div>
	);
}

function Points({ points, open }: { points: { label: string; text: string }[]; open?: boolean }) {
	const list = (
		<dl className="wt-coach__points">
			{points.map((p) => <div key={p.label}><dt>{p.label}</dt><dd>{p.text}</dd></div>)}
		</dl>
	);
	if (open) return list;
	return (
		<details className="wt-more">
			<summary>More about this <ChevronDown size={14} aria-hidden="true" /></summary>
			{list}
		</details>
	);
}

function ThemeButton() {
	const { resolvedTheme, setTheme } = useTheme();
	const dark = resolvedTheme === 'dark';
	return (
		<button type="button" className="wt-icon" onClick={() => setTheme(dark ? 'light' : 'dark')} aria-label={dark ? 'Switch the app to light mode' : 'Switch the app to dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>
			{dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
		</button>
	);
}

/** Escape = Back, Enter = the primary action — never while typing, on a focused control, or under another dialog. */
function useCoachKeys(back: () => void, primary: () => void, enterEnabled: boolean) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;
			if (isTyping(e.target) || document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
			if (e.key === 'Escape') { e.preventDefault(); back(); return; }
			if (e.key !== 'Enter' || !enterEnabled) return;
			if (e.target instanceof HTMLElement && /^(BUTTON|A|SUMMARY)$/.test(e.target.tagName)) return;
			e.preventDefault();
			primary();
		};
		// An Escape the guard took from the page (focus on the page, not the panel).
		const onTourEscape = () => { if (!document.querySelector('[role="dialog"], [role="alertdialog"]')) back(); };
		window.addEventListener('keydown', onKey);
		window.addEventListener(TOUR_ESCAPE, onTourEscape);
		return () => { window.removeEventListener('keydown', onKey); window.removeEventListener(TOUR_ESCAPE, onTourEscape); };
	}, [back, primary, enterEnabled]);
}
