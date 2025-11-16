# Analytics Setup Guide

## Overview
This application uses Google Analytics 4 (GA4) to track user behavior, feature usage, and engagement metrics. The analytics system is privacy-conscious and GDPR-compliant.

## Setup Instructions

### 1. Create a Google Analytics Account
1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account
3. Click "Admin" (bottom left)
4. Click "Create Account"
5. Follow the setup wizard to create your property

### 2. Get Your Measurement ID
1. In Google Analytics, go to **Admin** → **Data Streams**
2. Click on your web data stream
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)

### 3. Configure in Your App

Add your Measurement ID to the project. You have two options:

**Option A: Direct in Code (Recommended for simplicity)**
Edit `src/components/AnalyticsProvider.tsx` and replace:
```typescript
const GA_MEASUREMENT_ID = 'YOUR_MEASUREMENT_ID_HERE';
```

**Option B: Environment Variable (Recommended for multiple environments)**
1. Add to your build configuration:
   ```
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```
2. The code will automatically pick it up from `import.meta.env.VITE_GA_MEASUREMENT_ID`

### 4. Verify It's Working
1. Open your app in a browser
2. Open browser DevTools → Console
3. Look for the message: `Analytics: Initialized with GA4`
4. In Google Analytics, go to **Reports** → **Realtime** to see live traffic

## What's Being Tracked

### Automatic Tracking
- **Page views**: All route changes
- **User sessions**: Authenticated user IDs and properties
- **Session duration**: Time spent on the app

### Custom Events Tracked

#### Project Management
- `project_created` - When a new project is created
- `project_updated` - When project details are modified
- `project_deleted` - When a project is removed

#### Collaboration
- `member_invited` - When a team member is added
- `member_removed` - When a team member is removed

#### AI Assistant
- `ai_chat_opened` - When AI chat is opened
- `ai_chat_message_sent` - When user sends a message (tracks message length)
- `ai_chat_closed` - When AI chat is closed (tracks session duration)

#### Authentication
- `user_signup` - New account creation
- `user_login` - Successful login
- `user_logout` - User logout

#### Errors
- `error_occurred` - Application errors (for debugging)

## Analytics Dashboard Access

### Key Metrics to Monitor
1. **User Engagement**: Time on site, pages per session
2. **Feature Usage**: Which features are used most
3. **User Flow**: How users navigate through the app
4. **Conversion Funnel**: From signup to project creation
5. **Error Tracking**: Application issues and failures

### Recommended Reports
1. **Realtime**: See live user activity
2. **Engagement** → **Events**: See all custom events
3. **User** → **User Attributes**: See user properties
4. **Tech** → **Tech Details**: Browser, device, OS info

## Privacy Considerations

### Current Configuration
- ✅ IP anonymization enabled
- ✅ No personally identifiable information (PII) sent
- ✅ User IDs are hashed UUIDs (not emails)
- ✅ No cookies for unauthenticated users

### GDPR Compliance
To be fully GDPR compliant, you should:
1. Add a cookie consent banner
2. Allow users to opt-out of analytics
3. Provide a privacy policy
4. Allow users to request data deletion

## Customization

### Adding New Events
Edit `src/lib/analytics.ts` and add a new method:
```typescript
trackCustomEvent(data: any) {
  this.trackEvent({
    action: 'custom_event_name',
    category: 'Category',
    ...data,
  });
}
```

Then use it in your components:
```typescript
import { analytics } from '@/lib/analytics';

analytics.trackCustomEvent({ property: 'value' });
```

### Switching Analytics Providers
The analytics service is abstracted, making it easy to switch providers:
1. Edit `src/lib/analytics.ts`
2. Add new provider initialization in the `initialize()` method
3. Update tracking methods to support the new provider

## Troubleshooting

### Analytics Not Working
1. Check browser console for errors
2. Verify Measurement ID is correct
3. Check if ad-blockers are blocking GA
4. Verify in GA Realtime reports

### Events Not Appearing
1. Events may take 24-48 hours to appear in reports
2. Check **Realtime** reports for immediate feedback
3. Verify event names match GA4 conventions (no spaces, lowercase)

## Advanced Features

### Debug Mode
To see all analytics calls in console:
```typescript
// In AnalyticsProvider.tsx
analytics.initialize(GA_MEASUREMENT_ID, { debug_mode: true });
```

### Custom Dimensions
Set custom user properties:
```typescript
analytics.setUserProperties({
  plan_type: 'pro',
  team_size: '10-50',
});
```

### E-commerce Tracking
For future subscription tracking:
```typescript
analytics.trackEvent({
  action: 'purchase',
  category: 'Ecommerce',
  transaction_id: 'T12345',
  value: 29.99,
  currency: 'USD',
});
```

## Support
- [GA4 Documentation](https://support.google.com/analytics/answer/9304153)
- [GA4 Events Reference](https://developers.google.com/analytics/devguides/collection/ga4/events)
