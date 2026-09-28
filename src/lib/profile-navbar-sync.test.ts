import { describe, it, expect } from "vitest";

interface ProfileState {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  user_role?: string | null;
  email?: string | null;
}

interface UserAuthContext {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
    avatar_url?: string;
    picture?: string;
  };
}

// Emulates useProfile display logic
function computeProfilePresentation(
  profile: ProfileState | null,
  authUser: UserAuthContext | null,
) {
  const displayName =
    profile?.full_name?.trim() ||
    (authUser?.user_metadata?.full_name as string)?.trim() ||
    (authUser?.user_metadata?.name as string)?.trim() ||
    authUser?.email?.split("@")[0] ||
    "User";

  const avatarUrl =
    profile?.avatar_url ||
    (authUser?.user_metadata?.avatar_url as string) ||
    (authUser?.user_metadata?.picture as string) ||
    null;

  const fallbackInitial = (displayName?.[0] ?? "U").toUpperCase();

  return { displayName, avatarUrl, fallbackInitial };
}

describe("Profile & Navbar Synchronization Tests", () => {
  it("prioritizes profile.full_name as the highest authoritative source", () => {
    const authUser: UserAuthContext = {
      id: "user-123",
      email: "kiran@example.com",
      user_metadata: { full_name: "Kiran Metadata" },
    };
    const profile: ProfileState = {
      id: "user-123",
      full_name: "Kiran Aryal (DB Profile)",
      avatar_url: "https://example.com/avatar.jpg",
    };

    const res = computeProfilePresentation(profile, authUser);
    expect(res.displayName).toBe("Kiran Aryal (DB Profile)");
    expect(res.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(res.fallbackInitial).toBe("K");
  });

  it("falls back to user_metadata when profile full_name is empty", () => {
    const authUser: UserAuthContext = {
      id: "user-123",
      email: "kiran@example.com",
      user_metadata: { full_name: "Kiran Auth Meta" },
    };
    const profile: ProfileState = {
      id: "user-123",
      full_name: null,
      avatar_url: null,
    };

    const res = computeProfilePresentation(profile, authUser);
    expect(res.displayName).toBe("Kiran Auth Meta");
    expect(res.fallbackInitial).toBe("K");
  });

  it("falls back to email prefix when both profile and user_metadata names are absent", () => {
    const authUser: UserAuthContext = {
      id: "user-123",
      email: "developer_nepal@gmail.com",
      user_metadata: {},
    };
    const profile: ProfileState = {
      id: "user-123",
      full_name: "",
      avatar_url: null,
    };

    const res = computeProfilePresentation(profile, authUser);
    expect(res.displayName).toBe("developer_nepal");
    expect(res.fallbackInitial).toBe("D");
  });

  it("handles instant cache update propagation without requiring page refresh", () => {
    // Initial State
    let cache: ProfileState | null = {
      id: "user-123",
      full_name: "Old Name",
      avatar_url: "https://old.com/pic.jpg",
    };

    const authUser: UserAuthContext = {
      id: "user-123",
      email: "test@example.com",
    };

    let presentation = computeProfilePresentation(cache, authUser);
    expect(presentation.displayName).toBe("Old Name");
    expect(presentation.avatarUrl).toBe("https://old.com/pic.jpg");

    // Mutation occurs: instant optimistic cache update
    const updatedPayload = {
      full_name: "New Profile Name",
      avatar_url: "https://new.com/new-pic.png",
    };

    cache = {
      ...cache!,
      ...updatedPayload,
    };

    presentation = computeProfilePresentation(cache, authUser);
    expect(presentation.displayName).toBe("New Profile Name");
    expect(presentation.avatarUrl).toBe("https://new.com/new-pic.png");
    expect(presentation.fallbackInitial).toBe("N");
  });
});
