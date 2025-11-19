import { useState } from "react";
import { useActivities, ActivityType } from "@/hooks/useActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, Filter, Loader2, Activity as ActivityIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const activityTypeLabels: Record<ActivityType, { label: string; color: string }> = {
  project_created: { label: "Project Created", color: "bg-green-500" },
  project_updated: { label: "Project Updated", color: "bg-blue-500" },
  project_deleted: { label: "Project Deleted", color: "bg-red-500" },
  project_status_changed: { label: "Status Changed", color: "bg-yellow-500" },
  project_progress_updated: { label: "Progress Updated", color: "bg-purple-500" },
  member_added: { label: "Member Added", color: "bg-cyan-500" },
  member_removed: { label: "Member Removed", color: "bg-orange-500" },
  member_role_changed: { label: "Role Changed", color: "bg-pink-500" },
};

interface ActivityFeedProps {
  projectId?: string;
  compact?: boolean;
}

export const ActivityFeed = ({ projectId, compact = false }: ActivityFeedProps) => {
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useActivities({
    activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
    projectId,
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
    page,
  });

  const activities = data?.data || [];
  const hasMore = data?.hasMore || false;

  const getActivityMessage = (activity: typeof activities[0]) => {
    const userName = activity.profiles?.full_name || "Someone";
    const projectName = activity.projects?.name || "a project";
    const metadata = activity.metadata || {};

    switch (activity.activity_type) {
      case "project_created":
        return `${userName} created ${projectName}`;
      case "project_updated":
        return `${userName} updated ${projectName}`;
      case "project_deleted":
        return `${userName} deleted ${projectName}`;
      case "project_status_changed":
        return `${userName} changed status to ${metadata.newStatus} in ${projectName}`;
      case "project_progress_updated":
        return `${userName} updated progress to ${metadata.newProgress}% in ${projectName}`;
      case "member_added":
        return `${userName} added a member to ${projectName}`;
      case "member_removed":
        return `${userName} removed a member from ${projectName}`;
      case "member_role_changed":
        return `${userName} changed a member's role in ${projectName}`;
      default:
        return `${userName} performed an action in ${projectName}`;
    }
  };

  const handleTypeToggle = (type: ActivityType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
    setPage(1);
  };

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No activities yet
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-sm">
                    <div className={cn("w-2 h-2 rounded-full mt-1.5", activityTypeLabels[activity.activity_type].color)} />
                    <div className="flex-1">
                      <p className="text-foreground">{getActivityMessage(activity)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(activity.created_at), "MMM d, h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activity Feed
          </CardTitle>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                  {(selectedTypes.length > 0 || startDate || endDate) && (
                    <Badge variant="secondary" className="ml-2">
                      {selectedTypes.length + (startDate ? 1 : 0) + (endDate ? 1 : 0)}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Activity Types</h4>
                    <div className="space-y-2">
                      {Object.entries(activityTypeLabels).map(([type, { label }]) => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTypes.includes(type as ActivityType)}
                            onChange={() => handleTypeToggle(type as ActivityType)}
                            className="rounded"
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Date Range</h4>
                    <div className="space-y-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {startDate ? format(startDate, "PPP") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={startDate}
                            onSelect={setStartDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {endDate ? format(endDate, "PPP") : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={endDate}
                            onSelect={setEndDate}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedTypes([]);
                      setStartDate(undefined);
                      setEndDate(undefined);
                      setPage(1);
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No activities found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-3 h-3 rounded-full", activityTypeLabels[activity.activity_type].color)} />
                      <div className="w-px h-full bg-border mt-2" />
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary">
                          {activityTypeLabels[activity.activity_type].label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(activity.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{getActivityMessage(activity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
