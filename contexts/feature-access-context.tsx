'use client';

import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useUserProfile, getUserType, type UserType } from '@/hooks/use-user-profile';

export interface Feature {
  /** A uuid. This was typed `number` and never was one. */
  id: string;
  slug: string;
  name: string;
  /** One flag per tier. No inheritance — a feature lists every tier that has
   *  it, so `feature[userType]` is the whole answer. */
  explore: boolean;
  raise: boolean;
  scout: boolean;
}

export interface FeatureAccessResult {
  hasAccess: boolean;
  isLocked: boolean;
  userType: UserType;
  requiredTier: UserType | null;
  isLoading: boolean;
  /** The feature matrix failed to load (and there's no cached copy). Callers
   *  should offer a retry rather than render a paywall or blank screen. */
  error: boolean;
}

interface FeatureAccessContextType {
  checkAccess: (slug: string) => FeatureAccessResult;
  isLoading: boolean;
  features: Feature[];
  /** Re-fetch the feature matrix (used by the error/retry UI). */
  reload: () => void;
}

const FeatureAccessContext = createContext<FeatureAccessContextType | null>(null);

/**
 * The tutorial has no paywall: every feature is open to the tier being toured,
 * except the few Raise/Scout features Explore hides (EXPLORE_HIDDEN).
 * Same context shape as the app, so the product components stay untouched.
 */
/** Raise/Scout features the Explore tour must not show. Locked UI renders nothing here (no upgrade teaser). */
const EXPLORE_HIDDEN = new Set(['advanced_filters', 'company_contacts']);

export function FeatureAccessProvider({ children }: { children: React.ReactNode }) {
  const { data: profile } = useUserProfile();
  const userType = getUserType(profile);
  const checkAccess = useCallback(
    (slug: string): FeatureAccessResult => {
      const locked = userType === 'explore' && EXPLORE_HIDDEN.has(slug);
      return { hasAccess: !locked, isLocked: locked, userType, requiredTier: locked ? 'raise' : null, isLoading: false, error: false };
    },
    [userType],
  );
  const value = useMemo(() => ({ checkAccess, isLoading: false, features: [] as Feature[], reload: () => {} }), [checkAccess]);
  return <FeatureAccessContext.Provider value={value}>{children}</FeatureAccessContext.Provider>;
}

export function useFeatureAccessContext() {
  const ctx = useContext(FeatureAccessContext);
  if (!ctx) throw new Error('useFeatureAccessContext must be used within FeatureAccessProvider');
  return ctx;
}

export function useFeatureAccess(slug: string): FeatureAccessResult {
  return useFeatureAccessContext().checkAccess(slug);
}
