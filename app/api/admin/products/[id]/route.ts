import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveInStock } from "@/lib/inventory/stock";

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

  for (const field of [
    "name",
    "brand",
    "category_id",
    "weight_label",
    "unit_type",
    "description",
    "image_url",
    "slug",
  ]) {
    if (field in body) update[field] = body[field];
  }
  if ("weight_grams" in body) update.weight_grams = Number(body.weight_grams);
  if ("price" in body) update.price = Number(body.price);

  // Stock + in_stock are kept consistent: stock drives availability.
  if ("stock_quantity" in body) {
    const stock = Number(body.stock_quantity);
    update.stock_quantity = stock;
    update.in_stock = deriveInStock(stock, body.in_stock);
  } else if ("in_stock" in body) {
    update.in_stock = body.in_stock;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", params.id)
    .select("*, category:categories(id, name, slug)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
