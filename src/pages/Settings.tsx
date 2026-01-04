import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useUserSettings, useUpdateUserSettings } from '@/hooks/useUserSettings';
import { DomainManager } from '@/components/organizations/DomainManager';
import { OrganizationSettings } from '@/components/organizations/OrganizationSettings';
import SMSTemplateManager from '@/components/sms/SMSTemplateManager';
import { BulkGeocoder } from '@/components/settings/BulkGeocoder';
import { User, Mail, Shield, Bell, Loader2, Building2, MessageSquare, Timer, Target, MapPin, Database } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { currentOrganization } = useOrganizations();
  const { data: userSettings } = useUserSettings();
  const updateSettings = useUpdateUserSettings();
  const [isSaving, setIsSaving] = useState(false);

  const userInitials = user?.user_metadata?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U';

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: 'Settings saved',
      description: 'Your preferences have been updated.',
    });
  };

  const handleCooldownChange = (value: string) => {
    updateSettings.mutate({ cooldownDays: parseInt(value) });
  };

  const handleRadiusChange = (value: string) => {
    updateSettings.mutate({ searchRadiusMeters: parseInt(value) });
  };

  const handleContactGoalChange = (value: string) => {
    updateSettings.mutate({ weeklyContactGoal: parseInt(value) });
  };

  const handleSmsGoalChange = (value: string) => {
    updateSettings.mutate({ weeklySmSGoal: parseInt(value) });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="flex-wrap">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="prospecting" className="gap-2">
              <Timer className="h-4 w-4" />
              Prospecting
            </TabsTrigger>
            <TabsTrigger value="organization" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
            <TabsTrigger value="sms-templates" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS Templates
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Profile Information</CardTitle>
                <CardDescription>Update your personal details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">Change Avatar</Button>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue={user?.user_metadata?.first_name || ''}
                      placeholder="John"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      defaultValue={user?.user_metadata?.last_name || ''}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.email || ''}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email address.
                  </p>
                </div>

                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="prospecting" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  Prospecting Settings
                </CardTitle>
                <CardDescription>Configure your SMS prospecting preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="cooldown">Contact Cooldown Period</Label>
                  <Select
                    value={userSettings?.cooldownDays?.toString() || '7'}
                    onValueChange={handleCooldownChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select cooldown" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="7">7 days (default)</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Contacts who have been messaged within this period will be hidden from opportunities to avoid over-contacting.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="radius" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Search Radius
                  </Label>
                  <Select
                    value={userSettings?.searchRadiusMeters?.toString() || '500'}
                    onValueChange={handleRadiusChange}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select radius" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="250">250m</SelectItem>
                      <SelectItem value="500">500m (default)</SelectItem>
                      <SelectItem value="750">750m</SelectItem>
                      <SelectItem value="1000">1km</SelectItem>
                      <SelectItem value="2000">2km</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How far from each sale to look for opportunities.
                  </p>
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Weekly Goals
                  </Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contact-goal" className="text-sm font-normal text-muted-foreground">Contacts Goal</Label>
                      <Select
                        value={userSettings?.weeklyContactGoal?.toString() || '50'}
                        onValueChange={handleContactGoalChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="25">25 contacts</SelectItem>
                          <SelectItem value="50">50 contacts (default)</SelectItem>
                          <SelectItem value="75">75 contacts</SelectItem>
                          <SelectItem value="100">100 contacts</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sms-goal" className="text-sm font-normal text-muted-foreground">SMS Goal</Label>
                      <Select
                        value={userSettings?.weeklySmSGoal?.toString() || '100'}
                        onValueChange={handleSmsGoalChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select goal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50 SMS</SelectItem>
                          <SelectItem value="100">100 SMS (default)</SelectItem>
                          <SelectItem value="150">150 SMS</SelectItem>
                          <SelectItem value="200">200 SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Celebrate when you hit these weekly targets! 🎉
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="organization" className="mt-6 space-y-6">
            <DomainManager organizationId={currentOrganization?.id} />
            <OrganizationSettings organizationId={currentOrganization?.id} />
          </TabsContent>

          <TabsContent value="sms-templates" className="mt-6">
            <SMSTemplateManager />
          </TabsContent>

          <TabsContent value="email" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Email Settings</CardTitle>
                <CardDescription>Configure your email sending preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="senderName">Default Sender Name</Label>
                  <Input
                    id="senderName"
                    placeholder="Your Company"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="replyTo">Reply-To Address</Label>
                  <Input
                    id="replyTo"
                    type="email"
                    placeholder="reply@yourcompany.com"
                  />
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Security</CardTitle>
                <CardDescription>Manage your password and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                  />
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Password
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display">Notification Preferences</CardTitle>
                <CardDescription>Choose what notifications you receive</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Notification settings coming soon.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="mt-6 space-y-6">
            <BulkGeocoder />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
