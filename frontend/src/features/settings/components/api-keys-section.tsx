'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  IconKey,
  IconPlus,
  IconTrash,
  IconCopy,
  IconEye,
  IconEyeOff,
} from '@tabler/icons-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string | null;
  isActive: boolean;
}

export function ApiKeysSection() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Development Key',
      key: 'sk_test_abc123xyz789',
      created: '2024-01-15',
      lastUsed: '2024-02-20',
      isActive: true,
    },
  ]);
  const [isNewKeyDialogOpen, setIsNewKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showKey, setShowKey] = useState<string | null>(null);

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error('Please enter a name for the API key');
      return;
    }

    const newKey: ApiKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: `sk_test_${Math.random().toString(36).substring(2, 15)}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: null,
      isActive: true,
    };

    setApiKeys([...apiKeys, newKey]);
    setNewKeyName('');
    setIsNewKeyDialogOpen(false);
    toast.success('API key created successfully');
    setShowKey(newKey.key);
  };

  const handleRevokeKey = (id: string) => {
    setApiKeys(apiKeys.filter((key) => key.id !== id));
    toast.success('API key revoked');
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const handleToggleKeyVisibility = (key: string) => {
    setShowKey(showKey === key ? null : key);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">API Keys</CardTitle>
          <Dialog
            open={isNewKeyDialogOpen}
            onOpenChange={setIsNewKeyDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <IconPlus className="mr-2 size-4" />
                Create New Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New API Key</DialogTitle>
                <DialogDescription>
                  Create a new API key to access the EssayCoach API. Make sure
                  to copy your key before closing this dialog.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="key-name">Key Name</Label>
                  <Input
                    id="key-name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Production Key"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewKeyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateKey}>Create Key</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <IconKey className="mb-4 size-12 text-muted-foreground" />
            <p className="text-muted-foreground">No API keys found</p>
            <p className="text-sm text-muted-foreground">
              Create a new key to access the API
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">{apiKey.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <code className="relative rounded bg-muted px-2 py-1 text-sm font-mono">
                      {showKey === apiKey.key
                        ? apiKey.key
                        : '••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopyKey(apiKey.key)}
                    >
                      <IconCopy className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleKeyVisibility(apiKey.key)}
                    >
                      {showKey === apiKey.key ? (
                        <IconEyeOff className="size-4" />
                      ) : (
                        <IconEye className="size-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>{apiKey.created}</TableCell>
                  <TableCell>
                    {apiKey.lastUsed || 'Never used'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.isActive ? 'default' : 'secondary'}>
                      {apiKey.isActive ? 'Active' : 'Revoked'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeKey(apiKey.id)}
                      className="text-destructive"
                    >
                      <IconTrash className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <div className="mt-4 rounded-md bg-blue-50 p-4 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
          <p className="text-sm font-medium">Security Notice</p>
          <p className="mt-1 text-sm">
            API keys have full access to your account. Never share your keys
            publicly or commit them to version control. Revoke any keys you no
            longer use.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
