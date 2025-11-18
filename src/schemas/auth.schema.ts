import { z } from "zod";

export const LoginRequestSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("operator"),
    username: z.string().min(1),
    password: z.string().min(1),
  }),
  z.object({
    role: z.literal("transport"),
    business_number: z.string().min(1),
    phone: z.string().min(1),
  }),
]);

export type LoginPayload = z.infer<typeof LoginRequestSchema>;

export const UserSchema = z.object({
  id: z.string().or(z.number()).transform((v) => String(v)),
  name: z.string(),
  email: z.string().email().optional(),
  roles: z.array(z.string()).default([]),
});
export type User = z.infer<typeof UserSchema>;

export const LoginResponseSchema = z.object({
  access: z.string().optional(),
  access_token: z.string().optional(),
  refresh: z.string().optional(),
  refresh_token: z.string().optional(),
  user: UserSchema.optional(), 
});
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
