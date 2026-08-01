/* eslint-disable @typescript-eslint/no-explicit-any */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Building2, ScrollText, KeyRound, Plus, Trash2, Copy, Check, Loader as Loader2, ArrowLeft, TriangleAlert as AlertTriangle, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import {
  listDepartments,
  createDepartment,
  deleteDepartment,
  listAuditLogs,
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from "@/lib/enterprise.server";

export const Route = createFileRoute("/_authenticated/enterprise")({
  head: () => ({ meta: [{ title: "Enterprise — Jagire" }] }),
  component: EnterprisePage,
});

function EnterprisePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/employer">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-md">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Enterprise Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage departments, audit logs, and API access
          </p>
        </div>
      </div>

      <Tabs defaultValue="departments">
        <TabsList className="mb-4">
          <TabsTrigger value="departments" className="gap-1.5">
            <Building2 className="h-4 w-4" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5">
            <ScrollText className="h-4 w-4" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="api-keys" className="gap-1.5">
            <KeyRound className="h-4 w-4" />
            API Keys
          </TabsTrigger>
        </TabsList>

        <TabsContent value="departments">
          <DepartmentsTab />
        </TabsContent>
        <TabsContent value="audit">
          <AuditLogsTab />
        </TabsContent>
        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Departments Tab ──────────────────────────────────────────────────────────────

function DepartmentsTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const listFn = useServerFn(listDepartments);
  const createFn = useServerFn(createDepartment);
  const deleteFn = useServerFn(deleteDepartment);

  const { data, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => listFn(),
  });

  const createMut = useMutation({
    mutationFn: async (payload: { name: string; description: string }) =>
      createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Department created");
      setOpen(false);
      setName("");
      setDescription("");
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { departmentId: id } }),
    onSuccess: () => {
      toast.success("Department deleted");
      qc.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const departments = data?.departments ?? [];

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Departments ({departments.length})</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-brand text-primary-foreground shadow-md">
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Department</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  placeholder="e.g. Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <Textarea
                  rows={3}
                  placeholder="What does this department do?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <Button
                onClick={() => createMut.mutate({ name, description })}
                disabled={!name.trim() || createMut.isPending}
                className="w-full gradient-brand text-primary-foreground shadow-md"
              >
                {createMut.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Create Department
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No departments yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {departments.map((dept: any) => (
              <div
                key={dept.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div>
                  <div className="font-medium">{dept.name}</div>
                  {dept.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{dept.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">
                    {dept.members?.[0]?.count ?? 0} members
                    {dept.head?.full_name ? ` · Head: ${dept.head.full_name}` : ""}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${dept.name}"?`)) deleteMut.mutate(dept.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Audit Logs Tab ───────────────────────────────────────────────────────────────

function AuditLogsTab() {
  const listFn = useServerFn(listAuditLogs);
  const { data, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => listFn({ data: { limit: 50 } }),
  });

  const logs = data?.logs ?? [];

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg">Audit Logs</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ScrollText className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No audit entries yet.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ScrollText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {log.action}
                    </Badge>
                    {log.entity_type && (
                      <span className="text-xs text-muted-foreground">
                        {log.entity_type}
                        {log.entity_id ? `:${log.entity_id.slice(0, 8)}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {log.user?.full_name ?? "System"} · {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <pre className="text-xs text-muted-foreground mt-1 bg-muted/50 rounded p-1.5 overflow-x-auto">
                      {JSON.stringify(log.metadata, null, 0)}
                    </pre>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── API Keys Tab ──────────────────────────────────────────────────────────────────

function ApiKeysTab() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const listFn = useServerFn(listApiKeys);
  const createFn = useServerFn(createApiKey);
  const revokeFn = useServerFn(revokeApiKey);

  const { data, isLoading } = useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => listFn(),
  });

  const createMut = useMutation({
    mutationFn: async (payload: { name: string }) => createFn({ data: payload }),
    onSuccess: (res) => {
      setCreatedKey(res.rawKey);
      setName("");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const revokeMut = useMutation({
    mutationFn: async (id: string) => revokeFn({ data: { keyId: id } }),
    onSuccess: () => {
      toast.success("API key revoked");
      qc.invalidateQueries({ queryKey: ["api-keys"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const keys = data?.keys ?? [];

  function copyKey() {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">API Keys ({keys.length})</CardTitle>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) setCreatedKey(null);
          }}
        >
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-brand text-primary-foreground shadow-md">
              <Plus className="mr-1 h-4 w-4" />
              Generate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{createdKey ? "Save Your API Key" : "Create API Key"}</DialogTitle>
            </DialogHeader>
            {createdKey ? (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4">
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      Copy this key now — you won't see it again.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Input readOnly value={createdKey} className="font-mono text-xs" />
                    <Button onClick={copyKey} variant="outline" size="sm">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={() => setOpen(false)}
                  className="w-full gradient-brand text-primary-foreground shadow-md"
                >
                  Done
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Key Name</label>
                  <Input
                    placeholder="e.g. Production API"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => createMut.mutate({ name })}
                  disabled={!name.trim() || createMut.isPending}
                  className="w-full gradient-brand text-primary-foreground shadow-md"
                >
                  {createMut.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="mr-2 h-4 w-4" />
                  )}
                  Generate Key
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <KeyRound className="mx-auto h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">No API keys yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {keys.map((key: any) => (
              <div
                key={key.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    {key.name}
                    {key.revoked_at && (
                      <Badge variant="destructive" className="text-xs">
                        Revoked
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 font-mono">
                    {key.key_prefix}…
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    Created {new Date(key.created_at).toLocaleDateString()}
                    {key.last_used_at &&
                      ` · Last used ${new Date(key.last_used_at).toLocaleDateString()}`}
                    {key.expires_at &&
                      ` · Expires ${new Date(key.expires_at).toLocaleDateString()}`}
                  </div>
                </div>
                {!key.revoked_at && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm(`Revoke "${key.name}"? This cannot be undone.`)) {
                        revokeMut.mutate(key.id);
                      }
                    }}
                  >
                    Revoke
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
