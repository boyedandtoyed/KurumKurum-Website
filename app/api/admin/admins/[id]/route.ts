import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const service = createServiceClient();
  const { count } = await service
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("is_admin", true);

  if ((count ?? 0) <= 1) {
    return NextResponse.json(
      { error: "Cannot remove the last admin" },
      { status: 400 }
    );
  }

  const { error } = await service
    .from("profiles")
    .update({ is_admin: false })
    .eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
