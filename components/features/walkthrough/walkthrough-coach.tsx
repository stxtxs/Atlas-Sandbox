'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Compass, Keyboard, LifeBuoy, ListOrdered, RotateCcw, Shuffle } from 'lucide-react';
import { Button } from '@/components/atlas';
import { recordStepPath, restoreStepSnapshot, saveStepSnapshot, setTourStep, stepPath, usePractice } from '@/lib/sandbox/store';
import { matchPath } from '@/lib/sandbox/match-path';
import { ATLAS_SIGNUP_URL } from '@/lib/sandbox/signup';
import type { Tour, TourStep } from '@/lib/sandbox/tour-types';
import type { SandboxProduct } from '@/lib/sandbox/types';
import { CoachText } from './coach-text';
import { leavePractice, restartPractice } from './practice-actions';
import { PRODUCT_NAME, TOURS, flatten } from './tours';
import { useTourAdvance } from './use-tour-advance';
import { useTourGuard } from './use-tour-guard';
import { mergeAdjacent, tourSelector, useTourTargets, type TargetBox } from './use-tour-target';
import './walkthrough.css';

const HELP_HREF = 'mailto:hello@sportstechx.com?subject=Atlas%20tutorial%20question';
const SPOTLIGHT_PAD = 6;
const NO_SELECTORS: string[] = [];

const hasParams = (path: string) => /\/:/.test(path);

