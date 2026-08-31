/* eslint-disable @typescript-eslint/no-explicit-any */

import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth.middleware";
import { requirePremium } from "@/lib/premium.server";
import { aiGenerateEmbedding } from "@/integrations/ai/ai-service";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import pdf from "pdf-parse";

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 200;

function chunkText(text: string): string[] {
  // Ensure text is a valid string
  if (!text || typeof text !== "string") {
    return [];
  }

  const clean = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // If text is short enough, return as single chunk
  if (clean.length <= CHUNK_SIZE) {
    return clean.length > 0 ? [clean] : [];
  }

  const chunks: string[] = [];
  let start = 0;
  const maxIterations = Math.ceil(clean.length / (CHUNK_SIZE - CHUNK_OVERLAP)) + 10; // Safety limit

  let iterations = 0;
  while (start < clean.length && iterations < maxIterations) {
    iterations++;

    let end = start + CHUNK_SIZE;

    // If we're past the string length, just go to the end
    if (end >= clean.length) {
      end = clean.length;
    } else {
      // Try to find a good break point
      const lastSpace = clean.lastIndexOf(" ", end);
      const lastNewline = clean.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastSpace, lastNewline);

      if (breakPoint > start + 100) {
        // Found a good break point
        end = breakPoint;
      }
      // If no good break point found, use the hard cutoff at CHUNK_SIZE
    }

    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    // Move start forward, with overlap
    start = end - CHUNK_OVERLAP;

    // Prevent infinite loops
    if (start >= clean.length || end >= clean.length) break;
    if (end <= start) start = end; // Safety check
  }

  // Filter out any empty or very short chunks
  return chunks.filter((c) => c.length > 10);
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
      rawText: string;
      fileName: string;
      fileType: string;
      tags?: string[];
      fileBase64?: string;
    };
    if (!i?.title?.trim()) throw new Error("Title is required");
    if (!i?.rawText?.trim() && !i?.fileBase64) {
      throw new Error("Document text or file is required");
    }
    return {
      title: i.title.trim().slice(0, 200),
      description: (i.description ?? "").trim().slice(0, 500),
      rawText: (i.rawText ?? "").trim().slice(0, 100_000),
      fileName: i.fileName ?? "",
      fileType: i.fileType ?? "",
      tags: i.tags ?? [],
      fileBase64: i.fileBase64 ?? null,
    };
  })
  .handler(async ({ data, context }) => {
    await requirePremium(context.userId);
    const companyId = await getCompanyIdForUser(context.userId);

    let finalText = data.rawText;

    // Process PDF on server if base64 data is provided
    if (data.fileBase64 && data.fileType === "application/pdf") {
      try {
        const buffer = Buffer.from(data.fileBase64, "base64");
        const pdfData = await pdf(buffer);
        finalText = pdfData.text.slice(0, 100_000);
        console.log(`Extracted ${finalText.length} characters from PDF`);
      } catch (err) {
        throw new Error(
          `Failed to extract text from PDF: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      }
    }

    if (!finalText || finalText.length < 10) {
      throw new Error("Document text is too short or empty");
    }

    const { data: doc, error: docError } = await (supabaseAdmin as any)
      .from("knowledge_documents")
      .insert({
        company_id: companyId,
        uploaded_by: context.userId,
        title: data.title,
        description: data.description,
        file_name: data.fileName,
        file_type: data.fileType,
        status: "processing",
        tags: data.tags,
      })
      .select()
      .single();

    if (docError || !doc) throw new Error("Failed to create document record");

    try {
      const chunks = chunkText(finalText);
      console.log(`Created ${chunks.length} chunks`);

      for (let idx = 0; idx < chunks.length; idx++) {
        const chunk = chunks[idx];

        // Skip embeddings for now - just store the text chunks
        await (supabaseAdmin as any).from("knowledge_chunks").insert({
          document_id: doc.id,
          company_id: companyId,
          chunk_index: idx,
          content: chunk,
          embedding: null, // Set to null explicitly
          token_count: Math.ceil(chunk.length / 4),
          metadata: {},
        });
      }

      await (supabaseAdmin as any)
        .from("knowledge_documents")
        .update({ status: "ready", chunk_count: chunks.length })
        .eq("id", doc.id);

      return { documentId: doc.id, chunkCount: chunks.length, status: "ready" };
    } catch (err) {
      console.error("Chunk processing error:", err);
      await (supabaseAdmin as any)
        .from("knowledge_documents")
        .update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        })
        .eq("id", doc.id);
      throw err;
    }
  });

// ── List documents ─────────────────────────────────────────────────────────────

export const listKnowledgeDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const companyId = await getCompanyIdForUser(context.userId);

    const { data: docs, error } = await (supabaseAdmin as any)
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

    const { error } = await (supabaseAdmin as any)
      .from("knowledge_documents")
      .delete()
      .eq("id", data.documentId)
      .eq("company_id", companyId);

    if (error) throw new Error("Failed to delete document");
    return { success: true };
  });

// ── Semantic search ─────────────────────────────────────────────────────────────

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

    // Try text search first (more reliable)
    const { data: textChunks, error: textError } = await (supabaseAdmin as any).rpc(
      "search_knowledge_base_text",
      {
        search_query: data.query,
        match_company_id: companyId,
        match_limit: data.limit,
      },
    );

    if (!textError && textChunks?.length) {
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
    }

    return { results: [], mode: "none" as const };
  });

// ── Get RAG context ──────────────────────────────────────────────────────────────

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

    const { data: chunks } = await (supabaseAdmin as any).rpc("search_knowledge_base_text", {
      search_query: data.query,
      match_company_id: companyId,
      match_limit: 5,
    });

    if (!chunks?.length) return { context: "" };

    const contextText = chunks
      .map((c: any, i: number) => `[${i + 1}] From "${c.document_title}":\n${c.content}`)
      .join("\n\n---\n\n");

    return { context: contextText };
  });
