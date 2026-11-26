import type { z } from "zod";
import type { User } from "../src/healthcare/types";
import { ApiError } from "./validation";

export interface DomainContext {
  actor: Pick<User, "id" | "role"> | null;
  body: unknown;
  limit: (key: string, maximum: number, windowMs: number) => void;
}

export function requireActor(context: DomainContext, staff = false) {
  if (!context.actor) throw new ApiError(401, "Sign in to continue.");
  if (staff && context.actor.role !== "staff") {
    throw new ApiError(403, "Staff access is required.");
  }
  return context.actor;
}

export function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ApiError(
      400,
      result.error.issues[0]?.message ?? "Invalid request.",
    );
  }
  return result.data;
}
