import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ContactSMSList from '@/components/sms/ContactSMSList';
import SMSComposer from '@/components/sms/SMSComposer';
import SMSTemplateManager from '@/components/sms/SMSTemplateManager';
import SMSLogTable from '@/components/sms/SMSLogTable';
import NearbySalesWidget from '@/components/sms/NearbySalesWidget';

interface Contact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address?: string | null;
  address_suburb?: string | null;
}

export default function SMS() {
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">SMS</h1>
          <p className="text-muted-foreground mt-1">
            Send personalized SMS messages to your contacts
          </p>
        </div>

        <Tabs defaultValue="compose" className="space-y-6">
          <TabsList>
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Contact List */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Contacts</CardTitle>
                  <CardDescription>Select a contact to message</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="h-[500px]">
                    <ContactSMSList
                      selectedContactId={selectedContact?.id || null}
                      onSelectContact={setSelectedContact}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Composer */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Compose Message</CardTitle>
                  <CardDescription>
                    Write your message and click send to open your SMS app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SMSComposer 
                    contact={selectedContact}
                    onSent={() => {}}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Nearby Sales Widget */}
            <NearbySalesWidget />
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <SMSTemplateManager />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>SMS History</CardTitle>
                <CardDescription>
                  View all SMS messages sent through Broadcast
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SMSLogTable />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
