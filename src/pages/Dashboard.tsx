import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { LogOut, MessageSquare } from "lucide-react";
import AIChat from "@/components/AIChat";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Aligno Dashboard</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            {user?.email}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Projects</h3>
            <p className="text-muted-foreground mb-4">Manage your projects and tasks</p>
            <Button>View Projects</Button>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">Team</h3>
            <p className="text-muted-foreground mb-4">Collaborate with your team members</p>
            <Button>View Team</Button>
          </div>

          <div className="p-6 border rounded-lg bg-card hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-muted-foreground mb-4">Get help with project management</p>
            <Button onClick={() => setShowChat(true)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Open Chat
            </Button>
          </div>
        </div>
      </main>

      <AIChat open={showChat} onOpenChange={setShowChat} />
    </div>
  );
};

export default Dashboard;
