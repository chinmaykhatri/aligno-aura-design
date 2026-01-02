import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Settings, Crown, UserCog, AlertTriangle, FolderKanban, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useUpdateUserRole, AppRole } from "@/hooks/useUserRole";
import { useAdminUsers, useAdminProjects } from "@/hooks/useAdminData";
import Navigation from "@/components/Navigation";
import { format } from "date-fns";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: projects, isLoading: projectsLoading } = useAdminProjects();
  const updateRole = useUpdateUserRole();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setCurrentUserId(session.user.id);
      }
    });
  }, [navigate]);

  // Redirect non-admins
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, roleLoading, navigate]);

  if (roleLoading || usersLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copper" />
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-6 py-24 text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = (userId: string, newRole: AppRole) => {
    updateRole.mutate({ userId, role: newRole });
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-3 h-3 mr-1" />;
      case 'moderator':
        return <Shield className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'archived':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const stats = {
    totalUsers: users?.length || 0,
    admins: users?.filter(u => u.role === 'admin').length || 0,
    moderators: users?.filter(u => u.role === 'moderator').length || 0,
    regularUsers: users?.filter(u => u.role === 'user').length || 0,
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter(p => p.status === 'active').length || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-copper flex items-center justify-center">
            <Shield className="w-6 h-6 text-deep-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, projects, and system settings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-copper" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-3xl font-bold text-foreground">{stats.admins}</p>
                </div>
                <Crown className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Moderators</p>
                  <p className="text-3xl font-bold text-foreground">{stats.moderators}</p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Regular Users</p>
                  <p className="text-3xl font-bold text-foreground">{stats.regularUsers}</p>
                </div>
                <UserCog className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-3xl font-bold text-foreground">{stats.totalProjects}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border/40">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                  <p className="text-3xl font-bold text-foreground">{stats.activeProjects}</p>
                </div>
                <FolderKanban className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-secondary/50">
            <TabsTrigger value="users" className="data-[state=active]:bg-copper data-[state=active]:text-deep-black">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-copper data-[state=active]:text-deep-black">
              <FolderKanban className="w-4 h-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-copper data-[state=active]:text-deep-black">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage user roles and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Last Sign In</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-secondary text-foreground text-xs">
                                {user.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-foreground">
                                {user.full_name || 'Unknown User'}
                                {user.user_id === currentUserId && (
                                  <span className="text-xs text-copper ml-2">(You)</span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">{user.user_id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            {user.email || 'No email'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center w-fit">
                            {getRoleIcon(user.role)}
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {format(new Date(user.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {user.last_sign_in_at 
                            ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')
                            : 'Never'}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.user_id, value as AppRole)}
                            disabled={user.user_id === currentUserId}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
                <CardDescription>View all projects across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-copper" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects?.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {project.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm text-foreground">
                                {project.owner_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {project.owner_email || 'No email'}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(project.status)}>
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={project.progress} className="w-16 h-2" />
                              <span className="text-sm text-muted-foreground">{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{project.member_count}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(project.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!projects || projects.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No projects found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="bg-card border-border/40">
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure system-wide settings and feature flags</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-secondary/30 rounded-lg border border-border/40">
                  <h3 className="font-semibold text-foreground mb-2">Feature Gating (Coming Soon)</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure which features are available for Free, Pro, and Business users.
                    This will be enabled after Stripe integration.
                  </p>
                </div>
                
                <div className="p-4 bg-secondary/30 rounded-lg border border-border/40">
                  <h3 className="font-semibold text-foreground mb-2">Admin Privileges</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    As an admin, you have access to all features regardless of subscription tier.
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>✓ All AI features unlocked</li>
                    <li>✓ Unlimited projects</li>
                    <li>✓ Client portal access</li>
                    <li>✓ Advanced integrations</li>
                    <li>✓ User management</li>
                    <li>✓ View all platform projects</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
