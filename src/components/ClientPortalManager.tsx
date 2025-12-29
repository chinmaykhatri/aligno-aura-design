import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  Link2, 
  Plus, 
  Copy, 
  Trash2, 
  ExternalLink,
  Eye,
  Calendar,
  Clock
} from 'lucide-react';
import { useClientPortalTokens, useCreatePortalToken, useDeletePortalToken, useUpdatePortalToken } from '@/hooks/useClientPortal';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface ClientPortalManagerProps {
  projectId: string;
  isOwner: boolean;
}

export const ClientPortalManager = ({ projectId, isOwner }: ClientPortalManagerProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteTokenId, setDeleteTokenId] = useState<string | null>(null);
  const [newLinkName, setNewLinkName] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  
  const { toast } = useToast();
  const { data: tokens, isLoading } = useClientPortalTokens(projectId);
  const createToken = useCreatePortalToken();
  const deleteToken = useDeletePortalToken();
  const updateToken = useUpdatePortalToken();

  if (!isOwner) return null;

  const handleCreate = async () => {
    if (!newLinkName.trim()) return;
    
    let expiresAt: string | undefined;
    if (expiresIn) {
      const days = parseInt(expiresIn);
      if (!isNaN(days) && days > 0) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        expiresAt = date.toISOString();
      }
    }

    await createToken.mutateAsync({
      projectId,
      name: newLinkName.trim(),
      expiresAt,
    });
    
    setIsCreateOpen(false);
    setNewLinkName('');
    setExpiresIn('');
  };

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/portal/${token}`;
    navigator.clipboard.writeText(url);
    toast({
      title: 'Link Copied',
      description: 'Client portal link copied to clipboard',
    });
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateToken.mutateAsync({
      id,
      projectId,
      updates: { is_active: !isActive },
    });
  };

  const handleDelete = async () => {
    if (!deleteTokenId) return;
    await deleteToken.mutateAsync({ id: deleteTokenId, projectId });
    setDeleteTokenId(null);
  };

  return (
    <Card className="bg-card/50 backdrop-blur border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              Client Portal
            </CardTitle>
            <CardDescription>
              Share read-only project views with stakeholders
            </CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Client Portal Link</DialogTitle>
                <DialogDescription>
                  Generate a shareable link for external stakeholders
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Link Name</Label>
                  <Input
                    placeholder="e.g., Client Review, Investor Update"
                    value={newLinkName}
                    onChange={(e) => setNewLinkName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires In (days, optional)</Label>
                  <Input
                    type="number"
                    placeholder="Leave empty for no expiration"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!newLinkName.trim() || createToken.isPending}>
                  Create Link
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4 text-muted-foreground">Loading...</div>
        ) : tokens && tokens.length > 0 ? (
          <div className="space-y-3">
            {tokens.map((token) => (
              <div
                key={token.id}
                className="p-4 rounded-lg bg-background/50 border border-border/50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{token.name}</span>
                    <Badge variant={token.is_active ? 'default' : 'secondary'}>
                      {token.is_active ? 'Active' : 'Disabled'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={token.is_active}
                      onCheckedChange={() => handleToggleActive(token.id, token.is_active)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {token.views_count} views
                  </span>
                  {token.expires_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Expires {format(new Date(token.expires_at), 'MMM d, yyyy')}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {format(new Date(token.created_at), 'MMM d')}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleCopyLink(token.token)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/portal/${token.token}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTokenId(token.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No portal links created yet</p>
            <p className="text-xs">Create a link to share project progress</p>
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!deleteTokenId} onOpenChange={() => setDeleteTokenId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Portal Link</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this link. Anyone using it will no longer have access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ClientPortalManager;
