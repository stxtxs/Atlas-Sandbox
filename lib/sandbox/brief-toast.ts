'use client';

import { toast } from 'sonner';

/** How long a watchlist confirmation stays up. */
const BRIEF_MS = 3000;

/**
 * A success toast that is gone after ~3s, whatever the page is doing.
 *
 * Sonner pauses its timer while the pointer rests on the toaster or the window
 * is unfocused, and during the tour the visitor's pointer often sits there: the
 * "Added to … watchlist" toast then stayed up for three or four steps and
 * covered the investor card's edit panel. The forced dismiss closes it anyway.
 */
export function briefToast(message: string): void {
	const id = toast.success(message, { duration: BRIEF_MS });
	window.setTimeout(() => toast.dismiss(id), BRIEF_MS);
}
