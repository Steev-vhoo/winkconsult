import { Topbar } from "@/components/admin/ui";
import { requireUser } from "@/lib/auth";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "My password" };

export default async function Account() {
  const user = await requireUser();
  return (
    <>
      <Topbar title="My password" sub={`Signed in as ${user.email}`} />
      <section className="card" style={{ maxWidth: 520 }}><PasswordForm /></section>
    </>
  );
}
