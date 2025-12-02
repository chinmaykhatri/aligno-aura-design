import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "status_change" | "member_invitation" | "progress_milestone" | "activity_digest";
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, any>;
}

const getEmailContent = (type: string, data: Record<string, any>, recipientName?: string) => {
  const name = recipientName || "there";
  
  switch (type) {
    case "status_change":
      return {
        subject: `Project Status Updated: ${data.projectName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Project Status Changed</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">The status of <strong>${data.projectName}</strong> has been updated.</p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: white; margin: 0; font-size: 14px;">Previous Status</p>
              <p style="color: white; margin: 5px 0 15px; font-size: 18px; font-weight: bold;">${data.oldStatus}</p>
              <p style="color: white; margin: 0; font-size: 14px;">New Status</p>
              <p style="color: white; margin: 5px 0 0; font-size: 18px; font-weight: bold;">${data.newStatus}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Updated by: ${data.updatedBy || "Team member"}</p>
          </div>
        `,
      };

    case "member_invitation":
      return {
        subject: `You've been invited to join ${data.projectName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Project Invitation</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">You've been invited to join <strong>${data.projectName}</strong> as a <strong>${data.role}</strong>.</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="color: #4a4a4a; margin: 0; font-size: 14px;">${data.projectDescription || "Join the team and start collaborating!"}</p>
            </div>
            <p style="color: #888; font-size: 14px;">Invited by: ${data.invitedBy || "Project owner"}</p>
          </div>
        `,
      };

    case "progress_milestone":
      return {
        subject: `Milestone Reached: ${data.projectName} is ${data.progress}% complete!`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">🎉 Progress Milestone!</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;"><strong>${data.projectName}</strong> has reached a new milestone!</p>
            <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); border-radius: 8px; padding: 30px; margin: 20px 0; text-align: center;">
              <p style="color: white; margin: 0; font-size: 48px; font-weight: bold;">${data.progress}%</p>
              <p style="color: white; margin: 10px 0 0; font-size: 16px;">Complete</p>
            </div>
            <p style="color: #888; font-size: 14px;">Keep up the great work!</p>
          </div>
        `,
      };

    case "activity_digest":
      const activities = data.activities || [];
      const activityList = activities
        .map((a: any) => `<li style="margin: 8px 0; color: #4a4a4a;">${a.description}</li>`)
        .join("");
      
      return {
        subject: `Your ${data.period} Activity Digest`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a2e; margin-bottom: 20px;">Activity Digest</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Hi ${name},</p>
            <p style="color: #4a4a4a; font-size: 16px;">Here's your ${data.period} activity summary:</p>
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #1a1a2e; margin: 0 0 15px;">Recent Activities</h3>
              <ul style="padding-left: 20px; margin: 0;">
                ${activityList || "<li style='color: #888;'>No recent activities</li>"}
              </ul>
            </div>
            <div style="display: flex; gap: 20px; margin: 20px 0;">
              <div style="flex: 1; background: #667eea; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${data.projectCount || 0}</p>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 12px;">Active Projects</p>
              </div>
              <div style="flex: 1; background: #764ba2; border-radius: 8px; padding: 15px; text-align: center;">
                <p style="color: white; margin: 0; font-size: 24px; font-weight: bold;">${data.activityCount || 0}</p>
                <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 12px;">Activities</p>
              </div>
            </div>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from ProjectHub",
        html: `<p>You have a new notification.</p>`,
      };
  }
};

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, recipientEmail, recipientName, data }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification to ${recipientEmail}`);

    const { subject, html } = getEmailContent(type, data, recipientName);

    const emailResponse = await resend.emails.send({
      from: "ProjectHub <onboarding@resend.dev>",
      to: [recipientEmail],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
