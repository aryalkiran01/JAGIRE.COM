import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function assertBucketPrivate(bucket: string) {
  const { data, error } = await supabaseAdmin.storage.getBucket(bucket);

  if (error) {
    throw new Error(`Unable to verify the "${bucket}" storage bucket: ${error.message}`);
  }

  if (data?.public) {
    throw new Error(
      `Storage bucket "${bucket}" must be private in production. Set public = false and use signed URLs for access.`,
    );
  }

  return data;
}

export async function createPrivateSignedUrl(
  bucket: string,
  path: string,
  expiresInSeconds = 60 * 60,
) {
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw new Error(`Unable to create a signed URL for "${bucket}/${path}": ${error.message}`);
  }

  if (!data?.signedUrl) {
    throw new Error(`No signed URL returned for "${bucket}/${path}".`);
  }

  return data.signedUrl;
}
