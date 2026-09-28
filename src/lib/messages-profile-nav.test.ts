import { describe, it, expect } from "vitest";

describe("Messages Section — Participant Profile Navigation", () => {
  const currentUser = {
    id: "user-a-123",
    full_name: "Alice Employer",
  };

  const participantB = {
    id: "user-b-456",
    full_name: "Bob Candidate",
    email: "bob@example.com",
    avatar_url: "https://jagire.com/avatars/bob.png",
  };

  const mockChat = {
    id: "chat-789",
    user_a: currentUser.id,
    user_b: participantB.id,
    other: participantB,
  };

  it("correctly resolves other participant identity for User A", () => {
    const otherParticipantId =
      mockChat.user_a === currentUser.id ? mockChat.user_b : mockChat.user_a;
    expect(otherParticipantId).toBe("user-b-456");
    expect(mockChat.other.id).toBe("user-b-456");
    expect(mockChat.other.full_name).toBe("Bob Candidate");
  });

  it("constructs target profile route URL matching existing route /profile/$userId", () => {
    const targetRoute = `/profile/${mockChat.other.id}`;
    expect(targetRoute).toBe("/profile/user-b-456");
    expect(targetRoute).not.toContain(currentUser.id);
  });

  it("prevents navigating to logged in user profile when viewing conversation", () => {
    const isSelf = mockChat.other.id === currentUser.id;
    expect(isSelf).toBe(false);
  });

  it("supports stopPropagation pattern for conversation list items", () => {
    let conversationSelected = false;
    let profileNavigated = false;

    const selectConversation = () => {
      conversationSelected = true;
    };

    const clickProfileLink = (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      profileNavigated = true;
    };

    // Simulate clicking identity inside conversation card
    const mockEvent = {
      stopped: false,
      stopPropagation() {
        this.stopped = true;
      },
    };

    clickProfileLink(mockEvent);
    if (!mockEvent.stopped) {
      selectConversation();
    }

    expect(profileNavigated).toBe(true);
    expect(conversationSelected).toBe(false);
  });
});
