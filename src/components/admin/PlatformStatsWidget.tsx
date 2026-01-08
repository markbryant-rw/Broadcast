import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Globe, Shield, ArrowRight, Mail, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function PlatformStatsWidget() {
  const { user } = useAuth();

  // Check if user is platform admin
  const { data: isPlatformAdmin, isLoading: checkingAdmin } = useQuery({
    queryKey: ["isPlatformAdmin", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "platform_admin")
        .maybeSingle();
      
      return !!data;
    },
    enabled: !!user,
  });

  // Fetch platform stats (only if admin)
  const { data: stats } = useQuery({
    queryKey: ["platformStats"],
    queryFn: async () => {
      const [orgsResult, usersResult, domainsResult, campaignsResult] = await Promise.all([
        supabase.from("organizations").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("verified_domains").select("id, verified_at"),
        supabase.from("campaigns").select("id, status"),
      ]);

      const verifiedDomains = domainsResult.data?.filter(d => d.verified_at).length || 0;
      const pendingDomains = domainsResult.data?.filter(d => !d.verified_at).length || 0;
      const activeCampaigns = campaignsResult.data?.filter(c => c.status === "sending" || c.status === "scheduled").length || 0;

      return {
        totalOrgs: orgsResult.count || 0,
        totalUsers: usersResult.count || 0,
        verifiedDomains,
        pendingDomains,
        activeCampaigns,
      };
    },
    enabled: isPlatformAdmin,
  });

  if (checkingAdmin || !isPlatformAdmin) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle className="font-display">Platform Overview</CardTitle>
          </div>
          <Badge variant="default" className="text-xs">Admin</Badge>
        </div>
        <CardDescription>System-wide statistics</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span className="text-xs">Organizations</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalOrgs ?? 0}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">Users</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalUsers ?? 0}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-green-600">
              <CheckCircle className="h-3.5 w-3.5" />
              <span className="text-xs">Verified Domains</span>
            </div>
            <p className="text-2xl font-bold">{stats?.verifiedDomains ?? 0}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats?.pendingDomains ?? 0}</p>
          </div>
        </div>

        {stats?.activeCampaigns && stats.activeCampaigns > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{stats.activeCampaigns} active campaign{stats.activeCampaigns > 1 ? 's' : ''}</span>
          </div>
        )}

        <Link to="/platform-admin">
          <Button variant="outline" size="sm" className="w-full gap-2">
            Open Admin Panel
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
