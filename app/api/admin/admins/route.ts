import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { data: profiles, error } = await service
    .from("profiles")
    .select("id, full_name, created_at")
    .eq("is_admin", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach emails from auth.users.
  const { data: userList } = await service.auth.admin.listUsers();
  const emailById = new Map(
    (userList?.users ?? []).map((u) => [u.id, u.email ?? ""])
  );

  const admins = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    created_at: p.created_at,
    email: emailById.get(p.id) ?? "",
  }));

  return NextResponse.json({ admins });
}

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const service = createServiceClient();
  const { data: userList } = await service.auth.admin.listUsers();
  const target = (userList?.users ?? []).find(
    (u) => u.email?.toLowerCase() === String(email).toLowerCase()
  );
  if (!target) {
    return NextResponse.json(
      { error: "No registered user with that email" },
      { status: 404 }
    );
  }

  const { error } = await service
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", target.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
