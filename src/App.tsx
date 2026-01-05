import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Campaigns from "./pages/Campaigns";
import CampaignEditor from "./pages/CampaignEditor";
import Templates from "./pages/Templates";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Settings from "./pages/Settings";
import PlatformAdmin from "./pages/PlatformAdmin";
import SMS from "./pages/SMS";
import SMSContacts from "./pages/SMSContacts";
import SMSTemplates from "./pages/SMSTemplates";
import SMSHistory from "./pages/SMSHistory";
import EmailContacts from "./pages/EmailContacts";
import ConnectAgentBuddy from "./pages/ConnectAgentBuddy";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            
            {/* SMS Mode Routes */}
            <Route path="/sms" element={<ProtectedRoute><SMS /></ProtectedRoute>} />
            <Route path="/sms/contacts" element={<ProtectedRoute><SMSContacts /></ProtectedRoute>} />
            <Route path="/sms/templates" element={<ProtectedRoute><SMSTemplates /></ProtectedRoute>} />
            <Route path="/sms/history" element={<ProtectedRoute><SMSHistory /></ProtectedRoute>} />
            
            {/* Email Mode Routes (Admin Only) */}
            <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
            <Route path="/campaigns/:id/edit" element={<ProtectedRoute><CampaignEditor /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/email/contacts" element={<ProtectedRoute><EmailContacts /></ProtectedRoute>} />
            
            {/* Shared Routes */}
            <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/platform-admin" element={<ProtectedRoute><PlatformAdmin /></ProtectedRoute>} />
            <Route path="/connect/agentbuddy" element={<ConnectAgentBuddy />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
