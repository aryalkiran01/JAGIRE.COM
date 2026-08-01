/* eslint-disable @typescript-eslint/no-explicit-any */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookOpen, Upload, Trash2, Search, Loader as Loader2, FileText, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Clock, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import {
  uploadKnowledgeDocument,
  listKnowledgeDocuments,
  deleteKnowledgeDocument,
  searchKnowledgeBase,
} from "@/lib/knowledge-base.server";

export const Route = createFileRoute("/_authenticated/employer/knowledge-base")({
  head: () => ({ meta: [{ title: "Knowledge Base — Jagire" }] }),
  component: KnowledgeBasePage,
});

function KnowledgeBasePage() {
  const qc = useQueryClient();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchMode, setSearchMode] = useState<string>("");

  const listFn = useServerFn(listKnowledgeDocuments);
  const uploadFn = useServerFn(uploadKnowledgeDocument);
  const deleteFn = useServerFn(deleteKnowledgeDocument);
  const searchFn = useServerFn(searchKnowledgeBase);

  const { data: docData, isLoading } = useQuery({
    queryKey: ["kb-docs"],
    queryFn: async () => listFn(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (payload: {
      title: string;
      description: string;
      rawText: string;
      fileName: string;
      fileType: string;
      tags: string[];
    }) => uploadFn({ data: payload }),
    onSuccess: (res) => {
      toast.success(`Document processed: ${res.chunkCount} chunks created`);
      setUploadOpen(false);
      qc.invalidateQueries({ queryKey: ["kb-docs"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Upload failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => deleteFn({ data: { documentId: docId } }),
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["kb-docs"] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Delete failed"),
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => searchFn({ data: { query } }),
    onSuccess: (res) => {
      setSearchResults(res.results);
      setSearchMode(res.mode);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Search failed"),
  });

  function handleSearch() {
    const q = searchQuery.trim();
    if (!q) return;
    searchMutation.mutate(q);
  }

  const documents = docData?.documents ?? [];

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

      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shadow-md">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Knowledge Base</h1>
            <p className="text-sm text-muted-foreground">
              Upload documents to power AI with your company's knowledge
            </p>
          </div>
        </div>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-brand text-primary-foreground shadow-md">
              <Upload className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Knowledge Document</DialogTitle>
            </DialogHeader>
            <UploadForm
              onSubmit={(payload) => uploadMutation.mutate(payload)}
              pending={uploadMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="mb-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            Semantic Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search your knowledge base…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              disabled={searchMutation.isPending}
            />
            <Button
              onClick={handleSearch}
              disabled={!searchQuery.trim() || searchMutation.isPending}
              className="gradient-brand text-primary-foreground shadow-md"
            >
              {searchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>

          {searchResults !== null && (
            <div className="mt-4 space-y-3">
              {searchResults.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No matching results found.
                </p>
              ) : (
                <>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      {searchMode === "semantic"
                        ? "Semantic search"
                        : searchMode === "text"
                          ? "Text search"
                          : "No results"}
                    </Badge>
                    <span>{searchResults.length} results</span>
                  </div>
                  {searchResults.map((r, i) => (
                    <div key={i} className="rounded-lg border p-3 bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-primary">
                          {r.document_title}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {((r.similarity ?? 0) * 100).toFixed(0)}% match
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{r.content}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents list */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                No documents yet. Upload your first document to get started.
              </p>
              <Button onClick={() => setUploadOpen(true)} variant="outline" className="shadow-md">
                <Upload className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap mt-1">
                        <StatusBadge status={doc.status} />
                        <span>{doc.chunk_count} chunks</span>
                        {doc.file_name && <span>· {doc.file_name}</span>}
                        <span>· {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                          {doc.description}
                        </p>
                      )}
                      {doc.tags?.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {doc.tags.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete "${doc.title}"? This removes all its chunks.`)) {
                        deleteMutation.mutate(doc.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="text-destructive hover:text-destructive shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready")
    return (
      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
        <CheckCircle2 className="h-3 w-3" /> Ready
      </span>
    );
  if (status === "processing")
    return (
      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <Clock className="h-3 w-3" /> Processing
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex items-center gap-1 text-destructive">
        <AlertCircle className="h-3 w-3" /> Failed
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-muted-foreground">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

function UploadForm({
  onSubmit,
  pending,
}: {
  onSubmit: (payload: {
    title: string;
    description: string;
    rawText: string;
    fileName: string;
    fileType: string;
    tags: string[];
  }) => void;
  pending: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawText, setRawText] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));

    const text = await file.text();
    setRawText(text.slice(0, 100_000));
  }

  function handleSubmit() {
    if (!title.trim() || !rawText.trim()) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      rawText: rawText.trim(),
      fileName,
      fileType: "",
      tags: tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1.5 block">Title</label>
        <Input
          placeholder="e.g. Company FAQ"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
        <Input
          placeholder="Brief description of this document"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Upload text file</label>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.md,.csv,.json"
          onChange={handleFile}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Or paste text directly below. Supports .txt, .md, .csv, .json
        </p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Document text</label>
        <Textarea
          rows={6}
          placeholder="Paste document text here…"
          value={rawText}
          onChange={(e) => setRawText(e.target.value.slice(0, 100_000))}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {rawText.length.toLocaleString()} / 100,000 characters
        </p>
      </div>
      <div>
        <label className="text-sm font-medium mb-1.5 block">Tags (comma-separated)</label>
        <Input
          placeholder="e.g. onboarding, policy, faq"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!title.trim() || !rawText.trim() || pending}
        className="w-full gradient-brand text-primary-foreground shadow-md"
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing…
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Upload & Process
          </>
        )}
      </Button>
    </div>
  );
}
