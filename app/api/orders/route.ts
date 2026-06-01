import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { calculateOrderTotals } from "@/lib/orders/calculateOrder";
import { findInsufficientStock, nextStock } from "@/lib/inventory/stock";

interface OrderRequestItem {
  product_id: string;
  quantity: number;
}

export async function POST(req: Request) {
  const body = await req.json();
  const items: OrderRequestItem[] = body?.items ?? [];
  const contact = body?.contact ?? {};
  const address = body?.shipping_address ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }
  if (!contact.email || !contact.name) {
    return NextResponse.json(
      { error: "Contact name and email are required" },
      { status: 400 }
    );
  }

  const service = createServiceClient();

  // Load authoritative product data (price, weight, stock) from the DB.
  const ids = items.map((i) => i.product_id);
  const { data: products, error: prodErr } = await service
    .from("products")
    .select("id, name, brand, price, weight_grams, stock_quantity, image_url")
    .in("id", ids);

  if (prodErr) {
    return NextResponse.json({ error: prodErr.message }, { status: 500 });
  }

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  for (const item of items) {
    if (!byId.has(item.product_id)) {
      return NextResponse.json(
        { error: `Product ${item.product_id} no longer exists` },
        { status: 400 }
      );
    }
  }

  // Stock check.
  const short = findInsufficientStock(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return {
        product_id: i.product_id,
        name: p.name,
        requested: i.quantity,
        available: p.stock_quantity,
      };
    })
  );
  if (short.length > 0) {
    return NextResponse.json(
      {
        error: `Not enough stock for: ${short
          .map((s) => s.name)
          .join(", ")}`,
      },
      { status: 409 }
    );
  }

  // Server-authoritative totals (never trust client money).
  const totals = calculateOrderTotals(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return { price: p.price, weight_grams: p.weight_grams, quantity: i.quantity };
    })
  );

  // Optional logged-in user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Insert the order.
  const { data: order, error: orderErr } = await service
    .from("orders")
    .insert({
      user_id: user?.id ?? null,
      guest_email: contact.email,
      guest_phone: contact.phone ?? null,
      guest_name: contact.name,
      shipping_address: address,
      status: "pending",
      total_amount: totals.totalAmount,
      total_weight_grams: totals.totalWeightGrams,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return NextResponse.json(
      { error: orderErr?.message ?? "Could not create order" },
      { status: 500 }
    );
  }

  // 2. Insert order items.
  const { error: itemsErr } = await service.from("order_items").insert(
    items.map((i) => {
      const p = byId.get(i.product_id)!;
      return {
        order_id: order.id,
        product_id: i.product_id,
        quantity: i.quantity,
        price_at_purchase: p.price,
        product_snapshot: p,
      };
    })
  );
  if (itemsErr) {
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });
  }

  // 3. Decrement stock (sequential; floors at 0, updates in_stock).
  for (const item of items) {
    const p = byId.get(item.product_id)!;
    const remaining = nextStock(p.stock_quantity, item.quantity);
    await service
      .from("products")
      .update({ stock_quantity: remaining, in_stock: remaining > 0 })
      .eq("id", item.product_id);
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
