'use client';

import { createContext } from 'react';

/** The tutorial's one, fictional user. There is no sign-in: the session is always valid. */
export interface AuthSessionState {
	user: { id: string; email: string } | null;
	loading: boolean;
	sessionValid: boolean;
}

const DEMO: AuthSessionState = { user: { id: 'demo-user', email: 'you@example.com' }, loading: false, sessionValid: true };

export const AuthSessionContext = createContext<AuthSessionState>(DEMO);

export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
	return <AuthSessionContext.Provider value={DEMO}>{children}</AuthSessionContext.Provider>;
}
