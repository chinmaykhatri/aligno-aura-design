import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 emails per minute per IP
const MAX_REQUESTS_PER_EMAIL = 5; // Max 5 emails per minute to same recipient

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         req.headers.get("x-real-ip") || 
         "unknown";
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) rateLimitStore.delete(k);
    }
  }

  if (!record || record.resetTime < now) {
    // New window
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

type NotificationType = "status_change" | "member_invitation" | "progress_milestone" | "activity_digest" | "scheduling_applied" | "executive_report" | "member_joined" | "access_request" | "access_request_approved" | "access_request_denied";

interface NotificationRequest {
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, unknown>;
}

// HTML escape to prevent XSS in emails
function escapeHtml(str: string): string {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
    return map[c] || c;
  });
}

// Simple email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && email.length <= 255 && emailRegex.test(email);
}

// Validate notification request
function validateRequest(req: unknown): { valid: true; data: NotificationRequest } | { valid: false; error: string } {
  if (!req || typeof req !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }

  const { type, recipientEmail, recipientName, data } = req as Record<string, unknown>;

  const validTypes: NotificationType[] = ['status_change', 'member_invitation', 'progress_milestone', 'activity_digest', 'scheduling_applied', 'executive_report', 'member_joined', 'access_request', 'access_request_approved', 'access_request_denied'];
  if (!type || !validTypes.includes(type as NotificationType)) {
    return { valid: false, error: 'Invalid notification type' };
  }

  if (!recipientEmail || !isValidEmail(recipientEmail as string)) {
    return { valid: false, error: 'Invalid recipient email address' };
  }

  if (recipientName !== undefined && (typeof recipientName !== 'string' || recipientName.length > 100)) {
    return { valid: false, error: 'Invalid recipient name' };
  }

  if (!data || typeof data !== 'object' || JSON.stringify(data).length > 5000) {
    return { valid: false, error: 'Invalid or too large data payload' };
  }

  return {
    valid: true,
    data: {
      type: type as NotificationType,
      recipientEmail: recipientEmail as string,
      recipientName: recipientName as string | undefined,
      data: data as Record<string, unknown>,
    },
  };
}

