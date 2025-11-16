import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from '@/lib/analytics';

// Hook to automatically track page views
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    analytics.trackPageView(location.pathname + location.search);
  }, [location]);
};

// Hook to track AI chat session duration
export const useAIChatTracking = (isOpen: boolean) => {
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startTimeRef.current = Date.now();
      analytics.trackAIChatOpened();
    } else if (startTimeRef.current) {
      const duration = Date.now() - startTimeRef.current;
      analytics.trackAIChatClosed(duration);
      startTimeRef.current = null;
    }
  }, [isOpen]);
};

// Re-export analytics for direct use in components
export { analytics };
