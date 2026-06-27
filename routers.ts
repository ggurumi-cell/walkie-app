import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getWalkieUserByEmployeeIdAndAuthCode, getAllWalkieUsers, getWalkieGroups, getGroupMembers, createAnnouncement, getAnnouncementsByDate, getAllAnnouncements } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Walkie-Talkie 앱 로그인 및 사용자 관리
  walkie: router({
    // 사전 등록 로그인
    login: publicProcedure
      .input(z.object({
        employeeId: z.string().min(1),
        authCode: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const user = await getWalkieUserByEmployeeIdAndAuthCode(input.employeeId, input.authCode);
        if (!user) {
          throw new Error("Invalid employee ID or auth code");
        }
        return {
          success: true,
          user: {
            id: user.id,
            name: user.name,
            employeeId: user.employeeId,
          },
        };
      }),

    // 모든 사용자 목록
    getAllUsers: publicProcedure.query(async () => {
      const users = await getAllWalkieUsers();
      return users.map(u => ({
        id: u.id,
        name: u.name,
        employeeId: u.employeeId,
      }));
    }),

    // 그룹 목록
    getGroups: publicProcedure.query(async () => {
      return await getWalkieGroups();
    }),

    // 그룹 멤버
    getGroupMembers: publicProcedure
      .input(z.object({
        groupId: z.number(),
      }))
      .query(async ({ input }) => {
        const members = await getGroupMembers(input.groupId);
        return members;
      }),

    // 공지사항 생성
    createAnnouncement: publicProcedure
      .input(z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1),
        senderId: z.number(),
        senderName: z.string().min(1),
        priority: z.enum(["normal", "urgent"]).default("normal"),
      }))
      .mutation(async ({ input }) => {
        const result = await createAnnouncement({
          title: input.title,
          content: input.content,
          senderId: input.senderId,
          senderName: input.senderName,
          priority: input.priority,
        });
        return {
          success: true,
          result,
        };
      }),

    // 오늘의 공지사항 조회
    getAnnouncementsForToday: publicProcedure.query(async () => {
      return await getAnnouncementsByDate(new Date());
    }),

    // 모든 공지사항 조회
    getAllAnnouncementsQuery: publicProcedure.query(async () => {
      const announcements = await getAllAnnouncements();
      return announcements;
    }),
  }),
});

export type AppRouter = typeof appRouter;
