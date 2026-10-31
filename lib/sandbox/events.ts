/**
 * Tour request event: mockFetch (mock-api.ts) fires it on `window` after every
 * `/api/*` request the visitor's actions send, so the tour
 * coach can advance on `request` steps. Kept apart from mock-api.ts so UI
 * code can listen without importing the route tables.
 */
export const PRACTICE_REQUEST_EVENT = 'stx:practice-request';

export interface PracticeRequestDetail {
	/** Upper-case HTTP method. */
	method: string;
	/** URL pathname, no query. */
	path: string;
	/** Parsed JSON body, when the request sent one. */
	body?: unknown;
}
