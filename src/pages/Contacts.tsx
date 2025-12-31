import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Upload } from 'lucide-react';

export default function Contacts() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Contacts</h1>
            <p className="text-muted-foreground mt-1">
              Manage your email subscribers and contact lists
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button className="gradient-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." className="pl-10" />
        </div>

        {/* Empty State */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-display font-semibold">No contacts yet</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Add contacts manually, import from a CSV, or connect AgentBuddy to sync your customers automatically.
            </p>
            <div className="flex gap-3 mt-6">
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}