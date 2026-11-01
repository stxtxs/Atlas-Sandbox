'use client';

/** At or below this width the tour panel is a bottom sheet over the page. */
export const SHEET_BREAKPOINT = 1024;

/**
 * Where the visible page ends: the top of the tour's bottom sheet, else the
 * window's bottom. Dropdowns flip up and the spotlight scrolls against this —
 * with `innerHeight` a menu opened downward under the sheet, out of reach.
 */
export function visibleBottom(): number {
	const sheet = window.innerWidth <= SHEET_BREAKPOINT ? document.querySelector('.wt-coach') : null;
	return sheet ? sheet.getBoundingClientRect().top : window.innerHeight;
}
