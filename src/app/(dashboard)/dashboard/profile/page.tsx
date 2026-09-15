import { supabaseServer } from "@/lib/supabase/server";
import { PageHeader, Card, Input, Button } from "@/components/ui/primitives";
import { updateProfile } from "./actions";

export default async function ProfilePage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("users").select("full_name, email").eq("id", user!.id).single();

  return (
    <div className="max-w-lg">
      <PageHeader title="Profile" description="Your account details." />
      <Card className="p-6">
        <form action={updateProfile} className="space-y-4">
          <label className="block">
            <div className="text-sm font-medium">Full name</div>
            <Input name="full_name" defaultValue={profile?.full_name ?? ""} placeholder="Your name" />
          </label>
          <label className="block">
            <div className="text-sm font-medium">Email</div>
            <Input defaultValue={profile?.email ?? ""} disabled />
            <div className="mt-1 text-xs text-muted-foreground">Email changes go through Supabase Auth.</div>
          </label>
          <Button type="submit">Save</Button>
        </form>
      </Card>
    </div>
  );
}
