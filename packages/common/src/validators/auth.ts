import z from "zod"

export const usernameValidator = z
  .string()
  .min(4, "يجب أن يكون الاسم 4 أحرف على الأقل")
  .max(20, "يجب أن لا يتجاوز الاسم 20 حرفاً")

export const inviteCodeValidator = z.string().length(6, "رمز الغرفة غير صحيح")
