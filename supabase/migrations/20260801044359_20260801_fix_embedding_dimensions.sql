/*
# Fix embedding vector dimension

## Changes
- Alter `knowledge_chunks.embedding` column from vector(768) to vector(1024)
  to match the `mxbai-embed-large` Ollama model's output dimensionality.

## Notes
1. This is safe because the table is new and has no data yet.
2. The HNSW index is recreated after the column type change.
*/

-- Drop the index first
DROP INDEX IF EXISTS idx_kb_chunks_embedding;

-- Alter the embedding column to 1024 dimensions
ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(1024);

-- Recreate the HNSW index
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
