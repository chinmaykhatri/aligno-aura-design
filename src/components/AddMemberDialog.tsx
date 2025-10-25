import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAddProjectMember } from "@/hooks/useProjects";

interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export const AddMemberDialog = ({ open, onOpenChange, projectId }: AddMemberDialogProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [selectedRole, setSelectedRole] = useState<'owner' | 'member'>('member');
  const [isSearching, setIsSearching] = useState(false);
  const addMember = useAddProjectMember();

  useEffect(() => {
    const searchProfiles = async () => {
      if (searchQuery.length < 2) {
        setProfiles([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .ilike("full_name", `%${searchQuery}%`)
          .limit(5);

        if (error) throw error;
        setProfiles(data || []);
      } catch (error) {
        console.error("Error searching profiles:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const debounce = setTimeout(searchProfiles, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleAddMember = () => {
    if (!selectedProfile) return;

    addMember.mutate(
      {
        projectId,
        userId: selectedProfile.user_id,
        role: selectedRole,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSearchQuery("");
          setSelectedProfile(null);
          setSelectedRole('member');
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Search for users to add to your project team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search Results */}
          {isSearching && (
            <div className="text-center py-4 text-muted-foreground">Searching...</div>
          )}

          {!isSearching && searchQuery.length >= 2 && profiles.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">No users found</div>
          )}

          {!isSearching && profiles.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {profiles.map((profile) => (
                <div
                  key={profile.user_id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-smooth ${
                    selectedProfile?.user_id === profile.user_id
                      ? 'bg-copper/10 border border-copper/30'
                      : 'bg-secondary/50 hover:bg-secondary'
                  }`}
                >
                  <Avatar className="w-10 h-10 border border-copper/40">
                    <AvatarFallback className="bg-gradient-copper text-deep-black text-sm font-medium">
                      {profile.full_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {profile.full_name || 'Unknown User'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Role Selection */}
          {selectedProfile && (
            <div className="space-y-3 pt-4 border-t border-border">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Selected User
                </label>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Avatar className="w-10 h-10 border border-copper/40">
                    <AvatarFallback className="bg-gradient-copper text-deep-black text-sm font-medium">
                      {selectedProfile.full_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {selectedProfile.full_name || 'Unknown User'}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Role
                </label>
                <Select value={selectedRole} onValueChange={(value: 'owner' | 'member') => setSelectedRole(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setSearchQuery("");
                setSelectedProfile(null);
                setSelectedRole('member');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedProfile || addMember.isPending}
              className="flex-1 bg-gradient-copper hover:opacity-90 transition-smooth"
            >
              Add Member
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
