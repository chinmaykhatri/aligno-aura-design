import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Link2, Hash, Copy, Check, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  useCreateEmailInvitation,
  useCreateLinkInvitation,
  useCreateCodeInvitation,
  useProjectInvitations,
  useRevokeInvitation,
} from "@/hooks/useProjectInvitations";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(['member', 'admin']),
});

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const InviteMemberDialog = ({
  open,
  onOpenChange,
  projectId,
}: InviteMemberDialogProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkRole, setLinkRole] = useState<string>('member');
  const [codeRole, setCodeRole] = useState<string>('member');
  const [linkMaxUses, setLinkMaxUses] = useState<string>('unlimited');
  const [codeMaxUses, setCodeMaxUses] = useState<string>('1');

  const { data: invitations = [], isLoading } = useProjectInvitations(projectId);
  const createEmailInvite = useCreateEmailInvitation();
  const createLinkInvite = useCreateLinkInvitation();
  const createCodeInvite = useCreateCodeInvitation();
  const revokeInvitation = useRevokeInvitation();

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');

  const handleEmailSubmit = async (values: z.infer<typeof emailSchema>) => {
    await createEmailInvite.mutateAsync({
      projectId,
      email: values.email,
      role: values.role,
    });
    form.reset();
  };

  const handleCreateLink = async () => {
    await createLinkInvite.mutateAsync({
      projectId,
      role: linkRole,
      maxUses: linkMaxUses === 'unlimited' ? null : parseInt(linkMaxUses),
    });
  };

  const handleCreateCode = async () => {
    await createCodeInvite.mutateAsync({
      projectId,
      role: codeRole,
      maxUses: parseInt(codeMaxUses),
    });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getInviteLink = (token: string) => {
    return `${window.location.origin}/join?token=${token}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Invite Team Members
          </DialogTitle>
          <DialogDescription>
            Choose how you want to invite people to join this project.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-1.5">
              <Link2 className="h-4 w-4" />
              Link
            </TabsTrigger>
            <TabsTrigger value="code" className="flex items-center gap-1.5">
              <Hash className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4 mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="colleague@company.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createEmailInvite.isPending}
                >
                  {createEmailInvite.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role for invited members</Label>
                <Select value={linkRole} onValueChange={setLinkRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Select value={linkMaxUses} onValueChange={setLinkMaxUses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unlimited">Unlimited</SelectItem>
                    <SelectItem value="1">1 use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateLink} 
                className="w-full"
                disabled={createLinkInvite.isPending}
              >
                {createLinkInvite.isPending ? "Creating..." : "Generate Invite Link"}
              </Button>
            </div>

            {/* Show existing link invitations */}
            {pendingInvitations.filter(i => i.invitation_type === 'link').length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-muted-foreground text-xs">Active Links</Label>
                <ScrollArea className="h-[120px]">
                  {pendingInvitations
                    .filter(i => i.invitation_type === 'link')
                    .map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {inv.max_uses ? `${inv.use_count}/${inv.max_uses} used` : 'Unlimited'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Expires {format(new Date(inv.expires_at!), 'MMM d')}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(getInviteLink(inv.invite_token!), inv.id)}
                          >
                            {copiedId === inv.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => revokeInvitation.mutate({ invitationId: inv.id, projectId })}
                          >
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="code" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Role for invited members</Label>
                <Select value={codeRole} onValueChange={setCodeRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Max uses</Label>
                <Select value={codeMaxUses} onValueChange={setCodeMaxUses}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 use</SelectItem>
                    <SelectItem value="5">5 uses</SelectItem>
                    <SelectItem value="10">10 uses</SelectItem>
                    <SelectItem value="25">25 uses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCreateCode} 
                className="w-full"
                disabled={createCodeInvite.isPending}
              >
                {createCodeInvite.isPending ? "Creating..." : "Generate Invite Code"}
              </Button>
            </div>

            {/* Show existing code invitations */}
            {pendingInvitations.filter(i => i.invitation_type === 'code').length > 0 && (
              <div className="space-y-2 pt-4 border-t">
                <Label className="text-muted-foreground text-xs">Active Codes</Label>
                <ScrollArea className="h-[120px]">
                  {pendingInvitations
                    .filter(i => i.invitation_type === 'code')
                    .map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 mb-2">
                        <div className="flex items-center gap-3">
                          <code className="bg-primary/10 px-3 py-1 rounded font-mono text-lg font-bold tracking-widest">
                            {inv.invite_code}
                          </code>
                          <Badge variant="outline" className="text-xs">
                            {inv.use_count}/{inv.max_uses} used
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(inv.invite_code!, inv.id)}
                          >
                            {copiedId === inv.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => revokeInvitation.mutate({ invitationId: inv.id, projectId })}
                          >
                            Revoke
                          </Button>
                        </div>
                      </div>
                    ))}
                </ScrollArea>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Pending email invitations */}
        {pendingInvitations.filter(i => i.invitation_type === 'email').length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <Label className="text-muted-foreground text-xs">Pending Email Invitations</Label>
            <ScrollArea className="h-[100px]">
              {pendingInvitations
                .filter(i => i.invitation_type === 'email')
                .map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{inv.email}</span>
                      <Badge variant="outline" className="text-xs capitalize">{inv.role}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => revokeInvitation.mutate({ invitationId: inv.id, projectId })}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
