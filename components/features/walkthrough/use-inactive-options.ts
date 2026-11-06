'use client';

import { useEffect } from 'react';

/** What counts as one choice in a menu or listbox. */
const OPTION = '.atlas-menu__item, [role="option"]';
/** The menus and listboxes those choices live in. */
const MENU = '.atlas-menu, [role="listbox"]';
const MARK = 'data-wt-inactive';

/**
 * One interactive target per step, visibly too: when a step allows a single
 * option in a menu (Shortlist, Reviewing, Contacted…), every other option in
 * that menu is marked `data-wt-inactive` and styled as unavailable
 * (walkthrough.css). The guard already swallows clicks on them; this stops
 * them looking clickable. Menus open and re-render while the step runs, so
 * the marks follow the DOM.
 */
export function useInactiveOptions(allow: readonly string[] | undefined): void {
	const key = (allow ?? []).join('\n');
	useEffect(() => {
		const selectors = key ? key.split('\n') : [];
		if (!selectors.length) return;
		const isAllowed = (el: Element) => selectors.some((s) => el.matches(s));

		const mark = () => {
			const menus = new Set<Element>();
			for (const s of selectors) {
				document.querySelectorAll(s).forEach((el) => {
					if (!el.matches(OPTION)) return;
					const menu = el.closest(MENU);
					if (menu) menus.add(menu);
				});
			}
			document.querySelectorAll(`[${MARK}]`).forEach((el) => {
				const menu = el.closest(MENU);
				if (!menu || !menus.has(menu) || isAllowed(el)) el.removeAttribute(MARK);
			});
			menus.forEach((menu) => {
				menu.querySelectorAll(OPTION).forEach((el) => {
					if (isAllowed(el)) el.removeAttribute(MARK);
					else if (!el.hasAttribute(MARK)) el.setAttribute(MARK, '');
				});
			});
		};

		mark();
		const observer = new MutationObserver(mark);
		observer.observe(document.body, { childList: true, subtree: true });
		return () => {
			observer.disconnect();
			document.querySelectorAll(`[${MARK}]`).forEach((el) => el.removeAttribute(MARK));
		};
	}, [key]);
}
