import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { LogOut, LayoutDashboard, FolderKanban } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isAuthenticatedRoute = ["/dashboard", "/projects"].some(route => 
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/40">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <Link to={isAuthenticated ? "/dashboard" : "/"} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-copper flex items-center justify-center">
            <span className="text-deep-black font-bold text-lg">A</span>
          </div>
          <span className="text-xl font-semibold text-gradient-copper">Aligno</span>
        </Link>
        
        {isAuthenticatedRoute && isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link 
              to="/dashboard" 
              className={`text-sm transition-smooth flex items-center gap-2 ${
                location.pathname === "/dashboard" 
                  ? "text-copper font-medium" 
                  : "text-muted-foreground hover:text-copper"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </Link>
            <Link 
              to="/projects" 
              className={`text-sm transition-smooth flex items-center gap-2 ${
                location.pathname.startsWith("/projects") 
                  ? "text-copper font-medium" 
                  : "text-muted-foreground hover:text-copper"
              }`}
            >
              <FolderKanban className="w-4 h-4" />
              Projects
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="w-8 h-8 rounded-full bg-gradient-copper flex items-center justify-center">
                    <span className="text-deep-black font-medium text-sm">U</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                Features
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                Testimonials
              </a>
              <a href="#why" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                Why Aligno?
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground hover:text-copper transition-smooth">
                Pricing
              </a>
            </div>
            
            <Link to="/auth">
              <Button variant="default" className="bg-gradient-copper hover:opacity-90 transition-smooth">
                Get Started
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
