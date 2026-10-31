/**
 * The Atlas tutorial — one guided tour per tier, in chapters (one per page or flow).
 *
 * A tour runs on the real app pages with sample data (mock-api.ts). It is
 * guided and controlled, not a sandbox: while a step is open only its target
 * (plus any `allow`ed popover it opens) can be clicked or typed into — the
 * coach's guard swallows everything else. Each step tells the visitor exactly
 * what to do in the tour panel on the right (click this, type that) and
 * completes when its `advance` condition is met. After the last chapter the
 * visitor gets the completion screen: sign up, replay, or try another tier.
 */
import type { SandboxProduct } from './types';

export type TourAdvance =
	/** A button in the coach panel (reading steps); its label is the step's `cta`, else "Next". */
	| { kind: 'next' }
	/**
	 * The user clicks the highlighted element (`target`), or — with `on` — an
	 * element matching that CSS selector (e.g. one option in the popover the
	 * target opens). `simulate` swallows the click, so the app never acts on it:
	 * the next step shows what would have happened instead.
	 */
	| { kind: 'click'; on?: string; simulate?: boolean }
	/**
	 * The app sends a request matching method + path pattern (`:param` segments),
	 * e.g. a watchlist save — and, with `body`, whose JSON body carries these
	 * values (a pipeline move only counts when it moves to the right stage).
	 */
	| { kind: 'request'; method: string; pattern: string; body?: Record<string, string | number | boolean> }
	/** The user lands on a page whose pathname matches the pattern (`:param` segments), e.g. a profile. */
	| { kind: 'path'; pattern: string }
	/**
	 * The user types `value` into the target field (case-insensitive, trimmed).
	 * The panel shows the text to type; the field is the only thing that takes input.
	 */
	| { kind: 'type'; value: string };

export interface TourStep {
	/** Stable id, used for analytics: `walkthrough:<product>:<id>`. */
	id: string;
	/**
	 * Page the step happens on. The engine navigates here when the step opens
	 * (skipped if already there). Prefer concrete paths: a `:param` path can only
	 * be reached by the previous step's own navigation, or Back from a later step.
	 */
	path: string;
	/** `data-tour` value of the element to highlight and leave interactive; omit for a page-level step. */
	target?: string;
	/**
	 * CSS selector for the part of the target that can be used, when the
	 * target is bigger than the action — e.g. a whole card highlighted, but only
	 * its "View profile" link clickable. Default: the whole target.
	 */
	only?: string;
	/** More `data-tour` values to highlight for orientation only — never interactive. */
	highlights?: string[];
	/**
	 * CSS selectors that stay interactive besides the target — the popover or
	 * menu the target opens, narrowed to the one choice the step wants. Each is
	 * also highlighted once it is on screen.
	 */
	allow?: string[];
	/**
	 * What may be dragged (CSS selector) when that is bigger than what may be
	 * clicked — e.g. a whole board card, while only its stage menu takes clicks.
	 */
	dragFrom?: string;
	/**
	 * Where the target may be dropped, when it is dragged (CSS selector). On a
	 * `click` step, a drop there completes the step too. Every
	 * other drop zone refuses it. Without this, drops only land inside allowed elements.
	 */
	dropOn?: string;
	/** Block keyboard input on the target too (e.g. a select whose arrow keys could pick a stage the step forbids). */
	pointerOnly?: boolean;
	/** Short headline, at most 7 words — the biggest text in the panel. */
	title: string;
	/**
	 * What to do now: one imperative line, at most 14 words, shown as the
	 * panel's action. `{{Label}}` renders as a button-like chip (the control to
	 * click) or keycap (`{{Enter}}`). Optional on `type` steps (the coach shows
	 * the value to type) and on reading (`next`) steps.
	 */
	do?: string;
	/** Optional context, one sentence of at most 22 words, shown muted under the action. */
	body?: string;
	/** Labelled points, collapsed behind "More about this". */
	points?: { label: string; text: string }[];
	/** Label for the panel's advance button on `next` steps (default "Next"). */
	cta?: string;
	advance: TourAdvance;
	/** Milliseconds to hold on the page once the step is done, so its result is seen before the tour moves on. */
	pause?: number;
	/** The second interaction of the previous numbered step: shares its step number. */
	continues?: boolean;
	/** A simulated confirmation, shown as a card over the page instead of a real action. */
	confirm?: { title: string; body: string };
}

/** One page or flow of a tour. The contents menu jumps between chapters. */
export interface TourChapter {
	id: string;
	title: string;
	steps: TourStep[];
}

export interface Tour {
	product: SandboxProduct;
	/** The welcome screen. Who the visitor is in this run. */
	intro: { title: string; body: string; points?: { label: string; text: string }[] };
	chapters: TourChapter[];
	/** The completion screen: sign up, replay or another tier — no free exploring after it. */
	finale: { title: string; body: string };
}
