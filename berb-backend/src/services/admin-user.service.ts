import "server-only";
import { AdminUser } from "@/models";
import { conflict, forbidden, notFound } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/session";
import type { z } from "zod";
import type { managedAdminCreateSchema, managedAdminUpdateSchema } from "@/schemas";

export async function listAdminUsers() {
  return AdminUser.find().select("name email role active createdAt").sort({ createdAt: 1, _id: 1 }).lean();
}

export async function createManagedAdmin(input: z.infer<typeof managedAdminCreateSchema>) {
  try {
    return await AdminUser.create({
      name: input.name,
      email: input.email,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      active: true,
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw conflict("An account with this email already exists");
    throw error;
  }
}

export async function updateManagedAdmin(input: z.infer<typeof managedAdminUpdateSchema>) {
  const account = await AdminUser.findById(input.id);
  if (!account) throw notFound("Administrator not found");
  if (account.role === "owner") throw forbidden("The owner account is protected");
  account.role = input.role;
  account.active = input.active;
  try { return await account.save(); }
  catch (error) {
    if ((error as { code?: number }).code === 11000) throw conflict("An account with this email already exists");
    throw error;
  }
}

export async function deleteManagedAdmin(id: string) {
  const account = await AdminUser.findById(id);
  if (!account) throw notFound("Administrator not found");
  if (account.role === "owner") throw forbidden("The owner account is protected");
  await AdminUser.deleteOne({ _id: account._id, role: { $ne: "owner" } });
}