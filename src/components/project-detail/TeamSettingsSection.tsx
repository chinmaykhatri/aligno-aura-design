import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, MoreVertical, Settings, Users, Link2, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientPortalManager } from "@/components/ClientPortalManager";
import { IntegrationsManager } from "@/components/IntegrationsManager";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    full_name: string | null;
  };
}

interface TeamSettingsSectionProps {
  projectId: string;
  projectName: string;
  members: TeamMember[];
  isOwner: boolean;
  currentUserId: string | null;
  createdAt: string;
  updatedAt: string;
  onAddMember: () => void;
  onRemoveMember: (memberId: string) => void;
}

export const TeamSettingsSection = ({
  projectId,
  projectName,
  members,
  isOwner,
  currentUserId,
  createdAt,
  updatedAt,
  onAddMember,
  onRemoveMember,
}: TeamSettingsSectionProps) => {
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [showPortal, setShowPortal] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-1 w-8 rounded-full bg-cyan-500" />
        <h2 className="text-xl font-semibold text-foreground">Team & Settings</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Team Members */}
        <div className="p-6 rounded-2xl bg-card border border-border/40">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-foreground">Team</h3>
            </div>
            {isOwner && (
              <Button variant="outline" size="sm" onClick={onAddMember} className="border-cyan-500/30 hover:bg-cyan-500/10">
                <UserPlus className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/30"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9 border border-copper/40">
                    <AvatarFallback className="bg-gradient-copper text-deep-black text-xs font-medium">
                      {member.profiles?.full_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {member.profiles?.full_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                  </div>
                </div>
                
                {isOwner && member.user_id !== currentUserId && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem
                        onClick={() => onRemoveMember(member.id)}
                        className="text-destructive cursor-pointer"
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

        {/* Project Details */}
        <div className="p-6 rounded-2xl bg-card border border-border/40">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-foreground">Details</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Created</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(createdAt).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {new Date(updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30 space-y-2">
              <Collapsible open={showPortal} onOpenChange={setShowPortal}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-foreground">Client Portal</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showPortal && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 animate-fade-in">
                    <ClientPortalManager projectId={projectId} isOwner={isOwner} />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={showIntegrations} onOpenChange={setShowIntegrations}>
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-sm font-medium text-foreground">Integrations</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showIntegrations && "rotate-180")} />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-2 animate-fade-in">
                    <IntegrationsManager projectId={projectId} projectName={projectName} isOwner={isOwner} />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
