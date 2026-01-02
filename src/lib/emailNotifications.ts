import { supabase } from "@/integrations/supabase/client";

type NotificationType = "status_change" | "member_invitation" | "progress_milestone" | "activity_digest" | "scheduling_applied" | "member_joined" | "access_request" | "access_request_approved" | "access_request_denied";

interface NotificationData {
  type: NotificationType;
  recipientEmail: string;
  recipientName?: string;
  data: Record<string, any>;
}

export const sendNotificationEmail = async (notification: NotificationData) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification-email", {
      body: notification,
    });

    if (error) {
      console.error("Error sending notification email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Error invoking email function:", error);
    return { success: false, error };
  }
};

export const sendStatusChangeNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  oldStatus: string,
  newStatus: string,
  updatedBy?: string
) => {
  return sendNotificationEmail({
    type: "status_change",
    recipientEmail,
    recipientName,
    data: { projectName, oldStatus, newStatus, updatedBy },
  });
};

export const sendMemberInvitationNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  role: string,
  projectDescription?: string,
  invitedBy?: string
) => {
  return sendNotificationEmail({
    type: "member_invitation",
    recipientEmail,
    recipientName,
    data: { projectName, role, projectDescription, invitedBy },
  });
};

export const sendProgressMilestoneNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  progress: number
) => {
  return sendNotificationEmail({
    type: "progress_milestone",
    recipientEmail,
    recipientName,
    data: { projectName, progress },
  });
};

export const sendActivityDigestNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  period: "daily" | "weekly",
  activities: Array<{ description: string }>,
  projectCount: number,
  activityCount: number
) => {
  return sendNotificationEmail({
    type: "activity_digest",
    recipientEmail,
    recipientName,
    data: { period, activities, projectCount, activityCount },
  });
};

export const sendSchedulingAppliedNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  schedulingType: 'schedule' | 'reassignment',
  taskTitle: string,
  details: string,
  appliedBy?: string
) => {
  return sendNotificationEmail({
    type: "scheduling_applied",
    recipientEmail,
    recipientName,
    data: { projectName, schedulingType, taskTitle, details, appliedBy },
  });
};

export const sendMemberJoinedNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  memberName: string,
  memberEmail: string,
  role: string,
  joinMethod: string
) => {
  return sendNotificationEmail({
    type: "member_joined",
    recipientEmail,
    recipientName,
    data: { projectName, memberName, memberEmail, role, joinMethod },
  });
};

export const sendAccessRequestNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  requesterName: string,
  requesterEmail: string,
  message?: string,
  dashboardLink?: string
) => {
  return sendNotificationEmail({
    type: "access_request",
    recipientEmail,
    recipientName,
    data: { projectName, requesterName, requesterEmail, message, dashboardLink },
  });
};

export const sendAccessRequestApprovedNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string,
  role: string,
  approvedBy: string,
  projectLink?: string
) => {
  return sendNotificationEmail({
    type: "access_request_approved",
    recipientEmail,
    recipientName,
    data: { projectName, role, approvedBy, projectLink },
  });
};

export const sendAccessRequestDeniedNotification = async (
  recipientEmail: string,
  recipientName: string | undefined,
  projectName: string
) => {
  return sendNotificationEmail({
    type: "access_request_denied",
    recipientEmail,
    recipientName,
    data: { projectName },
  });
};

// Check if progress hit a milestone (25%, 50%, 75%, 100%)
export const isProgressMilestone = (oldProgress: number, newProgress: number): boolean => {
  const milestones = [25, 50, 75, 100];
  return milestones.some(
    (milestone) => oldProgress < milestone && newProgress >= milestone
  );
};
