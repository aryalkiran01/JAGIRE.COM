import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/blog-editor")({ component: BlogEditor });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function BlogEditor() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);

  const { data: posts } = useQuery({
    queryKey: ["my-blogs", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("blogs").select("*").eq("author_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function save(p: any) {
    if (!user) return;
    const payload = {
      author_id: user.id,
      title: p.title, slug: p.slug || slugify(p.title),
      excerpt: p.excerpt || null, content: p.content,
      cover_url: p.cover_image || null,
      tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
      published: !!p.published,
    };
    const { error } = p.id
      ? await supabase.from("blogs").update(payload).eq("id", p.id)
      : await supabase.from("blogs").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["my-blogs"] });
  }
  async function del(id: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blogs").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["my-blogs"] });
  }

  if (editing) return <EditorForm post={editing} onCancel={() => setEditing(null)} onSave={save} />;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Blog editor</h1>
        <Button onClick={() => setEditing({ title: "", slug: "", content: "", published: false })}>
          <Plus className="h-4 w-4 mr-1" />New post
        </Button>
      </div>
      <div className="space-y-3">
        {posts?.map((p) => (
          <Card key={p.id}><CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{p.title}</div>
              <div className="text-xs text-muted-foreground">/{p.slug}</div>
            </div>
            <Badge variant={p.published ? "default" : "secondary"}>{p.published ? "Published" : "Draft"}</Badge>
            <Button size="icon" variant="ghost" onClick={() => setEditing(p)}><Pencil className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" onClick={() => del(p.id)}><Trash2 className="h-4 w-4" /></Button>
          </CardContent></Card>
        ))}
        {posts?.length === 0 && <p className="text-center text-muted-foreground py-12">No posts yet.</p>}
      </div>
    </div>
  );
}

function EditorForm({ post, onCancel, onSave }: { post: any; onCancel: () => void; onSave: (p: any) => void }) {
  const [p, setP] = useState({ ...post, cover_image: post.cover_url ?? post.cover_image ?? "", tags: Array.isArray(post.tags) ? post.tags.join(", ") : (post.tags ?? "") });
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card><CardHeader><CardTitle>{post.id ? "Edit post" : "New post"}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label>Title</Label><Input value={p.title} onChange={(e) => setP({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) })} /></div>
          <div><Label>Slug</Label><Input value={p.slug} onChange={(e) => setP({ ...p, slug: e.target.value })} /></div>
          <div><Label>Cover image URL</Label><Input value={p.cover_image ?? ""} onChange={(e) => setP({ ...p, cover_image: e.target.value })} /></div>
          <div><Label>Excerpt</Label><Textarea rows={2} value={p.excerpt ?? ""} onChange={(e) => setP({ ...p, excerpt: e.target.value })} /></div>
          <div><Label>Content (markdown)</Label><Textarea rows={14} value={p.content ?? ""} onChange={(e) => setP({ ...p, content: e.target.value })} /></div>
          <div><Label>Tags (comma-separated)</Label><Input value={p.tags} onChange={(e) => setP({ ...p, tags: e.target.value })} /></div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!p.published} onChange={(e) => setP({ ...p, published: e.target.checked })} /> Publish</label>
          <div className="flex gap-2"><Button onClick={() => onSave(p)} className="gradient-brand text-primary-foreground">Save</Button><Button variant="outline" onClick={onCancel}>Cancel</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}