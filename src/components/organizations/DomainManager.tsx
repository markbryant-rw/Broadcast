import { useState } from "react";
import { Plus, Trash2, CheckCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useVerifiedDomains, VerifiedDomain } from "@/hooks/useOrganizations";
import { toast } from "sonner";

interface DomainManagerProps {
  organizationId: string | undefined;
}

export function DomainManager({ organizationId }: DomainManagerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<VerifiedDomain | null>(null);
  
  const { domains, isLoading, addDomain, verifyDomain, deleteDomain } = useVerifiedDomains(organizationId);

  const handleAddDomain = async () => {
    if (!newDomain) return;
    
    await addDomain.mutateAsync(newDomain);
    setNewDomain("");
    setShowAddDialog(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!organizationId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verified Domains</CardTitle>
          <CardDescription>Select an organization to manage domains</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Verified Domains</CardTitle>
              <CardDescription>
                Verify your domain to send emails from your agency addresses
              </CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Domain</DialogTitle>
                  <DialogDescription>
                    Enter the domain you want to verify for sending emails
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder="raywhite.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddDomain} disabled={!newDomain || addDomain.isPending}>
                    {addDomain.isPending ? "Adding..." : "Add Domain"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : domains.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No domains added yet. Add a domain to start sending emails from your agency addresses.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">{domain.domain}</TableCell>
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
                      <div className="flex items-center justify-end gap-2">
                        {!domain.verified_at && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedDomain(domain)}
                          >
                            Setup DNS
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteDomain.mutate(domain.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DNS Setup Dialog */}
      <Dialog open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>DNS Setup for {selectedDomain?.domain}</DialogTitle>
            <DialogDescription>
              Add these DNS records to verify your domain
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">1. SPF Record</h4>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="flex-1 truncate">
                  v=spf1 include:_spf.resend.com ~all
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard("v=spf1 include:_spf.resend.com ~all")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Type: TXT | Host: @ | Value: v=spf1 include:_spf.resend.com ~all
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">2. DKIM Record</h4>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="flex-1 truncate">
                  resend._domainkey.{selectedDomain?.domain}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(`resend._domainkey.${selectedDomain?.domain}`)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Add this CNAME record in your DNS settings
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <h4 className="font-medium">3. Verification Token</h4>
              <div className="flex items-center gap-2 bg-muted p-2 rounded text-sm font-mono">
                <span className="flex-1 truncate">
                  {selectedDomain?.verification_token}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(selectedDomain?.verification_token || "")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Type: TXT | Host: _resend | Value: {selectedDomain?.verification_token}
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ExternalLink className="h-4 w-4" />
              <a 
                href="https://resend.com/domains" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                Also add this domain in your Resend dashboard
              </a>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDomain(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedDomain) {
                  verifyDomain.mutate(selectedDomain.id);
                  setSelectedDomain(null);
                }
              }}
              disabled={verifyDomain.isPending}
            >
              {verifyDomain.isPending ? "Verifying..." : "Mark as Verified"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
