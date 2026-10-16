"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { requireOwner } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { managedAdminCreateSchema, managedAdminUpdateSchema, objectId } from "@/schemas";
import { createManagedAdmin, deleteManagedAdmin, updateManagedAdmin } from "@/services/admin-user.service";

const text = (form: FormData, key: string) => {
  const value = form.get(key);
  return typeof value === "string" ? value : undefined;
};

const errorMessage = (error: unknown) => error instanceof ZodError
  ? error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")
  : error instanceof AppError ? error.message : "Administrator change could not be completed";

async function runAdminMutation(fn: () => Promise<void>) {
  let result = "Administrator updated";
  try {
    await connectDb();
    await requireOwner({ write: true });
    await fn();
    revalidatePath("/admin", "layout");
  } catch (error) {
    if (!(error instanceof AppError || error instanceof ZodError)) console.error(error);
    result = `error=${encodeURIComponent(errorMessage(error))}`;
    redirect(`/admin/admins?${result}`);
  }
  redirect(`/admin/admins?ok=${encodeURIComponent(result)}`);
}

export async function createAdminAccountAction(form: FormData) {
  await runAdminMutation(async () => {
    await createManagedAdmin(managedAdminCreateSchema.parse({
      name: text(form, "name"), email: text(form, "email"), password: text(form, "password"), role: text(form, "role"),
    }));
  });
}

export async function updateAdminAccountAction(form: FormData) {
  await runAdminMutation(async () => {
    await updateManagedAdmin(managedAdminUpdateSchema.parse({
      id: text(form, "id"), role: text(form, "role"), active: text(form, "active") === "on",
    }));
  });
}

export async function deleteAdminAccountAction(id: string) {
  await runAdminMutation(async () => { await deleteManagedAdmin(objectId.parse(id)); });
}