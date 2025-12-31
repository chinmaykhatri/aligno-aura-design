import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, Trash2, UserPlus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { ActivityFeed } from "@/components/ActivityFeed";
import { TaskList } from "@/components/TaskList";
import { GoalList } from "@/components/GoalList";
import TeamCollaboration from "@/components/TeamCollaboration";
import SmartScheduling from "@/components/SmartScheduling";
import { AITaskSuggestions } from "@/components/AITaskSuggestions";
import { AIPredictiveInsights } from "@/components/AIPredictiveInsights";
import { ClientPortalManager } from "@/components/ClientPortalManager";
import { IntegrationsManager } from "@/components/IntegrationsManager";
import RiskRadar from "@/components/RiskRadar";
import RoadmapView from "@/components/RoadmapView";
import OKRManager from "@/components/OKRManager";
import ProjectHealthScore from "@/components/ProjectHealthScore";
import VisualRiskRadarChart from "@/components/VisualRiskRadarChart";
import PredictiveDelayDetection from "@/components/PredictiveDelayDetection";
import AutomaticRiskRegister from "@/components/AutomaticRiskRegister";
import GoalDrivenAgent from "@/components/GoalDrivenAgent";
import SelfHealingSchedule from "@/components/SelfHealingSchedule";
import AISprintAutoPlanner from "@/components/AISprintAutoPlanner";
import { useGoals } from "@/hooks/useGoals";
import { useSprints } from "@/hooks/useSprints";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProject, useUpdateProject, useDeleteProject, useRemoveProjectMember } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { ProjectDialog } from "@/components/ProjectDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading } = useProject(id);
  const { data: tasks } = useTasks(id);
  const { data: sprints } = useSprints(id);
  const { goals } = useGoals(id || '');
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const removeMember = useRemoveProjectMember();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if user is owner
        const ownerMember = project?.members?.find(
          m => m.user_id === user.id && m.role === 'owner'
        );
        setIsOwner(!!ownerMember);
      }
    };
    
    fetchUser();
  }, [project]);

  const handleProgressChange = (value: number[]) => {
    if (project && isOwner) {
      updateProject.mutate({
        id: project.id,
        updates: { progress: value[0] },
      });
    }
  };

  const handleStatusChange = (status: 'active' | 'completed' | 'archived') => {
    if (project && isOwner) {
      updateProject.mutate({
        id: project.id,
        updates: { status },
      });
    }
  };

  const handleDeleteProject = () => {
    if (project) {
      deleteProject.mutate(project.id, {
        onSuccess: () => {
          navigate("/projects");
        },
      });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (project) {
      removeMember.mutate({ projectId: project.id, memberId });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-24">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 rounded-2xl" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Project not found</h1>
            <Button onClick={() => navigate("/projects")}>Back to Projects</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="space-y-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/projects")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-foreground">{project.name}</h1>
                <Badge variant="outline" className={getStatusColor(project.status)}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description || "No description"}</p>
            </div>
            
            {isOwner && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Progress Section */}
              <div className="p-6 rounded-2xl bg-card border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Progress</h2>
                  <span className="text-2xl font-bold text-copper">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-3 mb-4" />
                
                {isOwner && (
                  <div className="mt-6">
                    <label className="text-sm text-muted-foreground mb-2 block">
                      Update Progress
                    </label>
                    <Slider
                      value={[project.progress]}
                      onValueChange={handleProgressChange}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              {/* Status Section */}
              {isOwner && (
                <div className="p-6 rounded-2xl bg-card border border-border/40">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Status</h2>
                  <Select value={project.status} onValueChange={handleStatusChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Goals Section */}
              <GoalList projectId={project.id} />

              {/* OKRs - Objectives & Key Results */}
              <OKRManager projectId={project.id} />

              {/* AI Roadmap */}
              <RoadmapView projectId={project.id} />

              {/* Tasks Section */}
              <TaskList projectId={project.id} isOwner={isOwner} />

              {/* Activity Feed */}
              <ActivityFeed projectId={project.id} compact />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Health Score */}
              <ProjectHealthScore projectId={project.id} tasks={tasks || []} sprints={sprints || []} />

              {/* Visual Risk Radar Chart */}
              <VisualRiskRadarChart projectId={project.id} tasks={tasks || []} sprints={sprints || []} />

              {/* Predictive Delay Detection */}
              <PredictiveDelayDetection projectId={project.id} tasks={tasks || []} />

              {/* Automatic Risk Register */}
              <AutomaticRiskRegister projectId={project.id} tasks={tasks || []} />

              {/* Risk Radar - AI Early Warning */}
              <RiskRadar projectId={project.id} />

              {/* AI Task Suggestions */}
              <AITaskSuggestions
                projectId={project.id}
                projectName={project.name}
                goals={goals}
                existingTasks={tasks || []}
              />

              {/* AI Predictive Insights */}
              <AIPredictiveInsights
                project={project}
                tasks={tasks || []}
              />

              {/* Goal-Driven AI Agent */}
              <GoalDrivenAgent 
                projectId={project.id}
                projectName={project.name}
                tasks={tasks || []}
                teamMembers={project.members?.map(m => ({
                  user_id: m.user_id,
                  full_name: m.profiles?.full_name || null,
                  role: m.role
                })) || []}
              />

              {/* Self-Healing Schedule */}
              <SelfHealingSchedule 
                projectId={project.id}
                tasks={tasks || []}
                teamMembers={project.members?.map(m => ({
                  user_id: m.user_id,
                  full_name: m.profiles?.full_name || null,
                  role: m.role
                })) || []}
              />

              {/* AI Sprint Auto-Planner */}
              <AISprintAutoPlanner 
                projectId={project.id}
                tasks={tasks || []}
                teamMembers={project.members?.map(m => ({
                  user_id: m.user_id,
                  full_name: m.profiles?.full_name || null,
                  role: m.role
                })) || []}
                currentSprintId={sprints?.find(s => s.status === 'active')?.id}
              />

              {/* Smart Scheduling */}
              <SmartScheduling 
                projectId={project.id}
                projectName={project.name}
                tasks={tasks || []}
                teamMembers={project.members?.map(m => ({
                  user_id: m.user_id,
                  full_name: m.profiles?.full_name || null,
                  role: m.role
                })) || []}
              />
              
              {/* Team Collaboration */}
              <TeamCollaboration projectId={project.id} projectName={project.name} />
              {/* Team Members */}
              <div className="p-6 rounded-2xl bg-card border border-border/40">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-foreground">Team</h2>
                  {isOwner && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddMemberDialogOpen(true)}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {project.members?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-copper/40">
                          <AvatarFallback className="bg-gradient-copper text-deep-black text-sm font-medium">
                            {member.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">
                            {member.profiles?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {member.role}
                          </p>
                        </div>
                      </div>
                      
                      {isOwner && member.user_id !== currentUserId && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-destructive"
                            >
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Portal */}
              <ClientPortalManager projectId={project.id} isOwner={isOwner} />

              {/* Integrations */}
              <IntegrationsManager projectId={project.id} projectName={project.name} isOwner={isOwner} />

              {/* Metadata */}
              <div className="p-6 rounded-2xl bg-card border border-border/40">
                <h2 className="text-xl font-semibold text-foreground mb-4">Details</h2>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="text-foreground font-medium">
                      {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Updated</p>
                    <p className="text-foreground font-medium">
                      {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Dialogs */}
      <ProjectDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        project={project}
      />
      
      <AddMemberDialog
        open={isAddMemberDialogOpen}
        onOpenChange={setIsAddMemberDialogOpen}
        projectId={project.id}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{project.name}"? This action cannot be undone
              and will remove all project data and team members.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDetail;
