import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/auth/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { deriveInStock } from "@/lib/inventory/stock";

export async function POST(req: Request) {
  const admin = await getAdminContext();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body?.name || !body?.brand || !body?.category_id) {
    return NextResponse.json(
      { error: "name, brand and category_id are required" },
      { status: 400 }
    );
  }

  const stockQuantity = Number(body.stock_quantity ?? 0);
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      name: body.name,
      brand: body.brand,
      category_id: body.category_id,
      weight_grams: Number(body.weight_grams ?? 0),
      weight_label: body.weight_label ?? "",
      unit_type: body.unit_type ?? "",
      price: Number(body.price ?? 0),
      description: body.description ?? "",
      image_url: body.image_url ?? "",
      slug: body.slug || null,
      stock_quantity: stockQuantity,
      in_stock: deriveInStock(stockQuantity, body.in_stock),
    })
    .select("*, category:categories(id, name, slug)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
