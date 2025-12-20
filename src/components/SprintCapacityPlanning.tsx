import { useState, useMemo } from 'react';
import { useSprintCapacity, useUpsertSprintCapacity, useHistoricalVelocity, SprintMemberCapacity } from '@/hooks/useSprintCapacity';
import { Sprint } from '@/hooks/useSprints';
import { Task } from '@/hooks/useTasks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle2,
  Target,
  BarChart3,
  User,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SprintCapacityPlanningProps {
  sprint: Sprint;
  tasks: Task[];
  projectId: string;
  members: Array<{ user_id: string; full_name: string | null }>;
}

const SprintCapacityPlanning = ({ sprint, tasks, projectId, members }: SprintCapacityPlanningProps) => {
  const { data: capacityData } = useSprintCapacity(sprint.id);
  const { data: velocityData } = useHistoricalVelocity(projectId);
  const upsertCapacity = useUpsertSprintCapacity();
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editHours, setEditHours] = useState<number>(40);

  // Get sprint tasks
  const sprintTasks = useMemo(() => 
    tasks.filter(t => t.sprint_id === sprint.id),
    [tasks, sprint.id]
  );

  // Calculate planned work
  const plannedWork = useMemo(() => {
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.story_points || 0), 0);
    const totalHours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
    return { points: totalPoints, hours: totalHours };
  }, [sprintTasks]);

  // Calculate total capacity
  const totalCapacity = useMemo(() => {
    return capacityData?.reduce((sum, c) => sum + c.available_hours, 0) || 0;
  }, [capacityData]);

  // Get member capacity
  const getMemberCapacity = (userId: string): SprintMemberCapacity | undefined => {
    return capacityData?.find(c => c.user_id === userId);
  };

  // Calculate capacity health
  const capacityHealth = useMemo(() => {
    if (totalCapacity === 0) return 'unknown';
    const utilizationPercent = (plannedWork.hours / totalCapacity) * 100;
    if (utilizationPercent > 100) return 'overcommitted';
    if (utilizationPercent > 85) return 'at-risk';
    if (utilizationPercent > 60) return 'healthy';
    return 'underutilized';
  }, [totalCapacity, plannedWork.hours]);

  const handleSaveCapacity = async (userId: string) => {
    await upsertCapacity.mutateAsync({
      sprint_id: sprint.id,
      user_id: userId,
      available_hours: editHours,
    });
    setEditingMember(null);
  };

  const getHealthColor = () => {
    switch (capacityHealth) {
      case 'overcommitted': return 'text-red-400';
      case 'at-risk': return 'text-amber-400';
      case 'healthy': return 'text-emerald-400';
      case 'underutilized': return 'text-blue-400';
      default: return 'text-muted-foreground';
    }
  };

  const getHealthIcon = () => {
    switch (capacityHealth) {
      case 'overcommitted': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'at-risk': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'healthy': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'underutilized': return <Minus className="h-4 w-4 text-blue-400" />;
      default: return null;
    }
  };

  const utilizationPercent = totalCapacity > 0 
    ? Math.min((plannedWork.hours / totalCapacity) * 100, 150) 
    : 0;

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-copper" />
            Capacity Planning
          </CardTitle>
          <div className="flex items-center gap-2">
            {getHealthIcon()}
            <Badge 
              variant="outline" 
              className={cn("text-xs capitalize", getHealthColor())}
            >
              {capacityHealth.replace('-', ' ')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Clock className="h-3 w-3" />
              Total Capacity
            </div>
            <div className="text-lg font-semibold">{totalCapacity}h</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Target className="h-3 w-3" />
              Planned Work
            </div>
            <div className="text-lg font-semibold">
              {plannedWork.hours}h
              {plannedWork.points > 0 && (
                <span className="text-xs text-purple-400 ml-1">({plannedWork.points} SP)</span>
              )}
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BarChart3 className="h-3 w-3" />
              Avg Velocity
            </div>
            <div className="text-lg font-semibold flex items-center gap-1">
              {velocityData?.averagePoints || 0}
              <span className="text-xs text-muted-foreground">SP</span>
              {velocityData?.trend !== undefined && velocityData.trend !== 0 && (
                velocityData.trend > 0 
                  ? <TrendingUp className="h-3 w-3 text-emerald-400" />
                  : <TrendingDown className="h-3 w-3 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Capacity Utilization</span>
            <span className={cn("font-medium", getHealthColor())}>
              {totalCapacity > 0 ? Math.round((plannedWork.hours / totalCapacity) * 100) : 0}%
            </span>
          </div>
          <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all",
                capacityHealth === 'overcommitted' && "bg-red-500",
                capacityHealth === 'at-risk' && "bg-amber-500",
                capacityHealth === 'healthy' && "bg-emerald-500",
                capacityHealth === 'underutilized' && "bg-blue-500",
                capacityHealth === 'unknown' && "bg-muted-foreground"
              )}
              style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
            />
            {utilizationPercent > 100 && (
              <div 
                className="absolute inset-y-0 bg-red-500/50 rounded-r-full"
                style={{ left: '100%', width: `${Math.min(utilizationPercent - 100, 50)}%` }}
              />
            )}
            {/* Threshold markers */}
            <div className="absolute inset-y-0 left-[60%] w-px bg-border/50" />
            <div className="absolute inset-y-0 left-[85%] w-px bg-border/50" />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>60%</span>
            <span>85%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Velocity Recommendation */}
        {velocityData && velocityData.averagePoints > 0 && (
          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-start gap-2">
              <TrendingUp className="h-4 w-4 text-purple-400 mt-0.5" />
              <div className="text-sm">
                <p className="text-purple-400 font-medium">Velocity Recommendation</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Based on the last {velocityData.sprints.length} sprints, your team averages{' '}
                  <span className="text-foreground font-medium">{velocityData.averagePoints} story points</span> per sprint.
                  {plannedWork.points > velocityData.averagePoints * 1.2 && (
                    <span className="text-amber-400"> Current commitment is above average.</span>
                  )}
                  {plannedWork.points < velocityData.averagePoints * 0.8 && (
                    <span className="text-blue-400"> You have room for more work.</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Team Member Capacity */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Team Availability</div>
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No team members found</p>
          ) : (
            <div className="space-y-2">
              {members.map(member => {
                const capacity = getMemberCapacity(member.user_id);
                const isEditing = editingMember === member.user_id;
                const initials = member.full_name
                  ?.split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase() || '?';

                return (
                  <div 
                    key={member.user_id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/20 border border-border/20"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-copper/20 text-copper">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.full_name || 'Unknown'}
                      </p>
                      {capacity && !isEditing && (
                        <p className="text-xs text-muted-foreground">
                          {capacity.available_hours}h available
                        </p>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editHours}
                          onChange={(e) => setEditHours(Number(e.target.value))}
                          className="w-20 h-8 text-sm"
                          min={0}
                          max={168}
                        />
                        <span className="text-xs text-muted-foreground">hours</span>
                        <Button
                          size="sm"
                          className="h-8 bg-copper hover:bg-copper/90"
                          onClick={() => handleSaveCapacity(member.user_id)}
                          disabled={upsertCapacity.isPending}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8"
                          onClick={() => setEditingMember(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => {
                              setEditingMember(member.user_id);
                              setEditHours(capacity?.available_hours || 40);
                            }}
                          >
                            {capacity ? 'Edit' : 'Set Hours'}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Set available hours for this sprint</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SprintCapacityPlanning;
