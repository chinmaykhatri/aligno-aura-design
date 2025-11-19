import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import AIChat from "@/components/AIChat";
import { ActivityFeed } from "@/components/ActivityFeed";
import { LogOut, MessageSquare, FolderKanban } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { ProjectCard } from "@/components/ProjectCard";
import { analytics } from "@/lib/analytics";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [showChat, setShowChat] = useState(false);
  const { data: projects } = useProjects();
  
  const recentProjects = projects?.slice(0, 3);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    analytics.trackUserLogout();
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-6 py-24">
        <div className="space-y-12">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                Welcome back!
              </h1>
              <p className="text-lg text-muted-foreground">
                {user?.email}
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="hover:border-copper/30 transition-smooth"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="hover:border-copper/30 transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-copper" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Get help with project planning and management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowChat(true)}
                >
                  Open AI Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:border-copper/30 transition-smooth">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-copper" />
                  Projects
                </CardTitle>
                <CardDescription>
                  {projects?.length || 0} active projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/projects')}
                >
                  View All Projects
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Projects Section */}
          {recentProjects && recentProjects.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Recent Projects</h2>
                <Button variant="ghost" onClick={() => navigate('/projects')}>
                  View All
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => navigate(`/projects/${project.id}`)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Activity Feed Section */}
          <div className="mt-12">
            <ActivityFeed compact />
          </div>
        </div>
      </main>

      <AIChat open={showChat} onOpenChange={setShowChat} />
    </div>
  );
};

export default Dashboard;
