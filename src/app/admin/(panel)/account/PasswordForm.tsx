"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../../actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form className="f" action={action}>
      {state?.error && <div className="flash err" style={{ margin: 0 }}>{state.error}</div>}
      {state?.ok && <div className="flash ok" style={{ margin: 0 }}>Password changed.</div>}
      <div><label htmlFor="current">Current password</label><input id="current" name="current" type="password" autoComplete="current-password" required /></div>
      <div><label htmlFor="next">New password</label><input id="next" name="next" type="password" autoComplete="new-password" minLength={10} required /><p className="hint">At least 10 characters.</p></div>
      <div><label htmlFor="confirm">Confirm new password</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required /></div>
      <div className="actions"><button className="btn btn-primary" disabled={pending}>Change password</button></div>
    </form>
  );
}
