import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import SettingsLayout from "@/components/layout/SettingsLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Building2, Users, Globe, Shield, Search, Trash2, CheckCircle, Clock, FileSpreadsheet } from "lucide-react";
import SalesUploader from "@/components/sales/SalesUploader";
import SalesDataTable from "@/components/sales/SalesDataTable";

export default function PlatformAdmin() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Check if user is platform admin
  const { data: isPlatformAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isPlatformAdmin", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "platform_admin")
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch all organizations
  const { data: organizations = [], refetch: refetchOrgs } = useQuery({
    queryKey: ["adminOrganizations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select(`
          *,
          organization_members(count),
          verified_domains(count)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isPlatformAdmin,
  });

  // Fetch all users (profiles)
  const { data: users = [], refetch: refetchUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          user_roles(role)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isPlatformAdmin,
  });

  // Fetch all verified domains
  const { data: domains = [], refetch: refetchDomains } = useQuery({
    queryKey: ["adminDomains"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verified_domains")
        .select(`
          *,
          organizations(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: isPlatformAdmin,
  });

  // Stats
  const stats = {
    totalOrgs: organizations.length,
    totalUsers: users.length,
    verifiedDomains: domains.filter((d: any) => d.verified_at).length,
    pendingDomains: domains.filter((d: any) => !d.verified_at).length,
  };

  const handleVerifyDomain = async (domainId: string) => {
    const { error } = await supabase
      .from("verified_domains")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", domainId);
    
    if (error) {
      toast.error("Failed to verify domain");
    } else {
      toast.success("Domain verified");
      refetchDomains();
    }
  };

  const handleDeleteOrg = async (orgId: string) => {
    const { error } = await supabase
      .from("organizations")
      .delete()
      .eq("id", orgId);
    
    if (error) {
      toast.error("Failed to delete organization");
    } else {
      toast.success("Organization deleted");
      refetchOrgs();
    }
  };

  const handleMakePlatformAdmin = async (userId: string) => {
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: "platform_admin" });
    
    if (error) {
      toast.error("Failed to add admin role");
    } else {
      toast.success("User is now a platform admin");
      refetchUsers();
    }
  };

  if (checkingAdmin) {
    return (
      <SettingsLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </SettingsLayout>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <SettingsLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground">You don't have platform admin privileges.</p>
        </div>
      </SettingsLayout>
    );
  }

  const filteredOrgs = organizations.filter((org: any) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter((u: any) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SettingsLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold">Platform Admin</h1>
            <p className="text-muted-foreground mt-1">
              Manage all organizations, users, and system settings
            </p>
          </div>
          <Badge variant="default" className="gap-1">
            <Shield className="h-3 w-3" />
            Admin
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Organizations</CardDescription>
              <CardTitle className="text-3xl">{stats.totalOrgs}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Total registered
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Users</CardDescription>
              <CardTitle className="text-3xl">{stats.totalUsers}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total registered
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Verified Domains</CardDescription>
              <CardTitle className="text-3xl">{stats.verifiedDomains}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Active & sending
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending Domains</CardDescription>
              <CardTitle className="text-3xl">{stats.pendingDomains}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm text-amber-600">
                <Clock className="h-4 w-4" />
                Awaiting verification
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search organizations or users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList>
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="domains" className="gap-2">
              <Globe className="h-4 w-4" />
              Domains
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Sales Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <Card>
              <CardHeader>
                <CardTitle>All Organizations</CardTitle>
                <CardDescription>Manage registered organizations</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Domains</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.map((org: any) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground">{org.slug}</TableCell>
                        <TableCell>{org.organization_members?.[0]?.count || 0}</TableCell>
                        <TableCell>{org.verified_domains?.[0]?.count || 0}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(org.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Organization?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete {org.name} and all associated data.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteOrg(org.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          No organizations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>Manage registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u: any) => {
                      const roles = u.user_roles?.map((r: any) => r.role) || [];
                      const isPlatformAdminUser = roles.includes("platform_admin");
                      
                      return (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">
                            {u.first_name && u.last_name
                              ? `${u.first_name} ${u.last_name}`
                              : "—"}
                          </TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>
                            <div className="flex gap-1 flex-wrap">
                              {roles.map((role: string) => (
                                <Badge 
                                  key={role} 
                                  variant={role === "platform_admin" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {role}
                                </Badge>
                              ))}
                              {roles.length === 0 && (
                                <span className="text-muted-foreground text-sm">No roles</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isPlatformAdminUser && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMakePlatformAdmin(u.id)}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Make Admin
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filteredUsers.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains">
            <Card>
              <CardHeader>
                <CardTitle>All Domains</CardTitle>
                <CardDescription>Manage verified sending domains</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Domain</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {domains.map((domain: any) => (
                      <TableRow key={domain.id}>
                        <TableCell className="font-medium">{domain.domain}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {domain.organizations?.name || "—"}
                        </TableCell>
                        <TableCell>
                          {domain.verified_at ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(domain.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {!domain.verified_at && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerifyDomain(domain.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {domains.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No domains found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales" className="space-y-6">
            <SalesUploader />
            <SalesDataTable />
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
}
