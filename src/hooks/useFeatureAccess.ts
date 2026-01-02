import { useIsAdmin } from './useUserRole';

export type SubscriptionTier = 'free' | 'pro' | 'business';

interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
}

// Define which features are available at each tier
const featureMatrix: Record<string, SubscriptionTier[]> = {
  // Free tier features
  'basic_projects': ['free', 'pro', 'business'],
  'task_management': ['free', 'pro', 'business'],
  'team_collaboration': ['free', 'pro', 'business'],
  'activity_feed': ['free', 'pro', 'business'],
  'calendar_view': ['free', 'pro', 'business'],
  
  // Pro tier features ($29/mo)
  'ai_chat': ['pro', 'business'],
  'ai_insights': ['pro', 'business'],
  'ai_scheduling': ['pro', 'business'],
  'ai_risk_analysis': ['pro', 'business'],
  'sprint_planning': ['pro', 'business'],
  'gantt_chart': ['pro', 'business'],
  'executive_dashboard': ['pro', 'business'],
  'custom_reports': ['pro', 'business'],
  'unlimited_projects': ['pro', 'business'],
  'unlimited_members': ['pro', 'business'],
  
  // Business tier features ($79/mo)
  'client_portal': ['business'],
  'integrations': ['business'],
  'okrs': ['business'],
  'roadmap': ['business'],
  'priority_support': ['business'],
  'sso': ['business'],
  'audit_logs': ['business'],
};

// Free tier limits
const freeTierLimits = {
  maxProjects: 3,
  maxMembersPerProject: 5,
  maxTasksPerProject: 50,
};

export const useFeatureAccess = (featureKey: string): FeatureAccess => {
  const { isAdmin, isLoading } = useIsAdmin();
  
  // Admins bypass all feature gates
  if (isAdmin) {
    return { hasAccess: true };
  }
  
  // TODO: Get actual subscription tier from Stripe
  // For now, default to 'free' tier
  const userTier: SubscriptionTier = 'free';
  
  const allowedTiers = featureMatrix[featureKey];
  
  if (!allowedTiers) {
    // Unknown feature, deny access by default
    return { hasAccess: false, reason: 'Unknown feature' };
  }
  
  const hasAccess = allowedTiers.includes(userTier);
  
  if (!hasAccess) {
    const requiredTier = allowedTiers[0];
    return { 
      hasAccess: false, 
      reason: `This feature requires a ${requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} subscription` 
    };
  }
  
  return { hasAccess: true };
};

export const useCanCreateProject = () => {
  const { isAdmin } = useIsAdmin();
  
  // Admins can create unlimited projects
  if (isAdmin) {
    return { canCreate: true, limit: Infinity };
  }
  
  // TODO: Get actual project count and subscription tier
  const currentProjectCount = 0;
  const userTier: SubscriptionTier = 'free';
  
  if (userTier === 'free') {
    return { 
      canCreate: currentProjectCount < freeTierLimits.maxProjects,
      limit: freeTierLimits.maxProjects,
      current: currentProjectCount,
    };
  }
  
  return { canCreate: true, limit: Infinity };
};

export const getFeatureTierLabel = (featureKey: string): string => {
  const allowedTiers = featureMatrix[featureKey];
  if (!allowedTiers || allowedTiers.includes('free')) return '';
  if (allowedTiers.includes('pro')) return 'Pro';
  return 'Business';
};

export const isProFeature = (featureKey: string): boolean => {
  const allowedTiers = featureMatrix[featureKey];
  return allowedTiers && !allowedTiers.includes('free') && allowedTiers.includes('pro');
};

export const isBusinessFeature = (featureKey: string): boolean => {
  const allowedTiers = featureMatrix[featureKey];
  return allowedTiers && allowedTiers.length === 1 && allowedTiers[0] === 'business';
};
