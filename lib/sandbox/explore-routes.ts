import { SECTORS, SPORTS } from './fixtures/world';
import type { SandboxCtx, SandboxRoute } from './types';

/**
 * Explore's own sample data: the visitor's interests (components/explore/
 * interests.tsx). Everything else Explore shows is shared (core-routes.ts,
 * shared/catalog-routes.ts, analytics-routes.ts).
 *
 * Starts empty, so Home opens on "Your market view is broad" and the
 * Interests chapter is what makes it personal.
 */
interface Stored { sector_ids: string[]; sport_ids: string[]; geos: string[]; goals: string[] }
const EMPTY: Stored = { sector_ids: [], sport_ids: [], geos: [], goals: [] };
const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

const read = (ctx: SandboxCtx): Stored => ({ ...EMPTY, ...(ctx.state.interests as Partial<Stored> | undefined) });

/** `GET /api/explore/interests` → `{ sectors: Ref[], sports: Ref[], geos, goals }`. */
function out(s: Stored) {
	const ref = (list: { id: string; name: string }[]) => (id: string) => ({ id, name: list.find((x) => x.id === id)?.name ?? null });
	return { sectors: s.sector_ids.map(ref(SECTORS)), sports: s.sport_ids.map(ref(SPORTS)), geos: s.geos, goals: s.goals };
}

export const exploreSandboxRoutes: SandboxRoute[] = [
	['GET', '/api/explore/interests', (ctx) => out(read(ctx))],
	['PUT', '/api/explore/interests', (ctx) => {
		const b = (ctx.body ?? {}) as Record<string, unknown>;
		const next: Stored = { sector_ids: strings(b.sector_ids), sport_ids: strings(b.sport_ids), geos: strings(b.geos), goals: strings(b.goals) };
		ctx.state.interests = next;
		ctx.save();
		return out(next);
	}],
];
