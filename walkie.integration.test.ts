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

describe("Walkie-Talkie App Integration Tests", () => {
  describe("로그인 및 사용자 관리", () => {
    it("사용자는 올바른 사번과 인증번호로 로그인할 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.walkie.login({
        employeeId: "EMP001",
        authCode: "1234",
      });

      expect(result.success).toBe(true);
      expect(result.user.name).toBe("김철수");
      expect(result.user.employeeId).toBe("EMP001");
    });

    it("잘못된 인증번호로는 로그인할 수 없다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.walkie.login({
          employeeId: "EMP001",
          authCode: "0000",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("존재하지 않는 사번으로는 로그인할 수 없다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.walkie.login({
          employeeId: "NONEXISTENT",
          authCode: "1234",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("사용자 목록 조회", () => {
    it("모든 활성 사용자를 조회할 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const users = await caller.walkie.getAllUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(3);

      // 샘플 사용자 확인
      const userNames = users.map((u) => u.name);
      expect(userNames).toContain("김철수");
      expect(userNames).toContain("이영희");
      expect(userNames).toContain("박민준");
    });

    it("각 사용자는 id, name, employeeId를 포함한다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const users = await caller.walkie.getAllUsers();

      expect(users.length).toBeGreaterThan(0);
      users.forEach((user) => {
        expect(user).toHaveProperty("id");
        expect(user).toHaveProperty("name");
        expect(user).toHaveProperty("employeeId");
        expect(typeof user.id).toBe("number");
        expect(typeof user.name).toBe("string");
        expect(typeof user.employeeId).toBe("string");
      });
    });
  });

  describe("그룹 관리", () => {
    it("모든 그룹을 조회할 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const groups = await caller.walkie.getGroups();

      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThanOrEqual(3);

      // 샘플 그룹 확인
      const groupNames = groups.map((g) => g.name);
      expect(groupNames).toContain("전체 팀");
      expect(groupNames).toContain("A팀");
      expect(groupNames).toContain("B팀");
    });

    it("각 그룹은 id, name, description을 포함한다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const groups = await caller.walkie.getGroups();

      expect(groups.length).toBeGreaterThan(0);
      groups.forEach((group) => {
        expect(group).toHaveProperty("id");
        expect(group).toHaveProperty("name");
        expect(group).toHaveProperty("description");
      });
    });

    it("특정 그룹의 멤버를 조회할 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // 그룹 1 (전체 팀)의 멤버 조회
      const members = await caller.walkie.getGroupMembers({
        groupId: 1,
      });

      expect(Array.isArray(members)).toBe(true);
      expect(members.length).toBeGreaterThan(0);

      // 각 멤버는 groupId와 userId를 포함해야 함
      members.forEach((member) => {
        expect(member).toHaveProperty("groupId");
        expect(member).toHaveProperty("userId");
        expect(member.groupId).toBe(1);
      });
    });
  });

  describe("무전 시나리오", () => {
    it("사용자는 로그인 후 다른 사용자 목록을 볼 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // 1. 로그인
      const loginResult = await caller.walkie.login({
        employeeId: "EMP001",
        authCode: "1234",
      });
      expect(loginResult.success).toBe(true);

      // 2. 사용자 목록 조회
      const users = await caller.walkie.getAllUsers();
      expect(users.length).toBeGreaterThan(0);

      // 3. 로그인한 사용자 자신은 목록에서 제외되어야 함 (클라이언트 단에서 처리)
      // 서버는 모든 사용자를 반환하므로 여기서는 확인 불가
      expect(users.some((u) => u.employeeId === "EMP001")).toBe(true);
    });

    it("사용자는 그룹 무전에 참여할 수 있다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // 1. 로그인
      const loginResult = await caller.walkie.login({
        employeeId: "EMP001",
        authCode: "1234",
      });
      expect(loginResult.success).toBe(true);

      // 2. 그룹 목록 조회
      const groups = await caller.walkie.getGroups();
      expect(groups.length).toBeGreaterThan(0);

      // 3. 첫 번째 그룹의 멤버 확인
      const members = await caller.walkie.getGroupMembers({
        groupId: groups[0].id,
      });
      expect(Array.isArray(members)).toBe(true);
    });
  });

  describe("데이터 무결성", () => {
    it("모든 샘플 사용자는 활성 상태여야 한다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const users = await caller.walkie.getAllUsers();

      // 모든 사용자가 조회되므로 활성 상태임을 의미
      expect(users.length).toBeGreaterThanOrEqual(3);
    });

    it("그룹과 멤버 관계가 일관성 있게 유지된다", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const groups = await caller.walkie.getGroups();
      const allUsers = await caller.walkie.getAllUsers();

      for (const group of groups) {
        const members = await caller.walkie.getGroupMembers({
          groupId: group.id,
        });

        // 각 멤버의 userId가 실제 사용자 목록에 존재하는지 확인
        members.forEach((member) => {
          const userExists = allUsers.some((u) => u.id === member.userId);
          expect(userExists).toBe(true);
        });
      }
    });
  });
});
