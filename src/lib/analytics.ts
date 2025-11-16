// Analytics service supporting multiple providers
// Currently configured for Google Analytics 4 (GA4)

type AnalyticsProvider = 'ga4' | 'none';

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

class Analytics {
  private provider: AnalyticsProvider = 'none';
  private initialized = false;

  initialize(measurementId?: string) {
    if (!measurementId) {
      console.warn('Analytics: No measurement ID provided');
      return;
    }

    this.provider = 'ga4';

    // Load Google Analytics 4
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll manually track page views
    });

    this.initialized = true;
    console.log('Analytics: Initialized with GA4');
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.initialized) return;

    if (this.provider === 'ga4') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title || document.title,
      });
    }

    console.log('Analytics: Page view tracked', { path, title });
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.initialized) return;

    const { action, category, label, value, ...customParams } = event;

    if (this.provider === 'ga4') {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customParams,
      });
    }

    console.log('Analytics: Event tracked', event);
  }

  // Convenience methods for common events
  trackProjectCreated(projectId: string, projectName: string) {
    this.trackEvent({
      action: 'project_created',
      category: 'Project',
      label: projectName,
      project_id: projectId,
    });
  }

  trackProjectUpdated(projectId: string, updates: string[]) {
    this.trackEvent({
      action: 'project_updated',
      category: 'Project',
      project_id: projectId,
      updated_fields: updates.join(','),
    });
  }

  trackProjectDeleted(projectId: string) {
    this.trackEvent({
      action: 'project_deleted',
      category: 'Project',
      project_id: projectId,
    });
  }

  trackMemberInvited(projectId: string, role: string) {
    this.trackEvent({
      action: 'member_invited',
      category: 'Collaboration',
      project_id: projectId,
      member_role: role,
    });
  }

  trackMemberRemoved(projectId: string) {
    this.trackEvent({
      action: 'member_removed',
      category: 'Collaboration',
      project_id: projectId,
    });
  }

  trackAIChatOpened() {
    this.trackEvent({
      action: 'ai_chat_opened',
      category: 'AI',
    });
  }

  trackAIChatMessageSent(messageLength: number) {
    this.trackEvent({
      action: 'ai_chat_message_sent',
      category: 'AI',
      value: messageLength,
    });
  }

  trackAIChatClosed(duration: number) {
    this.trackEvent({
      action: 'ai_chat_closed',
      category: 'AI',
      value: Math.round(duration / 1000), // Convert to seconds
    });
  }

  trackUserLogin(method: 'email' | 'google' | 'github') {
    this.trackEvent({
      action: 'user_login',
      category: 'Authentication',
      label: method,
    });
  }

  trackUserSignup(method: 'email' | 'google' | 'github') {
    this.trackEvent({
      action: 'user_signup',
      category: 'Authentication',
      label: method,
    });
  }

  trackUserLogout() {
    this.trackEvent({
      action: 'user_logout',
      category: 'Authentication',
    });
  }

  trackSearch(query: string, resultsCount: number) {
    this.trackEvent({
      action: 'search',
      category: 'Search',
      label: query,
      value: resultsCount,
    });
  }

  trackError(error: string, context?: string) {
    this.trackEvent({
      action: 'error_occurred',
      category: 'Error',
      label: error,
      error_context: context,
    });
  }

  // Set user properties
  setUserId(userId: string) {
    if (!this.initialized) return;

    if (this.provider === 'ga4') {
      window.gtag('config', window.GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  }

  setUserProperties(properties: Record<string, any>) {
    if (!this.initialized) return;

    if (this.provider === 'ga4') {
      window.gtag('set', 'user_properties', properties);
    }
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Type declarations for gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    GA_MEASUREMENT_ID: string;
  }
}
