import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  profiles?: {
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface VerifiedDomain {
  id: string;
  organization_id: string;
  domain: string;
  verified_at: string | null;
  verification_token: string;
  created_at: string;
}

export const useOrganizations = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Organization[];
    },
    enabled: !!user,
  });

  const { data: currentOrgId } = useQuery({
    queryKey: ["currentOrganization"],
    queryFn: () => {
      return localStorage.getItem("currentOrganizationId") || null;
    },
    staleTime: Infinity,
  });

  const currentOrganization = organizations.find(org => org.id === currentOrgId) || organizations[0];

  const setCurrentOrganization = (orgId: string) => {
    localStorage.setItem("currentOrganizationId", orgId);
    queryClient.invalidateQueries({ queryKey: ["currentOrganization"] });
    queryClient.invalidateQueries({ queryKey: ["contacts"] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    queryClient.invalidateQueries({ queryKey: ["contactLists"] });
    queryClient.invalidateQueries({ queryKey: ["tags"] });
  };

  const createOrganization = useMutation({
    mutationFn: async ({ name, slug }: { name: string; slug: string }) => {
      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .insert({ name, slug })
        .select()
        .single();
      
      if (orgError) throw orgError;

      // Add current user as owner
      const { error: memberError } = await supabase
        .from("organization_members")
        .insert({
          organization_id: org.id,
          user_id: user!.id,
          role: 'owner'
        });
      
      if (memberError) throw memberError;

      return org as Organization;
    },
    onSuccess: (org) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      setCurrentOrganization(org.id);
      toast.success("Organization created successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create organization");
    },
  });

  return {
    organizations,
    isLoadingOrgs,
    currentOrganization,
    setCurrentOrganization,
    createOrganization,
  };
};

export const useOrganizationMembers = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["organizationMembers", organizationId],
    queryFn: async () => {
      // First get members
      const { data: membersData, error: membersError } = await supabase
        .from("organization_members")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("created_at");
      
      if (membersError) throw membersError;

      // Then get profiles for each member
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", userIds);
      
      if (profilesError) throw profilesError;

      // Combine the data
      const membersWithProfiles = membersData.map(member => ({
        ...member,
        profiles: profilesData.find(p => p.id === member.user_id) || undefined
      }));

      return membersWithProfiles as OrganizationMember[];
    },
    enabled: !!organizationId,
  });

  const inviteMember = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: 'admin' | 'member' }) => {
      // For now, we'll need to look up user by email
      // In production, you'd send an invite email
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .single();
      
      if (profileError) throw new Error("User not found with that email");

      const { error } = await supabase
        .from("organization_members")
        .insert({
          organization_id: organizationId!,
          user_id: profile.id,
          role
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationMembers", organizationId] });
      toast.success("Member added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add member");
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_members")
        .delete()
        .eq("id", memberId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizationMembers", organizationId] });
      toast.success("Member removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  return {
    members,
    isLoading,
    inviteMember,
    removeMember,
  };
};

export const useVerifiedDomains = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery({
    queryKey: ["verifiedDomains", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("verified_domains")
        .select("*")
        .eq("organization_id", organizationId!)
        .order("domain");
      
      if (error) throw error;
      return data as VerifiedDomain[];
    },
    enabled: !!organizationId,
  });

  const addDomain = useMutation({
    mutationFn: async (domain: string) => {
      const { data, error } = await supabase
        .from("verified_domains")
        .insert({
          organization_id: organizationId!,
          domain: domain.toLowerCase().trim()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as VerifiedDomain;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifiedDomains", organizationId] });
      toast.success("Domain added - verify DNS records to complete setup");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add domain");
    },
  });

  const verifyDomain = useMutation({
    mutationFn: async (domainId: string) => {
      // In production, you'd check DNS records here
      // For now, we'll just mark as verified
      const { error } = await supabase
        .from("verified_domains")
        .update({ verified_at: new Date().toISOString() })
        .eq("id", domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifiedDomains", organizationId] });
      toast.success("Domain verified successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to verify domain");
    },
  });

  const deleteDomain = useMutation({
    mutationFn: async (domainId: string) => {
      const { error } = await supabase
        .from("verified_domains")
        .delete()
        .eq("id", domainId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["verifiedDomains", organizationId] });
      toast.success("Domain removed");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove domain");
    },
  });

  return {
    domains,
    isLoading,
    addDomain,
    verifyDomain,
    deleteDomain,
  };
};
