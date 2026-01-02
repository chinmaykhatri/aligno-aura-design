import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Hash, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAcceptInvitation } from "@/hooks/useProjectInvitations";

interface JoinProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const JoinProjectDialog = ({
  open,
  onOpenChange,
}: JoinProjectDialogProps) => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const acceptInvitation = useAcceptInvitation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const result = await acceptInvitation.mutateAsync({ code: code.trim().toUpperCase() });
    if (result.success && result.project_id) {
      onOpenChange(false);
      setCode("");
      navigate(`/projects/${result.project_id}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Join a Project
          </DialogTitle>
          <DialogDescription>
            Enter an invite code to join a project team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Invite Code</Label>
            <Input
              id="code"
              placeholder="e.g. ABC123"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-center text-xl tracking-widest"
              maxLength={6}
              autoComplete="off"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!code.trim() || acceptInvitation.isPending}
          >
            {acceptInvitation.isPending ? (
              "Joining..."
            ) : (
              <>
                Join Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
