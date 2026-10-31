'use client';

import { SWRConfig } from 'swr';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './toast.css';
import { TooltipProvider } from '@/components/ui/tooltip';
import { swrConfig } from '@/lib/query-client';
import { AuthSessionProvider } from '@/contexts/auth-session-context';
import { FeatureAccessProvider } from '@/contexts/feature-access-context';
import { MobileNavProvider } from '@/contexts/mobile-nav-context';
import { ClaimModalHost } from '@/components/claim/claim-modal-host';
import { SetupModalHost } from '@/components/setup/setup-modal-host';
import { ConfirmProvider } from '@/components/ui/confirm-dialog';
import { Suspense } from 'react';

/** The app's providers, minus analytics, credits and the paywall: the tutorial has none of them. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig value={swrConfig}>
      <ThemeProvider attribute="data-theme" defaultTheme="dark" enableSystem={false} disableTransitionOnChange storageKey="stx:theme">
        <TooltipProvider delayDuration={300}>
          <AuthSessionProvider>
            <FeatureAccessProvider>
              <MobileNavProvider>
                <ConfirmProvider>
                  {children}
                  <ClaimModalHost />
                  <Suspense fallback={null}><SetupModalHost /></Suspense>
                  <Toaster position="top-right" theme="dark" closeButton toastOptions={{ unstyled: false }} />
                </ConfirmProvider>
              </MobileNavProvider>
            </FeatureAccessProvider>
          </AuthSessionProvider>
        </TooltipProvider>
      </ThemeProvider>
    </SWRConfig>
  );
}
