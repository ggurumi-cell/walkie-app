import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("walkie.login", () => {
  it("should successfully login with valid credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // 테스트용 샘플 계정으로 로그인
    const result = await caller.walkie.login({
      employeeId: "EMP001",
      authCode: "1234",
    });

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user.name).toBe("김철수");
    expect(result.user.employeeId).toBe("EMP001");
  });

  it("should fail with invalid credentials", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.walkie.login({
        employeeId: "INVALID",
        authCode: "0000",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should fail with wrong auth code", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.walkie.login({
        employeeId: "EMP001",
        authCode: "9999",
      });
      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

describe("walkie.getAllUsers", () => {
  it("should return all active users", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const users = await caller.walkie.getAllUsers();

    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty("id");
    expect(users[0]).toHaveProperty("name");
    expect(users[0]).toHaveProperty("employeeId");
  });
});

describe("walkie.getGroups", () => {
  it("should return all groups", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const groups = await caller.walkie.getGroups();

    expect(Array.isArray(groups)).toBe(true);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0]).toHaveProperty("id");
    expect(groups[0]).toHaveProperty("name");
  });
});
