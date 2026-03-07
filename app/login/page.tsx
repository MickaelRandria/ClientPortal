import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase-session";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const supabase = createSessionClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) redirect("/dashboard");

  return <LoginForm />;
}
