import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { usePageTracking } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

// Configure your Google Analytics 4 Measurement ID here
// Get it from: https://analytics.google.com/
// Format: G-XXXXXXXXXX (this is a publishable key, safe to commit)
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || '';

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  // Initialize analytics on mount
  useEffect(() => {
    if (GA_MEASUREMENT_ID) {
      analytics.initialize(GA_MEASUREMENT_ID);
      window.GA_MEASUREMENT_ID = GA_MEASUREMENT_ID;
    } else {
      console.warn(
        'Analytics: GA_MEASUREMENT_ID not set. Add VITE_GA_MEASUREMENT_ID to your environment or update AnalyticsProvider.tsx'
      );
    }
  }, []);

  // Set user ID when authenticated
  useEffect(() => {
    const setUserAnalytics = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        analytics.setUserId(user.id);
        analytics.setUserProperties({
          user_email: user.email,
          created_at: user.created_at,
        });
      }
    };

    setUserAnalytics();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        analytics.setUserId(session.user.id);
        analytics.setUserProperties({
          user_email: session.user.email,
          created_at: session.user.created_at,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Automatically track page views
  usePageTracking();

  return <>{children}</>;
};
