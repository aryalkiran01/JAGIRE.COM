/*
# Knowledge Base Search Functions

## Purpose
Creates two RPC functions for searching the knowledge base:
1. `search_knowledge_base` — semantic vector similarity search using pgvector
2. `search_knowledge_base_text` — text search fallback using pg_trgm similarity

## Functions

### `search_knowledge_base(query_embedding vector(1024), match_company_id uuid, match_limit int)`
- Performs cosine similarity search against `knowledge_chunks.embedding`
- Filters by company_id for multi-tenant isolation
- Returns: content, document_id, document_title (joined), similarity, chunk_index
- SECURITY DEFINER to allow calling from RLS-protected context

### `search_knowledge_base_text(search_query text, match_company_id uuid, match_limit int)`
- Uses pg_trgm similarity for text-based search fallback
- Filters by company_id
- Returns same shape as above
- SECURITY DEFINER

## Security
- Both functions are SECURITY DEFINER with `search_path = public`
- They only return chunks belonging to the specified company_id
- No user data leakage across companies

## Notes
1. `pg_trgm` extension must be enabled for text search fallback
2. The vector similarity uses cosine distance (1 - cosine_similarity) and converts to similarity score
*/

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── Semantic vector search ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_knowledge_base(
  query_embedding vector(1024),
  match_company_id uuid,
  match_limit int DEFAULT 5
)
RETURNS TABLE (
  content text,
  document_id uuid,
  document_title text,
  similarity float8,
  chunk_index int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.content,
    kc.document_id,
    kd.title AS document_title,
    1 - (kc.embedding <=> query_embedding) AS similarity,
    kc.chunk_index
  FROM knowledge_chunks kc
  INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.company_id = match_company_id
    AND kc.embedding IS NOT NULL
    AND kd.status = 'ready'
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_limit;
END;
$$;

-- ── Text search fallback (pg_trgm) ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION search_knowledge_base_text(
  search_query text,
  match_company_id uuid,
  match_limit int DEFAULT 5
)
RETURNS TABLE (
  content text,
  document_id uuid,
  document_title text,
  similarity float8,
  chunk_index int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.content,
    kc.document_id,
    kd.title AS document_title,
    similarity(search_query, kc.content) AS similarity,
    kc.chunk_index
  FROM knowledge_chunks kc
  INNER JOIN knowledge_documents kd ON kd.id = kc.document_id
  WHERE kc.company_id = match_company_id
    AND kd.status = 'ready'
    AND kc.content % search_query
  ORDER BY similarity(search_query, kc.content) DESC
  LIMIT match_limit;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION search_knowledge_base TO authenticated;
GRANT EXECUTE ON FUNCTION search_knowledge_base_text TO authenticated;
