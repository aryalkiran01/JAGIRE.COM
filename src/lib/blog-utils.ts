// Blog asset and image resolution helpers
const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  design: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
  graphic: "https://images.pexels.com/photos/196644/pexels-photo-196644.jpeg?auto=compress&cs=tinysrgb&w=800",
  technology: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
  tech: "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=800",
  engineering: "https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg?auto=compress&cs=tinysrgb&w=800",
  marketing: "https://images.pexels.com/photos/905163/pexels-photo-905163.jpeg?auto=compress&cs=tinysrgb&w=800",
  finance: "https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=800",
  career: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  hiring: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
  recruitment: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=800",
  stories: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
  default: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800",
};

export function resolveBlogCoverUrl(post: {
  cover_url?: string | null;
  cover_image?: string | null;
  category?: string | null;
  title?: string | null;
}): string {
  const direct = post.cover_url || post.cover_image;
  if (direct && (direct.startsWith("http://") || direct.startsWith("https://") || direct.startsWith("/"))) {
    return direct;
  }

  // Determine fallback by category or title keywords
  const combined = `${post.category ?? ""} ${post.title ?? ""}`.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (combined.includes(key)) {
      return url;
    }
  }

  return CATEGORY_FALLBACK_IMAGES.default;
}
