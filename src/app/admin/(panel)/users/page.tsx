import { Flash, Pill, Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { fmtDate } from "@/lib/content";
import { updateUserAction } from "../../actions";
import { NewUserForm, ResetPassword } from "./UserForms";

export const metadata = { title: "Staff accounts" };

export default async function Users({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser("admin");
  const [sp, rows] = await Promise.all([
    searchParams,
    sql<{ id: string; name: string; email: string; role: string; active: boolean; created_at: Date; last: Date | null }[]>`
      select u.id, u.name, u.email, u.role, u.active, u.created_at,
             (select max(created_at) from login_attempts a where a.email = u.email and a.success) as last
      from users u order by u.active desc, u.name`,
  ]);
  return (
    <>
      <Topbar title="Staff accounts" sub="Admins can change everything. Staff can manage enquiries, bookings, classes and updates." />
      <Flash sp={sp} messages={{ self: "You can't change your own role or deactivate yourself.", password: "Passwords must be at least 10 characters." }} />
      <div className="table-wrap" style={{ marginBottom: 18 }}>
        <table className="t">
          <thead><tr><th>Name</th><th>Role</th><th>Last sign-in</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name}</b>{u.id === me.id && " (you)"}<div className="sub">{u.email}</div></td>
                <td>
                  {u.id === me.id ? <Pill status={u.role} /> : (
                    <form action={updateUserAction} className="actions">
                      <input type="hidden" name="id" value={u.id} /><input type="hidden" name="op" value="role" />
                      <select className="inline-select" name="role" defaultValue={u.role} aria-label={`Role for ${u.name}`} style={{ width: "auto", padding: "6px 8px" }}>
                        <option value="staff">Staff</option><option value="admin">Admin</option>
                      </select>
                      <button className="btn btn-ghost btn-sm">Update</button>
                    </form>
                  )}
                </td>
                <td className="nowrap sub">{u.last ? fmtDate(u.last) : "Never"}</td>
                <td>{u.active ? <Pill status="open" /> : <Pill status="closed" />}</td>
                <td>
                  <div className="actions">
                    <ResetPassword id={u.id} name={u.name} />
                    {u.id !== me.id && (
                      <form action={updateUserAction}>
                        <input type="hidden" name="id" value={u.id} /><input type="hidden" name="op" value={u.active ? "deactivate" : "activate"} />
                        <button className={`btn btn-sm ${u.active ? "btn-danger" : "btn-ghost"}`}>{u.active ? "Deactivate" : "Reactivate"}</button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card">
        <h2>Add a staff member</h2>
        <NewUserForm />
      </section>
    </>
  );
}
