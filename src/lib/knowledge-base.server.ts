/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { requirePremium } from "@/lib/premium.server";
import { aiGenerateEmbedding } from "@/integrations/ai/ai-service";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length <= CHUNK_SIZE) return [clean];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = start + CHUNK_SIZE;
    if (end < clean.length) {
      const lastSpace = clean.lastIndexOf(" ", end);
      if (lastSpace > start + CHUNK_SIZE * 0.5) end = lastSpace;
    } else {
      end = clean.length;
    }
    chunks.push(clean.slice(start, end).trim());
    start = end - CHUNK_OVERLAP;
    if (start >= clean.length) break;
  }
  return chunks.filter((c) => c.length > 50);
}

async function getCompanyIdForUser(userId: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("You don't have a company. Create one first.");
  }
  return data.id;
}

// ── Upload document ────────────────────────────────────────────────────────────

export const uploadKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as {
      title: string;
      description?: string;
      fileUrl: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      tags?: string[];
      rawText: string;
    };
    if (!i?.title?.trim()) throw new Error("Title is required");
    if (!i?.rawText?.trim()) throw new Error("Document text is required");
    return {
      title: i.title.trim().slice(0, 200),
      description: (i.description ?? "").trim().slice(0, 500),
      fileUrl: i.fileUrl ?? "",
      fileName: i.fileName ?? "",
      fileType: i.fileType ?? "",
      fileSize: i.fileSize ?? 0,
      tags: i.tags ?? [],
      rawText: i.rawText.trim().slice(0, 100_000),
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const companyId = await getCompanyIdForUser(context.userId);

    const { data: doc, error: docError } = await supabaseAdmin
      .from("knowledge_documents")
      .insert({
        company_id: companyId,
        uploaded_by: context.userId,
        title: data.title,
        description: data.description,
        file_url: data.fileUrl,
        file_name: data.fileName,
        file_type: data.fileType,
        file_size: data.fileSize,
        status: "processing",
        tags: data.tags,
      })
      .select()
      .single();

    if (docError || !doc) throw new Error("Failed to create document record");

    try {
      const chunks = chunkText(data.rawText);

      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];
        let embedding: number[] | null = null;
        try {
          const embRes = await aiGenerateEmbedding(chunk);
          embedding = embRes.embedding;
        } catch {
          // Continue without embedding — chunk is still searchable by text
        }

        await supabaseAdmin.from("knowledge_chunks").insert({
          document_id: doc.id,
          company_id: companyId,
          chunk_index: idx,
          content: chunk,
          embedding: embedding ?? null,
          token_count: Math.ceil(chunk.length / 4),
          metadata: {},
        });
      }

      await supabaseAdmin
        .from("knowledge_documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);

      return { documentId: doc.id, chunkCount: chunks.length, status: "ready" };
    } catch (err) {
      await supabaseAdmin
        .from("knowledge_documents")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", doc.id);
      throw new Error(
        `Document processing failed: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  });

// ── List documents ─────────────────────────────────────────────────────────────

export const listKnowledgeDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getCompanyIdForUser(context.userId);

    const { data: docs, error } = await supabaseAdmin
      .from("knowledge_documents")
      .select("*")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Failed to fetch documents");
    return { documents: docs ?? [] };
  });

// ── Delete document ─────────────────────────────────────────────────────────────

export const deleteKnowledgeDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { documentId: string };
    if (!i?.documentId) throw new Error("Document ID is required");
    return { documentId: i.documentId };
  })
  .handler(async ({ data, context }) => {
    const companyId = await getCompanyIdForUser(context.userId);

    const { error } = await supabaseAdmin
      .from("knowledge_documents")
      .delete()
      .eq("id", data.documentId)
      .eq("company_id", companyId);

    if (error) throw new Error("Failed to delete document");
    return { success: true };
  });

// ── Semantic search (RAG retrieval) ─────────────────────────────────────────────

export const searchKnowledgeBase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { query: string; limit?: number };
    if (!i?.query?.trim()) throw new Error("Query is required");
    return { query: i.query.trim(), limit: i.limit ?? 5 };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const companyId = await getCompanyIdForUser(context.userId);

    let embedding: number[] | null = null;
    try {
      const embRes = await aiGenerateEmbedding(data.query);
      embedding = embRes.embedding;
    } catch {
      // Fall back to text search
    }

    if (embedding) {
      const { data: chunks, error } = await supabaseAdmin.rpc("search_knowledge_base", {
        query_embedding: embedding,
        match_company_id: companyId,
        match_limit: data.limit,
      });

      if (!error && chunks?.length) {
        return {
          results: chunks.map((c: any) => ({
            content: c.content,
            document_id: c.document_id,
            document_title: c.document_title,
            similarity: c.similarity,
            chunk_index: c.chunk_index,
          })),
          mode: "semantic" as const,
        };
      }
    }

    // Fallback: text search using pg_trgm similarity
    const { data: textChunks, error: textError } = await supabaseAdmin.rpc(
      "search_knowledge_base_text",
      {
        search_query: data.query,
        match_company_id: companyId,
        match_limit: data.limit,
      },
    );

    if (textError || !textChunks?.length) {
      return { results: [], mode: "none" as const };
    }

    return {
      results: textChunks.map((c: any) => ({
        content: c.content,
        document_id: c.document_id,
        document_title: c.document_title,
        similarity: c.similarity ?? 0,
        chunk_index: c.chunk_index,
      })),
      mode: "text" as const,
    };
  });

// ── Get RAG context for AI features ──────────────────────────────────────────────

export const getRagContext = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as { query: string; companyId?: string };
    if (!i?.query?.trim()) throw new Error("Query is required");
    return { query: i.query.trim(), companyId: i.companyId };
  })
  .handler(async ({ data, context }) => {
    let companyId = data.companyId;
    if (!companyId) {
      try {
        companyId = await getCompanyIdForUser(context.userId);
      } catch {
        return { context: "" };
      }
    }

    let embedding: number[] | null = null;
    try {
      const embRes = await aiGenerateEmbedding(data.query);
      embedding = embRes.embedding;
    } catch {
      return { context: "" };
    }

    const { data: chunks } = await supabaseAdmin.rpc("search_knowledge_base", {
      query_embedding: embedding,
      match_company_id: companyId,
      match_limit: 5,
    });

    if (!chunks?.length) return { context: "" };

    const contextText = chunks
      .map((c: any, i: number) => `[${i + 1}] From "${c.document_title}":\n${c.content}`)
      .join("\n\n---\n\n");

    return { context: contextText };
  });
