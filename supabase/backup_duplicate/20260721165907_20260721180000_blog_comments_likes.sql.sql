/*
# Blog comments table and blog likes

## 1. Blog comments
Create a `blog_comments` table for reader comments on blog posts.
Each comment belongs to a blog and an author (profile).
Supports soft delete via the author.

## 2. Blog likes
Create a `blog_likes` table for readers to like blog posts.
Unique constraint on (blog_id, user_id) to prevent duplicate likes.

## 3. Triggers
- `update_blog_comments_count`: keeps blogs.comments_count in sync
- `update_blog_likes_count`: keeps blogs.likes_count in sync

## 4. RLS
- blog_comments: anyone can read, authenticated can insert/update/delete own
- blog_likes: anyone can read, authenticated can insert/delete own
*/

-- 1. Blog comments
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  author_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_comments" ON public.blog_comments;
CREATE POLICY "select_blog_comments" ON public.blog_comments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_comments" ON public.blog_comments;
CREATE POLICY "insert_blog_comments" ON public.blog_comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "update_blog_comments" ON public.blog_comments;
CREATE POLICY "update_blog_comments" ON public.blog_comments FOR UPDATE
  TO authenticated USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "delete_blog_comments" ON public.blog_comments;
CREATE POLICY "delete_blog_comments" ON public.blog_comments FOR DELETE
  TO authenticated USING (auth.uid() = author_id);

-- 2. Blog likes
CREATE TABLE IF NOT EXISTS public.blog_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id uuid NOT NULL REFERENCES public.blogs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blog_id, user_id)
);

ALTER TABLE public.blog_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_blog_likes" ON public.blog_likes;
CREATE POLICY "select_blog_likes" ON public.blog_likes FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_blog_likes" ON public.blog_likes;
CREATE POLICY "insert_blog_likes" ON public.blog_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_blog_likes" ON public.blog_likes;
CREATE POLICY "delete_blog_likes" ON public.blog_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- 3. Add count columns to blogs if missing
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.blogs ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;

-- 4. Trigger functions
CREATE OR REPLACE FUNCTION public.update_blog_comments_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.blogs SET comments_count = COALESCE(comments_count, 0) + 1 WHERE id = NEW.blog_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.blogs SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0) WHERE id = OLD.blog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_comments_count_insert ON public.blog_comments;
DROP TRIGGER IF EXISTS blog_comments_count_delete ON public.blog_comments;
CREATE TRIGGER blog_comments_count_insert AFTER INSERT ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_comments_count();
CREATE TRIGGER blog_comments_count_delete AFTER DELETE ON public.blog_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_comments_count();

CREATE OR REPLACE FUNCTION public.update_blog_likes_count()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.blogs SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = NEW.blog_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.blogs SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = OLD.blog_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS blog_likes_count_insert ON public.blog_likes;
DROP TRIGGER IF EXISTS blog_likes_count_delete ON public.blog_likes;
CREATE TRIGGER blog_likes_count_insert AFTER INSERT ON public.blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_likes_count();
CREATE TRIGGER blog_likes_count_delete AFTER DELETE ON public.blog_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_blog_likes_count();

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_blog_comments_blog_id ON public.blog_comments(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_blog_id ON public.blog_likes(blog_id);
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id ON public.blog_likes(user_id);

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blog_likes;
