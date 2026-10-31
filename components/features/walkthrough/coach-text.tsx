import { Fragment } from 'react';

/** Labels that are keyboard keys, drawn as keycaps; anything else in `{{…}}` is an on-screen control, drawn as a chip. */
const KEYS = new Set(['Enter', 'Esc', 'Escape', 'Tab', 'Shift', 'Space', '⌘K', 'Ctrl K']);

/** Tour copy with `{{Label}}` rendered as a control chip, or a keycap for keys. */
export function CoachText({ text }: { text: string }) {
	const parts = text.split(/\{\{(.+?)\}\}/g);
	return (
		<>
			{parts.map((p, i) => (i % 2 === 0
				? <Fragment key={i}>{p}</Fragment>
				: KEYS.has(p) ? <kbd key={i} className="wt-key">{p}</kbd> : <span key={i} className="wt-chip">{p}</span>))}
		</>
	);
}
