/**
 * The tutorial sends no analytics. Same exports as the app's Mixpanel wrapper,
 * so the product components that call it stay untouched.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function initAnalytics(): void {}
export function identify(profileId: string, traits?: Record<string, unknown>): void {}
export function reset(): void {}
export function track(event: string, props?: Record<string, unknown>): void {}
export function trackPage(path: string, title?: string): void {}

export const Events = {
	signedIn: 'signed_in',
	signedOut: 'signed_out',
	pageViewed: 'page_viewed',
	companySearched: 'company_searched',
	companyOpened: 'company_opened',
	dealOpened: 'deal_opened',
	investorOpened: 'investor_opened',
	reportOpened: 'report_opened',
	reportDownloaded: 'report_downloaded',
	filterApplied: 'filter_applied',
	savedSearchCreated: 'saved_search_created',
	chatTurnSent: 'chat_turn_sent',
	chatSuggestionUsed: 'chat_suggestion_used',
	chatExported: 'chat_exported',
	billingCheckoutStarted: 'billing_checkout_started',
	billingPortalOpened: 'billing_portal_opened',
} as const;
