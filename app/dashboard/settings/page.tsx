import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { createSessionClient } from "@/lib/supabase-session";
import SettingsView from "./SettingsView";

export default async function SettingsPage() {
  const sessionClient = createSessionClient();
  const { data: { user } } = await sessionClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createServerClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <SettingsView 
      initialProfile={profile} 
      userEmail={user.email || ""} 
    />
  );
}
