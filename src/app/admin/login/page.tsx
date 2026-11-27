import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getUser()) redirect("/admin");
  return (
    <div className="login-wrap">
      <div className="login-card">
        <img src="/brand/logo.svg" alt="WiNK CONSULT" />
        <h1>Staff sign in</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Manage enquiries, bookings and website content.</p>
        <LoginForm />
      </div>
    </div>
  );
}
