import { connectDb } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { Service } from "@/models";
import { Flash, Head } from "@/components/ui";
import { createTeamAction } from "../../../actions/admin";
import { TeamForm } from "../TeamForm";

export default async function NewMember({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireAdmin(); await connectDb();
  return <><Head title="Add team member" /><Flash sp={await searchParams} /><TeamForm action={createTeamAction} services={await Service.find().sort({ name: 1 }).lean()} /></>;
}
