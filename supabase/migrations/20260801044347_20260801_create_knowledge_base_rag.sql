/*
# Knowledge Base (RAG) — Document Storage, Chunking, and Vector Embeddings

## Purpose
Creates a knowledge base system that lets employers upload documents (company policies, FAQs,
onboarding guides, product docs, etc.) which get chunked and embedded for use as RAG context
in AI features. This enables company-specific AI assistants that answer questions grounded in
the employer's own documents.

## New Tables

### 1. `knowledge_documents`
Stores uploaded documents metadata. Each document belongs to a company.
- `id` (uuid, PK) — document ID
- `company_id` (uuid, FK → companies) — which company owns this document
- `uploaded_by` (uuid, FK → auth.users) — who uploaded it
- `title` (text) — document title
- `description` (text) — optional description
- `file_url` (text) — storage URL of the original file
- `file_name` (text) — original filename
- `file_type` (text) — mime type
- `file_size` (bigint) — file size in bytes
- `status` (text) — 'pending' | 'processing' | 'ready' | 'failed'
- `chunk_count` (int) — number of chunks generated
- `error_message` (text) — if processing failed
- `tags` (text[]) — user-defined tags for categorization
- `created_at` (timestamptz) — upload timestamp
- `updated_at` (timestamptz) — last update

### 2. `knowledge_chunks`
Stores text chunks extracted from documents, with vector embeddings for semantic search.
- `id` (uuid, PK) — chunk ID
- `document_id` (uuid, FK → knowledge_documents) — parent document
- `company_id` (uuid, FK → companies) — denormalized for efficient filtering
- `chunk_index` (int) — order within the document
- `content` (text) — the chunk text
- `embedding` (vector(768)) — embedding vector for semantic search (768 dims matches nomic-embed-text)
- `token_count` (int) — approximate token count
- `metadata` (jsonb) — extra metadata (page number, section, etc.)
- `created_at` (timestamptz)

## Indexes
- `knowledge_documents` on `company_id` — filter documents by company
- `knowledge_chunks` on `document_id` — fetch all chunks for a document
- `knowledge_chunks` on `company_id` — filter chunks by company
- `knowledge_chunks` HNSW index on `embedding` — fast vector similarity search

## Security (RLS)
- `knowledge_documents`: company members can CRUD (checked via companies.owner_id)
- `knowledge_chunks`: company members can SELECT/INSERT/DELETE (no update needed — chunks are immutable)
- All policies use `auth.uid()` and check ownership through the companies table

## Notes
1. The `vector` extension must be enabled for the embedding column type.
2. Embeddings use 768 dimensions to match the `nomic-embed-text` model available in Ollama.
3. Chunk embeddings are generated server-side and inserted directly — no client ever writes embeddings.
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── knowledge_documents ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  file_type text DEFAULT '',
  file_size bigint DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  chunk_count integer NOT NULL DEFAULT 0,
  error_message text DEFAULT '',
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kb_docs_company ON knowledge_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_kb_docs_status ON knowledge_documents(status);

DROP POLICY IF EXISTS "select_own_company_docs" ON knowledge_documents;
CREATE POLICY "select_own_company_docs" ON knowledge_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_documents.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_company_docs" ON knowledge_documents;
CREATE POLICY "insert_own_company_docs" ON knowledge_documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_documents.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "update_own_company_docs" ON knowledge_documents;
CREATE POLICY "update_own_company_docs" ON knowledge_documents
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_documents.company_id AND companies.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_documents.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_company_docs" ON knowledge_documents;
CREATE POLICY "delete_own_company_docs" ON knowledge_documents
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_documents.company_id AND companies.owner_id = auth.uid()));

-- ── knowledge_chunks ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  embedding vector(768),
  token_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kb_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_kb_chunks_company ON knowledge_chunks(company_id);

-- HNSW index for fast vector similarity search
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

DROP POLICY IF EXISTS "select_own_company_chunks" ON knowledge_chunks;
CREATE POLICY "select_own_company_chunks" ON knowledge_chunks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_chunks.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_company_chunks" ON knowledge_chunks;
CREATE POLICY "insert_own_company_chunks" ON knowledge_chunks
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_chunks.company_id AND companies.owner_id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_company_chunks" ON knowledge_chunks;
CREATE POLICY "delete_own_company_chunks" ON knowledge_chunks
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM companies WHERE companies.id = knowledge_chunks.company_id AND companies.owner_id = auth.uid()));

-- ── updated_at trigger for knowledge_documents ───────────────────────────────

CREATE OR REPLACE FUNCTION trigger_set_kb_doc_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_kb_doc_updated_at ON knowledge_documents;
CREATE TRIGGER set_kb_doc_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_kb_doc_updated_at();
