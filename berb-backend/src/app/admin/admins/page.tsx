import { requireOwner } from "@/lib/auth/session";
import { connectDb } from "@/lib/db";
import { Flash, Head } from "@/components/ui";
import { managedAdminCreateSchema } from "@/schemas";
import { listAdminUsers } from "@/services/admin-user.service";
import { createAdminAccountAction, deleteAdminAccountAction, updateAdminAccountAction } from "@/app/actions/admin-users";
import { Badge, Confirm } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminAccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireOwner(); await connectDb();
  const [accounts, params] = await Promise.all([listAdminUsers(), searchParams]);
  return <><Head title="Administrators" /><Flash sp={params} />
    <section className="card"><h2>Add administrator</h2>
      <form action={createAdminAccountAction} className="admin-create-form">
        <div><label htmlFor="admin-name">Name</label><input id="admin-name" name="name" required minLength={2} maxLength={100} /></div>
        <div><label htmlFor="admin-email">Email</label><input id="admin-email" name="email" type="email" required maxLength={200} /></div>
        <div><label htmlFor="admin-password">Temporary password</label><input id="admin-password" name="password" type="password" required minLength={12} maxLength={200} autoComplete="new-password" /></div>
        <div><label htmlFor="admin-role">Role</label><select id="admin-role" name="role" defaultValue="admin">{managedAdminCreateSchema.shape.role.removeDefault().options.map((role) => <option key={role} value={role}>{role}</option>)}</select></div>
        <SubmitButton className="btn fit" pendingLabel="Creating account...">Create account</SubmitButton>
      </form>
      <p className="muted admin-role-note"><b>Owner:</b> full access and administrator management. <b>Admin:</b> operational read/write access. <b>Viewer:</b> read-only access.</p>
    </section>
    <section className="card scroll"><h2>Admin accounts</h2><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Access</th><th>Actions</th></tr></thead><tbody>
      {accounts.map((account) => <tr key={String(account._id)}><td>{account.name}</td><td>{account.email}</td><td><Badge s={account.role} /></td><td><Badge s={account.active ? "active" : "inactive"} /></td>
        <td>{account.role === "owner" ? <span className="muted">Protected owner</span> : <div className="admin-account-actions">
          <form action={updateAdminAccountAction} className="admin-account-edit"><input type="hidden" name="id" value={String(account._id)} />
            <select aria-label={`Role for ${account.email}`} name="role" defaultValue={account.role}><option value="admin">Admin</option><option value="viewer">Viewer</option></select>
            <label className="admin-active-toggle"><input type="checkbox" name="active" defaultChecked={account.active} />Active</label>
            <SubmitButton className="btn sm out" pendingLabel="Saving...">Save</SubmitButton>
          </form>
          <Confirm label="Delete" danger><form action={deleteAdminAccountAction.bind(null, String(account._id))}><p>Delete {account.email}? This cannot be undone.</p><SubmitButton className="btn sm danger">Confirm delete</SubmitButton></form></Confirm>
        </div>}</td></tr>)}
    </tbody></table></section>
  </>;
}