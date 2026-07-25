DO $$
BEGIN

-- add missing columns automatically

IF EXISTS (
 SELECT 1 FROM information_schema.tables
 WHERE table_name='notifications'
)
AND NOT EXISTS (
 SELECT 1 FROM information_schema.columns
 WHERE table_name='notifications'
 AND column_name='is_read'
)
THEN
 ALTER TABLE notifications ADD COLUMN is_read boolean DEFAULT false;
END IF;


IF EXISTS (
 SELECT 1 FROM information_schema.tables
 WHERE table_name='messages'
)
AND NOT EXISTS (
 SELECT 1 FROM information_schema.columns
 WHERE table_name='messages'
 AND column_name='is_read'
)
THEN
 ALTER TABLE messages ADD COLUMN is_read boolean DEFAULT false;
END IF;


-- create payments automatically

IF NOT EXISTS (
 SELECT 1 FROM information_schema.tables
 WHERE table_name='payments'
)
THEN

CREATE TABLE payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
 status text DEFAULT 'pending',
 esewa_transaction_id text,
 amount numeric DEFAULT 0,
 created_at timestamptz DEFAULT now()
);

END IF;


END $$;