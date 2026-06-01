import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

const STATUSES = ["pending", "processing", "shipped", "delivered"];

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", params.id);

  return NextResponse.json({ order, items: items ?? [] });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const update: Record<string, unknown> = {};
  if ("status" in body) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
  }
  if ("tracking_number" in body) {
    update.tracking_number = body.tracking_number || null;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update(update)
    .eq("id", params.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ order: data });
}
