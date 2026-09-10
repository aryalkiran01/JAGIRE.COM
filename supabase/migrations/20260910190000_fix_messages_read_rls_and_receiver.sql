-- Fix RLS policies and backfill receiver_id on messages so unread/seen states can be updated reliably

-- 1. Backfill any missing receiver_id in messages from the chats participants
UPDATE public.messages m
SET receiver_id = CASE
  WHEN c.user_a = m.sender_id THEN c.user_b
  ELSE c.user_a
END
FROM public.chats c
WHERE m.chat_id = c.id
  AND m.receiver_id IS NULL;

-- 2. Ensure SELECT policy allows both direct sender/receiver and chat participants
DROP POLICY IF EXISTS "select_messages" ON public.messages;
CREATE POLICY "select_messages" ON public.messages
FOR SELECT TO authenticated
USING (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  )
);

-- 3. Ensure UPDATE policy allows recipient and chat participants to mark messages as read
DROP POLICY IF EXISTS "update_messages" ON public.messages;
CREATE POLICY "update_messages" ON public.messages
FOR UPDATE TO authenticated
USING (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  )
)
WITH CHECK (
  sender_id = auth.uid()
  OR receiver_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.chats c
    WHERE c.id = messages.chat_id
    AND (c.user_a = auth.uid() OR c.user_b = auth.uid())
  )
);

-- 4. Create composite index on (chat_id, sender_id, is_read) for fast unread count queries
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender_read
ON public.messages (chat_id, sender_id, is_read);
