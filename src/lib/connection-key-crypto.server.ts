import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function key(): Buffer {
  const raw = process.env.APP_USER_CONNECTION_KEY_SECRET;
  if (!raw) throw new Error("APP_USER_CONNECTION_KEY_SECRET is not set");
  return Buffer.from(raw, "base64");
}

export function encryptConnectionKey(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ct]).toString("base64");
}

export function decryptConnectionKey(stored: string): string {
  const buf = Buffer.from(stored, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ct = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString("utf8");
}

export async function saveConnectionKeyForUser(
  userId: string,
  connectorId: string,
  connectionAPIKey: string,
) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  try {
    const encrypted = encryptConnectionKey(connectionAPIKey);
    const { error } = await supabaseAdmin.from("app_user_connections").upsert(
      {
        user_id: userId,
        provider: connectorId,
        refresh_token: encrypted,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" },
    );
    if (error) {
      console.error("❌ Upsert error:", error);
      throw error;
    }
    console.log("✅ Upsert successful for user:", userId);
  } catch (err) {
    console.error("❌ saveConnectionKeyForUser failed:", err);
    throw err;
  }
}

export async function getConnectionKeyForUser(
  userId: string,
  connectorId: string,
): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  console.log("🔎 getConnectionKeyForUser called with:", { userId, connectorId });
  const { data, error } = await supabaseAdmin
    .from("app_user_connections")
    .select("refresh_token")
    .eq("user_id", userId)
    .eq("provider", connectorId)
    .maybeSingle();

  if (error) {
    console.error("❌ DB error in getConnectionKeyForUser:", error);
    return null;
  }
  if (!data) {
    console.log("❌ No row found for user:", userId, "provider:", connectorId);
    return null;
  }
  console.log("✅ Row found, attempting decryption");
  try {
    const decrypted = decryptConnectionKey(data.refresh_token!);
    console.log("✅ Decryption successful");
    return decrypted;
  } catch (e) {
    console.error("❌ Decryption failed:", e);
    return null;
  }
}

export async function deleteConnectionKeyForUser(userId: string, connectorId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("app_user_connections")
    .delete()
    .eq("user_id", userId)
    .eq("provider", connectorId);
}