const getEmailContent = (type: NotificationType, data: Record<string, unknown>, recipientName?: string) => {
  const name = escapeHtml(recipientName || "there");
  
  switch (type) {
    case "status_change":
      return {
        subject: `Project Status Updated: ${escapeHtml(String(data.projectName || ''))}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Project Status Changed</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">The status of <strong>${escapeHtml(String(data.projectName || ''))}</strong> has been updated.</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: white; margin: 0; font-size: 14px;">Previous Status</p>
              <p style="color: white; margin: 5px 0 15px; font-size: 18px; font-weight: bold;">${escapeHtml(String(data.oldStatus || ''))}</p>
              <p style="color: white; margin: 0; font-size: 14px;">New Status</p>
              <p style="color: white; margin: 5px 0 0; font-size: 18px; font-weight: bold;">${escapeHtml(String(data.newStatus || ''))}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Updated by: ${escapeHtml(String(data.updatedBy || "Team member"))}</p>
          </div>
        `,
      };

    case "member_invitation":
      const inviteLink = data.inviteLink ? String(data.inviteLink) : '';
      return {
        subject: `🎉 You're invited to join ${escapeHtml(String(data.projectName || ''))} on Aligno`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header with logo -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Aligno</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Work Intelligence Platform</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">You're Invited! 🎉</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${escapeHtml(String(data.invitedBy || "A team member"))}</strong> has invited you to join 
                <strong>${escapeHtml(String(data.projectName || 'a project'))}</strong> as a <strong>${escapeHtml(String(data.role || 'member'))}</strong>.
              </p>
              
              ${data.projectDescription ? `
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
                <p style="color: #4a4a4a; margin: 0; font-size: 14px; line-height: 1.6;">${escapeHtml(String(data.projectDescription))}</p>
              </div>
              ` : ''}
              
              <!-- CTA Button -->
              ${inviteLink ? `
              <div style="text-align: center; margin: 30px 0;">
                <a href="${escapeHtml(inviteLink)}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Accept Invitation
                </a>
              </div>
              <p style="color: #888; font-size: 12px; text-align: center; margin: 20px 0 0;">
                Or copy this link: <a href="${escapeHtml(inviteLink)}" style="color: #667eea;">${escapeHtml(inviteLink)}</a>
              </p>
              ` : `
              <div style="background: #f0f0f0; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                <p style="color: #4a4a4a; margin: 0; font-size: 14px;">Log in to Aligno to accept this invitation.</p>
              </div>
              `}
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                This invitation was sent by Aligno. If you didn't expect this email, you can safely ignore it.
              </p>
            </div>
          </div>
        `,
      };

    case "member_joined":
      return {
        subject: `👋 ${escapeHtml(String(data.memberName || 'Someone'))} joined ${escapeHtml(String(data.projectName || 'your project'))}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Aligno</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">New Team Member</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">New Member Alert! 👋</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Great news! <strong>${escapeHtml(String(data.memberName || 'A new member'))}</strong> 
                ${data.memberEmail ? `(${escapeHtml(String(data.memberEmail))})` : ''} 
                has joined <strong>${escapeHtml(String(data.projectName || 'your project'))}</strong> as a <strong>${escapeHtml(String(data.role || 'member'))}</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="color: white; margin: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Joined via</p>
                <p style="color: white; margin: 10px 0 0; font-size: 18px; font-weight: bold;">${escapeHtml(String(data.joinMethod || 'Invitation'))}</p>
              </div>
              
              <p style="color: #4a4a4a; font-size: 14px; line-height: 1.6;">
                Your team is growing! You can now assign tasks and collaborate with ${escapeHtml(String(data.memberName || 'your new team member'))}.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                Sent from Aligno • <a href="#" style="color: #667eea;">Manage notification settings</a>
              </p>
            </div>
          </div>
        `,
      };

    case "access_request":
      return {
        subject: `🔔 ${escapeHtml(String(data.requesterName || 'Someone'))} wants to join ${escapeHtml(String(data.projectName || 'your project'))}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Aligno</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Access Request</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">New Access Request 🔔</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                <strong>${escapeHtml(String(data.requesterName || 'A user'))}</strong> 
                ${data.requesterEmail ? `(${escapeHtml(String(data.requesterEmail))})` : ''} 
                is requesting access to join <strong>${escapeHtml(String(data.projectName || 'your project'))}</strong>.
              </p>
              
              ${data.message ? `
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f5576c;">
                <p style="color: #888; margin: 0 0 8px; font-size: 12px; text-transform: uppercase;">Message from requester:</p>
                <p style="color: #4a4a4a; margin: 0; font-size: 14px; font-style: italic;">"${escapeHtml(String(data.message))}"</p>
              </div>
              ` : ''}
              
              <!-- Action Buttons -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #4a4a4a; font-size: 14px; margin-bottom: 20px;">Log in to Aligno to approve or deny this request.</p>
                <a href="${escapeHtml(String(data.dashboardLink || '#'))}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 14px; font-weight: 600;">
                  Review Request
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                Sent from Aligno • Review access requests in your project settings
              </p>
            </div>
          </div>
        `,
      };

    case "access_request_approved":
      return {
        subject: `✅ Your request to join ${escapeHtml(String(data.projectName || 'the project'))} was approved!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Aligno</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Request Approved</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">You're In! ✅</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Great news! Your request to join <strong>${escapeHtml(String(data.projectName || 'the project'))}</strong> has been approved.
                You've been added as a <strong>${escapeHtml(String(data.role || 'member'))}</strong>.
              </p>
              
              <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; padding: 25px; margin: 25px 0; text-align: center;">
                <p style="color: white; margin: 0; font-size: 48px;">🎉</p>
                <p style="color: white; margin: 15px 0 0; font-size: 16px; font-weight: bold;">Welcome to the team!</p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${escapeHtml(String(data.projectLink || '#'))}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  Open Project
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                Approved by ${escapeHtml(String(data.approvedBy || 'Project owner'))} • Sent from Aligno
              </p>
            </div>
          </div>
        `,
      };

    case "access_request_denied":
      return {
        subject: `Your request to join ${escapeHtml(String(data.projectName || 'the project'))} was not approved`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Aligno</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0; font-size: 14px;">Request Update</p>
            </div>
            
            <div style="padding: 40px 30px;">
              <h2 style="color: #1a1a2e; margin: 0 0 20px; font-size: 24px;">Request Update</h2>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${name},</p>
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Unfortunately, your request to join <strong>${escapeHtml(String(data.projectName || 'the project'))}</strong> was not approved at this time.
              </p>
              
              <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #4a4a4a; margin: 0; font-size: 14px; line-height: 1.6;">
                  This could be for various reasons. If you believe this was a mistake, please reach out to the project owner directly.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 20px 30px; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; margin: 0; text-align: center;">
                Sent from Aligno
              </p>
            </div>
          </div>
        `,
      };

    case "progress_milestone":
      return {
        subject: `Milestone Reached: ${escapeHtml(String(data.projectName || ''))} is ${escapeHtml(String(data.progress || ''))}% complete!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">🎉 Progress Milestone!</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;"><strong>${escapeHtml(String(data.projectName || ''))}</strong> has reached a new milestone!</p>
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
              <p style="color: white; margin: 0; font-size: 48px; font-weight: bold;">${escapeHtml(String(data.progress || ''))}%</p>
              <p style="color: white; margin: 10px 0 0; font-size: 16px;">Complete</p>
            </div>
            <p style="color: #888; font-size: 14px;">Keep up the great work!</p>
          </div>
        `,
      };

    case "activity_digest":
      const activities = Array.isArray(data.activities) ? data.activities : [];
      const activityList = activities
        .slice(0, 10)
        .map((a: unknown) => {
          const activity = a as Record<string, unknown>;
          return `<li style="margin: 8px 0; color: #4a4a4a;">${escapeHtml(String(activity.description || ''))}</li>`;
        })
        .join("");
      
      return {
        subject: `Your ${escapeHtml(String(data.period || ''))} Activity Digest`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Activity Digest</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">Here's your ${escapeHtml(String(data.period || ''))} activity summary:</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin: 0 0 15px;">Recent Activities</h3>
              <ul style="padding-left: 20px; margin: 0;">
                ${activityList || "<li style='color: #888;'>No recent activities</li>"}
              </ul>
            </div>
            <div style="display: flex; gap: 20px; margin: 20px 0;">
              <div style="flex: 1; background: #667eea; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${escapeHtml(String(data.projectCount || 0))}</p>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 12px;">Active Projects</p>
              </div>
              <div style="flex: 1; background: #764ba2; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${escapeHtml(String(data.activityCount || 0))}</p>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 12px;">Activities</p>
              </div>
            </div>
          </div>
        `,
      };

    case "scheduling_applied":
      const scheduleTypeLabel = data.schedulingType === 'reassignment' ? 'Task Reassignment' : 'Schedule Update';
      return {
        subject: `AI Scheduling Applied: ${escapeHtml(String(data.taskTitle || ''))}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">🤖 AI Scheduling Applied</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">An AI scheduling suggestion has been applied to <strong>${escapeHtml(String(data.projectName || ''))}</strong>.</p>
            <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: white; margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">${escapeHtml(scheduleTypeLabel)}</p>
              <p style="color: white; margin: 10px 0 0; font-size: 20px; font-weight: bold;">${escapeHtml(String(data.taskTitle || ''))}</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #f5576c;">
              <p style="color: #4a4a4a; margin: 0; font-size: 14px;">${escapeHtml(String(data.details || ''))}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Applied by: ${escapeHtml(String(data.appliedBy || "Team member"))}</p>
          </div>
        `,
      };

    case "executive_report":
      const achievements = Array.isArray(data.achievements) ? data.achievements : [];
      const risks = Array.isArray(data.risks) ? data.risks : [];
      const recommendations = Array.isArray(data.recommendations) ? data.recommendations : [];
      
      const achievementsList = achievements
        .slice(0, 5)
        .map((a: unknown) => `<li style="margin: 8px 0; color: #11998e;">✓ ${escapeHtml(String(a))}</li>`)
        .join("");
      
      const risksList = risks
        .slice(0, 4)
        .map((r: unknown) => {
          const riskText = typeof r === 'string' ? r : (r as Record<string, unknown>).text || '';
          const severity = typeof r === 'object' ? (r as Record<string, unknown>).severity || 'medium' : 'medium';
          const color = severity === 'high' ? '#f5576c' : severity === 'medium' ? '#f093fb' : '#667eea';
          return `<li style="margin: 8px 0; color: ${color};">⚠ ${escapeHtml(String(riskText))}</li>`;
        })
        .join("");
      
      const recommendationsList = recommendations
        .slice(0, 5)
        .map((r: unknown, i: number) => `<li style="margin: 8px 0; color: #4a4a4a;">${i + 1}. ${escapeHtml(String(r))}</li>`)
        .join("");

      return {
        subject: `Executive Report: ${escapeHtml(String(data.period || 'Weekly'))} Summary`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">📊 Executive Report</h1>
            <p style="color: #888; font-size: 14px; margin-bottom: 20px;">${escapeHtml(String(data.period || 'Weekly'))} Summary • Generated ${new Date().toLocaleDateString()}</p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #1a1a2e; margin: 0 0 10px;">Summary</h3>
              <p style="color: #4a4a4a; margin: 0; font-size: 14px; line-height: 1.6;">${escapeHtml(String(data.summary || ''))}</p>
            </div>

            ${achievementsList ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #11998e; margin: 0 0 10px;">🎯 Key Achievements</h3>
              <ul style="padding-left: 0; margin: 0; list-style: none;">${achievementsList}</ul>
            </div>
            ` : ''}

            ${risksList ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #f5576c; margin: 0 0 10px;">⚠️ Risks & Blockers</h3>
              <ul style="padding-left: 0; margin: 0; list-style: none;">${risksList}</ul>
            </div>
            ` : ''}

            ${data.velocityInsight ? `
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: rgba(255,255,255,0.8); margin: 0 0 5px; font-size: 12px; text-transform: uppercase;">Velocity Insight</p>
              <p style="color: white; margin: 0; font-size: 14px;">${escapeHtml(String(data.velocityInsight))}</p>
            </div>
            ` : ''}

            ${recommendationsList ? `
            <div style="margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin: 0 0 10px;">💡 Recommendations</h3>
              <ul style="padding-left: 0; margin: 0; list-style: none;">${recommendationsList}</ul>
            </div>
            ` : ''}

            ${data.outlook ? `
            <div style="background: #e8f5e9; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #11998e;">
              <h3 style="color: #11998e; margin: 0 0 10px;">🔮 Outlook</h3>
              <p style="color: #4a4a4a; margin: 0; font-size: 14px;">${escapeHtml(String(data.outlook))}</p>
            </div>
            ` : ''}

            <p style="color: #888; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              This report was generated by Aligno AI. For questions, contact your project administrator.
            </p>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from Aligno",
        html: `<p>You have a new notification.</p>`,
      };
  }
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  // Check IP-based rate limit first
  const ipRateLimit = checkRateLimit(`ip:${clientIP}`, MAX_REQUESTS_PER_WINDOW);
  if (!ipRateLimit.allowed) {
    console.warn(`Rate limit exceeded for IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(ipRateLimit.resetIn / 1000)
      }),
      { 
        status: 429, 
        headers: { 
          "Content-Type": "application/json", 
          "Retry-After": String(Math.ceil(ipRateLimit.resetIn / 1000)),
          ...corsHeaders 
        } 
      }
    );
  }

  try {
    const body = await req.json();
    const validation = validateRequest(body);

    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(
        JSON.stringify({ success: false, error: validation.error }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { type, recipientEmail, recipientName, data } = validation.data;

    // Check recipient-based rate limit to prevent spam to same email
    const emailRateLimit = checkRateLimit(`email:${recipientEmail.toLowerCase()}`, MAX_REQUESTS_PER_EMAIL);
    if (!emailRateLimit.allowed) {
      console.warn(`Rate limit exceeded for recipient: ${recipientEmail}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Too many emails sent to this address. Please try again later.",
          retryAfter: Math.ceil(emailRateLimit.resetIn / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            "Content-Type": "application/json", 
            "Retry-After": String(Math.ceil(emailRateLimit.resetIn / 1000)),
            ...corsHeaders 
          } 
        }
      );
    }

    console.log(`Sending ${type} notification to ${recipientEmail} from IP ${clientIP}`);

    const { subject, html } = getEmailContent(type, data, recipientName);

    const emailResponse = await resend.emails.send({
      from: "Aligno <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(Math.min(ipRateLimit.remaining, emailRateLimit.remaining)),
        ...corsHeaders 
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending notification email:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: "Failed to send email" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
