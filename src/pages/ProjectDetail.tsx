import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useGoals } from "@/hooks/useGoals";
import { useSprints } from "@/hooks/useSprints";
import { ProjectDialog } from "@/components/ProjectDialog";
import { AddMemberDialog } from "@/components/AddMemberDialog";
import { Skeleton } from "@/components/ui/skeleton";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";

import {
  ProjectSnapshot,
  ExecutionZone,
  InsightsHealthSection,
  PredictionSimulationSection,
  AIActionsSection,
  HistoryKnowledgeSection,
  TeamSettingsSection,
  StickyMiniHeader,
  SectionNavigation,
} from "@/components/project-detail";
import { AnimatedSection } from "@/components/AnimatedSection";

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

  const teamMembers = project?.members?.map(m => ({
    user_id: m.user_id,
    full_name: m.profiles?.full_name || null,
    role: m.role
  })) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-6 py-24">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-96 rounded-3xl" />
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
      
      {/* Sticky Mini Header */}
      <StickyMiniHeader
        projectName={project.name}
        projectStatus={project.status}
        progress={project.progress}
      />
      
      {/* Section Navigation */}
      <SectionNavigation />
      
      <main className="container mx-auto px-4 sm:px-6 py-24">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/projects")}
          className="mb-6 hover:bg-secondary/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        {/* Page Layout - Layered Sections */}
        <div className="space-y-12">
          {/* SECTION 1: Project Snapshot - Above the fold */}
          <div id="section-snapshot">
            <AnimatedSection delay={0}>
              <ProjectSnapshot
                project={project}
                sprints={sprints}
                tasks={tasks}
                isOwner={isOwner}
                onEditClick={() => setIsEditDialogOpen(true)}
                onDeleteClick={() => setIsDeleteDialogOpen(true)}
                onProgressChange={handleProgressChange}
                onStatusChange={handleStatusChange}
              />
            </AnimatedSection>
          </div>

          {/* SECTION 2: Execution Zone - Primary Working Area */}
          <div id="section-execution">
            <AnimatedSection delay={100}>
              <ExecutionZone
                projectId={project.id}
                projectName={project.name}
                isOwner={isOwner}
              />
            </AnimatedSection>
          </div>

          {/* Two-column layout for secondary content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-12">
              {/* SECTION 3: Insights & Health */}
              <div id="section-insights">
                <AnimatedSection delay={150} direction="left">
                  <InsightsHealthSection
                    projectId={project.id}
                    tasks={tasks || []}
                    sprints={sprints || []}
                  />
                </AnimatedSection>
              </div>

              {/* SECTION 5: AI Actions */}
              <div id="section-ai-actions">
                <AnimatedSection delay={250} direction="left">
                  <AIActionsSection
                    projectId={project.id}
                    projectName={project.name}
                    project={project}
                    tasks={tasks || []}
                    goals={goals}
                    teamMembers={teamMembers}
                    currentSprintId={sprints?.find(s => s.status === 'active')?.id}
                  />
                </AnimatedSection>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-12">
              {/* SECTION 4: Prediction & Simulation */}
              <div id="section-prediction">
                <AnimatedSection delay={200} direction="right">
                  <PredictionSimulationSection
                    projectId={project.id}
                    tasks={tasks || []}
                    teamMembers={teamMembers}
                  />
                </AnimatedSection>
              </div>

              {/* SECTION 6: History & Knowledge */}
              <div id="section-history">
                <AnimatedSection delay={300} direction="right">
                  <HistoryKnowledgeSection
                    projectId={project.id}
                    projectName={project.name}
                  />
                </AnimatedSection>
              </div>
            </div>
          </div>

          {/* SECTION 7: Team & Settings - Full width footer */}
          <div id="section-team">
            <AnimatedSection delay={350}>
              <TeamSettingsSection
                projectId={project.id}
                projectName={project.name}
                members={project.members || []}
                isOwner={isOwner}
                currentUserId={currentUserId}
                createdAt={project.created_at}
                updatedAt={project.updated_at}
                onAddMember={() => setIsAddMemberDialogOpen(true)}
                onRemoveMember={handleRemoveMember}
              />
            </AnimatedSection>
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
