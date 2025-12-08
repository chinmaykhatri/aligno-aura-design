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

type NotificationType = "status_change" | "member_invitation" | "progress_milestone" | "activity_digest";

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

  const validTypes: NotificationType[] = ['status_change', 'member_invitation', 'progress_milestone', 'activity_digest'];
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
      return {
        subject: `You've been invited to join ${escapeHtml(String(data.projectName || ''))}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Project Invitation</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">You've been invited to join <strong>${escapeHtml(String(data.projectName || ''))}</strong> as a <strong>${escapeHtml(String(data.role || ''))}</strong>.</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="color: #4a4a4a; margin: 0; font-size: 14px;">${escapeHtml(String(data.projectDescription || "Join the team and start collaborating!"))}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Invited by: ${escapeHtml(String(data.invitedBy || "Project owner"))}</p>
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
