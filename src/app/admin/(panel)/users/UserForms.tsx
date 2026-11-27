"use client";

import { useActionState, useState } from "react";
import { createUserAction, updateUserAction } from "../../actions";

export function NewUserForm() {
  const [state, action, pending] = useActionState(createUserAction, null);
  return (
    <form className="f" action={action} key={state?.ok ? Date.now() : "form"}>
      {state?.error && <div className="flash err" style={{ margin: 0 }}>{state.error}</div>}
      {state?.ok && <div className="flash ok" style={{ margin: 0 }}>Account created. Share the email and temporary password with them privately and ask them to change it under “My password”.</div>}
      <div className="row2">
        <div><label htmlFor="nu-name">Name</label><input id="nu-name" name="name" type="text" required defaultValue={state?.values?.name} /></div>
        <div><label htmlFor="nu-email">Email</label><input id="nu-email" name="email" type="email" required defaultValue={state?.values?.email} /></div>
      </div>
      <div className="row2">
        <div><label htmlFor="nu-pw">Temporary password</label><input id="nu-pw" name="password" type="text" minLength={10} required autoComplete="off" /><p className="hint">At least 10 characters.</p></div>
        <div><label htmlFor="nu-role">Role</label><select id="nu-role" name="role" defaultValue={state?.values?.role ?? "staff"}><option value="staff">Staff</option><option value="admin">Admin</option></select></div>
      </div>
      <div className="actions"><button className="btn btn-primary" disabled={pending}>Add staff member</button></div>
    </form>
  );
}

export function ResetPassword({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  if (!open) return <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Reset password</button>;
  return (
    <form action={updateUserAction} className="actions">
      <input type="hidden" name="id" value={id} /><input type="hidden" name="op" value="reset" />
      <input className="inline-select" name="password" type="text" minLength={10} required placeholder="New password" aria-label={`New password for ${name}`} style={{ width: 160, padding: "6px 8px" }} autoComplete="off" />
      <button className="btn btn-primary btn-sm">Set</button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancel</button>
    </form>
  );
}
