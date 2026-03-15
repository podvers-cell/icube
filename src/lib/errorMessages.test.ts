import { describe, it, expect } from "vitest";
import { toUserFriendlyError, isNetworkError } from "./errorMessages";

describe("toUserFriendlyError", () => {
  it("maps network errors to connection message", () => {
    expect(toUserFriendlyError(new Error("Failed to fetch"))).toBe(
      "Connection problem. Check your internet and try again."
    );
    expect(toUserFriendlyError(new Error("NetworkError"))).toBe(
      "Connection problem. Check your internet and try again."
    );
  });

  it("maps permission errors to unavailable message", () => {
    expect(toUserFriendlyError(new Error("Permission denied"))).toBe("Content is temporarily unavailable.");
    expect(toUserFriendlyError(new Error("Unauthorized"))).toBe("Content is temporarily unavailable.");
  });

  it("maps auth errors to session message", () => {
    expect(toUserFriendlyError(new Error("unauthenticated"))).toBe("Session expired. Please refresh the page.");
  });

  it("maps Firebase config errors", () => {
    expect(toUserFriendlyError(new Error("Firebase not configured"))).toBe(
      "Service is being updated. Please try again later."
    );
  });

  it("returns original message for unknown errors", () => {
    expect(toUserFriendlyError(new Error("Custom error"))).toBe("Custom error");
  });

  it("returns fallback for empty", () => {
    expect(toUserFriendlyError(new Error(""))).toBe("Failed to load content. Please try again.");
  });
});

describe("isNetworkError", () => {
  it("returns true for network-related errors", () => {
    expect(isNetworkError(new Error("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("NetworkError"))).toBe(true);
    expect(isNetworkError(new Error("load failed"))).toBe(true);
    expect(isNetworkError(new Error("timeout"))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isNetworkError(new Error("Permission denied"))).toBe(false);
    expect(isNetworkError(new Error("Unknown"))).toBe(false);
  });
});
