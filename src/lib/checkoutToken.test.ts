import { describe, expect, it } from "vitest";
import { checkoutTokenMatches, createCheckoutToken, hashCheckoutToken } from "./checkoutToken";

describe("createCheckoutToken", () => {
  it("returns a token with its matching hash", () => {
    const { token, hash } = createCheckoutToken();
    expect(hash).toBe(hashCheckoutToken(token));
  });

  it("never stores the raw token in the hash", () => {
    const { token, hash } = createCheckoutToken();
    expect(hash).not.toContain(token);
    expect(hash).toHaveLength(64);
  });

  it("is unique per call", () => {
    const tokens = new Set(Array.from({ length: 50 }, () => createCheckoutToken().token));
    expect(tokens.size).toBe(50);
  });
});

describe("checkoutTokenMatches", () => {
  it("accepts the token that produced the hash", () => {
    const { token, hash } = createCheckoutToken();
    expect(checkoutTokenMatches(token, hash)).toBe(true);
  });

  it("rejects a different token", () => {
    const { hash } = createCheckoutToken();
    const other = createCheckoutToken().token;
    expect(checkoutTokenMatches(other, hash)).toBe(false);
  });

  // The whole point is that a caller who merely knows a booking id cannot start a payment.
  it.each<[unknown, string]>([
    [undefined, "missing token"],
    ["", "empty token"],
    [null, "null token"],
    [123, "non-string token"],
  ])("rejects %s (%s)", (token) => {
    const { hash } = createCheckoutToken();
    expect(checkoutTokenMatches(token, hash)).toBe(false);
  });

  it("rejects when no hash is stored", () => {
    const { token } = createCheckoutToken();
    expect(checkoutTokenMatches(token, undefined)).toBe(false);
    expect(checkoutTokenMatches(token, "")).toBe(false);
  });

  it("rejects a hash of the wrong length without throwing", () => {
    const { token } = createCheckoutToken();
    expect(checkoutTokenMatches(token, "abc")).toBe(false);
  });
});
