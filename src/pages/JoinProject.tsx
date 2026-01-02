import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, CheckCircle, XCircle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAcceptInvitation } from "@/hooks/useProjectInvitations";
import { supabase } from "@/integrations/supabase/client";

const JoinProject = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'auth-required'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [projectId, setProjectId] = useState<string | null>(null);
  const acceptInvitation = useAcceptInvitation();

  useEffect(() => {
    const checkAuthAndJoin = async () => {
      if (!token) {
        setStatus('error');
        setErrorMessage('Invalid invitation link');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setStatus('auth-required');
        return;
      }

      // Try to accept the invitation
      try {
        const result = await acceptInvitation.mutateAsync({ token });
        if (result.success) {
          setStatus('success');
          setProjectId(result.project_id || null);
        } else {
          setStatus('error');
          setErrorMessage(result.error || 'Failed to join project');
        }
      } catch (error: any) {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to join project');
      }
    };

    checkAuthAndJoin();
  }, [token]);

  const handleLoginRedirect = () => {
    // Store the return URL so we can redirect back after login
    sessionStorage.setItem('returnUrl', window.location.href);
    navigate('/auth');
  };

  const handleGoToProject = () => {
    if (projectId) {
      navigate(`/projects/${projectId}`);
    } else {
      navigate('/projects');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Join Project</CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your invitation...'}
            {status === 'auth-required' && 'Sign in to accept this invitation'}
            {status === 'success' && 'You have successfully joined the project!'}
            {status === 'error' && 'Unable to join project'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === 'loading' && (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          )}

          {status === 'auth-required' && (
            <>
              <p className="text-center text-muted-foreground text-sm">
                You need to be signed in to join this project. If you don't have an account, you can create one.
              </p>
              <Button onClick={handleLoginRedirect} className="w-full">
                Sign In / Sign Up
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <Button onClick={handleGoToProject} className="w-full">
                Go to Project
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-destructive" />
              <p className="text-center text-muted-foreground text-sm">
                {errorMessage}
              </p>
              <Button variant="outline" onClick={() => navigate('/projects')} className="w-full">
                Go to Projects
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinProject;
