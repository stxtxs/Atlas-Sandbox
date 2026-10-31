/** `data-tour` value → CSS selector. Shared by the coach, the spotlight and the advance hook. */
export const tourSelector = (target: string) => `[data-tour="${CSS.escape(target)}"]`;

export interface TargetBox { top: number; left: number; width: number; height: number; radius: number }

/** Boxes closer than this (vertically, while overlapping horizontally) read as one block. */
const MERGE_GAP = 24;

/**
 * Joins boxes that sit next to each other into one — e.g. consecutive sections,
 * which as separate highlights would draw stacked double lines between every pair.
 * Boxes elsewhere on the screen stay separate.
 */
export function mergeAdjacent(boxes: TargetBox[]): TargetBox[] {
	const sorted = [...boxes].sort((a, b) => a.top - b.top);
	return sorted.reduce<TargetBox[]>((out, b) => {
		const last = out[out.length - 1];
		const overlapsX = last && b.left < last.left + last.width && last.left < b.left + b.width;
		if (!last || !overlapsX || b.top - (last.top + last.height) > MERGE_GAP) return [...out, b];
		const left = Math.min(last.left, b.left);
		const right = Math.max(last.left + last.width, b.left + b.width);
		const bottom = Math.max(last.top + last.height, b.top + b.height);
		return [...out.slice(0, -1), { top: last.top, left, width: right - left, height: bottom - last.top, radius: Math.max(last.radius, b.radius) }];
	}, []);
}
