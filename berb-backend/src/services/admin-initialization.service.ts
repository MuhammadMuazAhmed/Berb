import "server-only";
import { timingSafeEqual } from "node:crypto";
import mongoose from "mongoose";
import { AdminInitialization, AdminUser } from "@/models";
import { connectDb } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { forbidden } from "@/lib/errors";
import { hashPassword } from "@/lib/auth/session";
import type { z } from "zod";
import type { initialAdminSetupSchema } from "@/schemas";

const INITIALIZATION_ID = "initial-owner";
const unavailable = () => forbidden("Setup is unavailable or the submitted details are invalid");

function secretMatches(supplied: string, expected: string | undefined) {
  if (!expected) return false;
  const given = Buffer.from(supplied, "utf8"), configured = Buffer.from(expected, "utf8");
  return given.length === configured.length && timingSafeEqual(given, configured);
}

/** Permanently seals setup for a legacy installation before any existing admins are removed. */
export async function migrateAdminInitializationState() {
  await connectDb();
  const session = await mongoose.startSession();
  let initialized = false;
  try {
    await session.withTransaction(async () => {
      initialized = Boolean(await AdminInitialization.findById(INITIALIZATION_ID).session(session).lean());
      if (initialized) return;

      const owner = await AdminUser.findOne({ role: "owner" }).sort({ createdAt: 1, _id: 1 }).session(session);
      const account = owner ?? await AdminUser.findOne().sort({ createdAt: 1, _id: 1 }).session(session);
      if (!account) return;

      if (account.role !== "owner") {
        account.role = "owner";
        await account.save({ session });
      }
      await AdminInitialization.create([{
        _id: INITIALIZATION_ID,
        ownerId: account._id,
        completedAt: new Date(),
      }], { session });
      initialized = true;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000 && await AdminInitialization.exists({ _id: INITIALIZATION_ID })) return true;
    throw error;
  } finally {
    await session.endSession();
  }
  return initialized;
}

export async function isAdminSetupAvailable() {
  if (!getEnv().ADMIN_SETUP_SECRET) return false;
  return !(await migrateAdminInitializationState());
}

export async function initializeFirstOwner(input: z.infer<typeof initialAdminSetupSchema>) {
  const configuredSecret = getEnv().ADMIN_SETUP_SECRET;
  if (!secretMatches(input.setupSecret, configuredSecret)) throw unavailable();

  await connectDb();
  const session = await mongoose.startSession();
  let created = false;
  try {
    await session.withTransaction(async () => {
      created = false;
      const state = await AdminInitialization.findById(INITIALIZATION_ID).session(session).lean();
      if (state) return;

      const existingOwner = await AdminUser.findOne({ role: "owner" }).sort({ createdAt: 1, _id: 1 }).session(session);
      const existingAccount = existingOwner ?? await AdminUser.findOne().sort({ createdAt: 1, _id: 1 }).session(session);
      if (existingAccount) {
        if (existingAccount.role !== "owner") {
          existingAccount.role = "owner";
          await existingAccount.save({ session });
        }
        await AdminInitialization.create([{
          _id: INITIALIZATION_ID,
          ownerId: existingAccount._id,
          completedAt: new Date(),
        }], { session });
        return;
      }

      const [owner] = await AdminUser.create([{
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "owner",
        active: true,
      }], { session });
      await AdminInitialization.create([{
        _id: INITIALIZATION_ID,
        ownerId: owner._id,
        completedAt: new Date(),
      }], { session });
      created = true;
    });
  } catch (error) {
    if ((error as { code?: number }).code === 11000) throw unavailable();
    throw error;
  } finally {
    await session.endSession();
  }
  if (!created) throw unavailable();
}