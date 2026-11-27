"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form className="f" action={action}>
      {state?.error && <div className="flash err" role="alert" style={{ margin: 0 }}>{state.error}</div>}
      <div><label htmlFor="email">Email</label><input id="email" name="email" type="email" autoComplete="username" required autoFocus defaultValue={state?.email} /></div>
      <div><label htmlFor="password">Password</label><input id="password" name="password" type="password" autoComplete="current-password" required /></div>
      <button className="btn btn-green" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