function isTyping(el: EventTarget | null): boolean {
	if (!(el instanceof HTMLElement)) return false;
	return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/**
 * The tour panel: the guided, controlled tutorial over the real app
 * (lib/sandbox/tours), docked on the right. Mounted by TutorialShell.
 *
 * Welcome → chapters of steps → completion. Each step opens on its page, dims
 * the rest of the screen around its highlighted element, lets only that
 * element be used (use-tour-guard.ts) and waits for its advance condition —
 * a click, a typed value, a request or a page. Back reopens the previous
 * step with the sample data as it was then; Contents jumps to any chapter.
 * A chapter's first step must have a concrete path (no `:param`), so a jump
 * can always open it.
 */
export function WalkthroughCoach() {
	const { active, step } = usePractice();
	if (!active) return null;
	return <Coach product={active} tour={TOURS[active]} step={step} />;
}

function Coach({ product, tour, step }: { product: SandboxProduct; tour: Tour; step: number }) {
	const router = useRouter();
	const { mutate } = useSWRConfig();
	const pathname = usePathname() ?? '';
	const { steps, chapterOf, chapterStart } = flatten(tour);
	const [introDone, setIntroDone] = useState(step > 0);
	const [contents, setContents] = useState(false);
	const count = steps.length;
	const showIntro = step === 0 && !introDone;
	const isFinale = step >= count;
	const current: TourStep | null = showIntro || isFinale ? null : steps[step];
	const stepKey = current ? `${step}:${current.id}` : showIntro ? 'intro' : 'finale';
	const chapter = current ? chapterOf[step] : -1;
	const chapterSteps = chapter >= 0 ? tour.chapters[chapter].steps.length : 0;
	const inChapter = chapter >= 0 ? step - chapterStart[chapter] + 1 : 0;

	// Where each step actually ran, so Back can reopen a `:param` page.
	useEffect(() => {
		if (current && matchPath(current.path, pathname)) recordStepPath(product, step, pathname);
	}, [current, pathname, step, product]);

	// Open the step's page once per step.
	const navigatedFor = useRef('');
	useEffect(() => {
		if (!current || navigatedFor.current === stepKey) return;
		navigatedFor.current = stepKey;
		if (matchPath(current.path, pathname)) return;
		const dest = hasParams(current.path) ? stepPath(product, step) : current.path;
		if (dest) router.push(dest);
	}, [current, stepKey, step, pathname, router, product]);

	// The workspace as this step found it, for Back.
	useEffect(() => {
		if (current) saveStepSnapshot(product, step);
	}, [current, product, step]);

	const usable = current?.only ?? (current?.target ? tourSelector(current.target) : null);
	const allowed = current ? [...(usable ? [usable] : []), ...(current.allow ?? [])] : NO_SELECTORS;
	useTourGuard(allowed, !!current?.pointerOnly, current?.dropOn, current?.dragFrom);

	const highlightSelectors = (current?.highlights ?? []).map(tourSelector);
	const extra = current ? [...highlightSelectors, ...(current.allow ?? [])] : NO_SELECTORS;
	const { boxes: found, missing } = useTourTargets(current?.target ? tourSelector(current.target) : undefined, extra, stepKey);
	const boxes = current?.highlights ? mergeAdjacent(found) : found;

	const goTo = useCallback((to: number) => {
		setContents(false);
		setIntroDone(true);
		// Going back: put the sample data as that step found it, then refetch everything on screen.
		if (to < step && restoreStepSnapshot(product, to)) void mutate(() => true);
		setTourStep(to);
	}, [step, product, mutate]);

	const advance = useCallback(() => {
		if (!current) return;
		if (current.pause) window.setTimeout(() => setTourStep(step + 1), current.pause);
		else setTourStep(step + 1);
	}, [current, step]);
	useTourAdvance(current, pathname, advance);

	const back = useCallback(() => {
		if (showIntro || isFinale) return;
		if (step === 0) { setIntroDone(false); return; }
		// Back lands on the start of the previous numbered step: the second half
		// of a two-part step (`continues`) needs the first half's result on screen.
		let prev = step - 1;
		while (prev > 0 && steps[prev].continues) prev -= 1;
		goTo(prev);
	}, [showIntro, isFinale, step, steps, goTo]);

	const adv = current?.advance.kind;
	const canNext = !!current && (adv === 'next' || missing);
	const nextLabel = current?.cta ?? 'Next';
	const primaryAction = useCallback(() => {
		if (showIntro) setIntroDone(true);
		else if (canNext) advance();
	}, [showIntro, canNext, advance]);

	useCoachKeys(back, primaryAction, showIntro || canNext);

	// The panel takes real screen width on the right — the app gets the rest.
	useEffect(() => {
		document.body.classList.add('wt-coach-open', 'wt-coach-open--right');
		return () => document.body.classList.remove('wt-coach-open', 'wt-coach-open--right');
	}, []);

	const label = PRODUCT_NAME[product];
	const done = (c: number) => (chapterStart[c + 1] ?? count) <= step;

	return (
		<>
			<Dim boxes={boxes} />
			{boxes.map((b, i) => <Ring key={i} box={b} />)}
			{current?.confirm && (
				<div className="wt-confirm wt-confirm--right">
					<div className="wt-confirm__card" role="status" aria-live="polite">
						<CheckCircle2 className="wt-confirm__icon" size={28} aria-hidden="true" />
						<h2 className="wt-confirm__title">{current.confirm.title}</h2>
						<p className="wt-confirm__text">{current.confirm.body}</p>
						<Button size="sm" onClick={advance}>{nextLabel} <ArrowRight size={13} aria-hidden="true" /></Button>
					</div>
				</div>
			)}
			<aside className="wt-coach wt-coach--right" aria-label={`Atlas ${label} tutorial`}>
				<div className="wt-coach__eyebrow">
					<span><Compass size={12} aria-hidden="true" /> Atlas {label} tutorial</span>
					{!isFinale && (
						<button type="button" className="wt-coach__contents-btn" aria-expanded={contents} onClick={() => setContents((v) => !v)}>
							<ListOrdered size={12} aria-hidden="true" /> Contents
						</button>
					)}
				</div>
				{contents ? (
					<div className="wt-coach__body">
						<h2 className="wt-coach__title">Contents</h2>
						<p className="wt-coach__note">Jump to any chapter.</p>
						<ol className="wt-coach__chapters">
							{tour.chapters.map((c, i) => (
								<li key={c.id}>
									<button type="button" className={`wt-coach__chapter${i === chapter ? ' is-current' : ''}`} onClick={() => goTo(chapterStart[i])}>
										<span className="wt-coach__chapter-n">{done(i) ? <Check size={12} aria-label="done" /> : i + 1}</span>
										<span>{c.title}</span>
									</button>
								</li>
							))}
						</ol>
						<div className="wt-coach__actions">
							<Button variant="ghost" size="sm" onClick={() => setContents(false)}><ArrowLeft size={13} aria-hidden="true" /> Back to the tour</Button>
						</div>
					</div>
				) : showIntro ? (
					<div className="wt-coach__body" aria-live="polite">
						<h2 className="wt-coach__title wt-coach__title--big">{tour.intro.title}</h2>
						<p className="wt-coach__text"><CoachText text={tour.intro.body} /></p>
						{tour.intro.points && <Points points={tour.intro.points} />}
						<p className="wt-coach__note">{tour.chapters.length} short chapters, all on sample data. No account needed.</p>
						<div className="wt-coach__actions">
							<Button size="sm" onClick={() => setIntroDone(true)}>Start the tour <ArrowRight size={13} aria-hidden="true" /></Button>
						</div>
					</div>
				) : isFinale ? (
					<div className="wt-coach__body" aria-live="polite">
						<h2 className="wt-coach__title wt-coach__title--big">{tour.finale.title}</h2>
						{tour.finale.body.split('\n\n').map((p) => <p key={p} className="wt-coach__text"><CoachText text={p} /></p>)}
						<div className="wt-coach__stack">
							<a className="wt-coach__cta" href={ATLAS_SIGNUP_URL} target="_blank" rel="noopener">Get Atlas {label} <ArrowRight size={13} aria-hidden="true" /></a>
							<Button variant="outline" size="sm" onClick={() => restartPractice()}><RotateCcw size={13} aria-hidden="true" /> Replay this tour</Button>
							<Button variant="ghost" size="sm" onClick={() => leavePractice()}><Shuffle size={13} aria-hidden="true" /> Try another tier</Button>
						</div>
					</div>
				) : current && (
					<div className="wt-coach__body" aria-live="polite">
						<div className="wt-coach__progress">
							<span>Chapter {chapter + 1} of {tour.chapters.length} · {tour.chapters[chapter].title}</span>
							<span className="wt-coach__track" aria-hidden="true"><span style={{ width: `${((step + 1) / count) * 100}%` }} /></span>
							<span>Step {inChapter} of {chapterSteps}</span>
						</div>
						<h2 className="wt-coach__title wt-coach__title--big">{current.title}</h2>
						<p className="wt-coach__text wt-coach__text--lead"><CoachText text={current.body} /></p>
						{current.advance.kind === 'type' && (
							<p className="wt-coach__type"><Keyboard size={14} aria-hidden="true" /> Type <kbd>{current.advance.value}</kbd></p>
						)}
						{current.points && <Points points={current.points} />}
						{missing && <p className="wt-coach__note">Can&apos;t spot it on this page? Carry on with Next.</p>}
						<div className="wt-coach__actions">
							<Button variant="ghost" size="sm" onClick={back}><ArrowLeft size={13} aria-hidden="true" /> Back</Button>
							<Button variant="ghost" size="sm" onClick={() => goTo(chapterStart[chapter + 1] ?? count)}>Skip chapter</Button>
							{/* A confirmation carries its own button on the card. */}
							{canNext && !current.confirm && <Button size="sm" onClick={advance}>{nextLabel} <ArrowRight size={13} aria-hidden="true" /></Button>}
						</div>
					</div>
				)}
				<a className="wt-coach__help" href={HELP_HREF}><LifeBuoy size={12} aria-hidden="true" /> Need a hand?</a>
			</aside>
		</>
	);
}

function Points({ points }: { points: { label: string; text: string }[] }) {
	return (
		<dl className="wt-coach__points">
			{points.map((p) => (
				<div key={p.label}><dt>{p.label}</dt><dd>{p.text}</dd></div>
			))}
		</dl>
	);
}

/** The dimmed screen, with a clear cut-out around every highlighted element. Never catches clicks — the guard decides those. */
function Dim({ boxes }: { boxes: TargetBox[] }) {
	return (
		<svg className="wt-dim" aria-hidden="true" width="100%" height="100%">
			<defs>
				<mask id="wt-dim-mask">
					<rect width="100%" height="100%" fill="white" />
					{boxes.map((b, i) => (
						<rect
							key={i} rx={8} fill="black"
							x={b.left - SPOTLIGHT_PAD} y={b.top - SPOTLIGHT_PAD}
							width={b.width + SPOTLIGHT_PAD * 2} height={b.height + SPOTLIGHT_PAD * 2}
						/>
					))}
				</mask>
			</defs>
			<rect className="wt-dim__fill" width="100%" height="100%" mask="url(#wt-dim-mask)" />
		</svg>
	);
}

/** Border and soft glow around one highlighted element. */
function Ring({ box }: { box: TargetBox }) {
	return (
		<div
			className="wt-ring"
			aria-hidden="true"
			style={{
				top: box.top - SPOTLIGHT_PAD, left: box.left - SPOTLIGHT_PAD,
				width: box.width + SPOTLIGHT_PAD * 2, height: box.height + SPOTLIGHT_PAD * 2,
			}}
		/>
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
			if (e.target instanceof HTMLElement && /^(BUTTON|A)$/.test(e.target.tagName)) return;
			e.preventDefault();
			primary();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [back, primary, enterEnabled]);
}
