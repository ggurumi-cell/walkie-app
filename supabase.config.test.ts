import { describe, it, expect } from "vitest";

describe("Supabase Configuration", () => {
  it("should have VITE_SUPABASE_URL environment variable set", () => {
    const url = process.env.VITE_SUPABASE_URL;
    expect(url).toBeDefined();
    expect(url).toMatch(/^https:\/\/.+\.supabase\.co$/);
  });

  it("should have VITE_SUPABASE_ANON_KEY environment variable set", () => {
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    expect(key).toBeDefined();
    expect(key?.length).toBeGreaterThan(0);
  });

  it("should validate Supabase URL format", () => {
    const url = process.env.VITE_SUPABASE_URL;
    if (url) {
      try {
        new URL(url);
        expect(true).toBe(true);
      } catch {
        expect.fail("Invalid Supabase URL format");
      }
    }
  });
});
