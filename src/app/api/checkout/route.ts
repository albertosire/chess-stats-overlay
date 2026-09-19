import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe, randomIntegrationSuffix, resolvePriceId, type CheckoutKind } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const body = (await request.json()) as {
      kind: CheckoutKind;
      currency?: "usd" | "brl";
      themeId?: string;
    };

    const kind = body.kind;
    const currency = body.currency ?? "brl";
    if (!kind || !["pro", "theme", "bundle"].includes(kind)) {
      return NextResponse.json({ error: "kind inválido." }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .single();

    const stripe = getStripe();
    let customerId = profile?.stripe_customer_id ?? undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || user.email || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const priceId = resolvePriceId(kind, currency, body.themeId);
    const origin = request.nextUrl.origin;
    const mode = kind === "pro" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create({
      mode,
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/dashboard?checkout=cancel`,
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        kind,
        theme_id: body.themeId ?? "",
      },
      ...(mode === "subscription"
        ? {
            subscription_data: {
              metadata: {
                supabase_user_id: user.id,
              },
            },
          }
        : {}),
      // integration_identifier supported on newer API versions — ignore if rejected
    });

    // Best-effort tag for analytics on supported API versions
    try {
      if ("integration_identifier" in (session as object)) {
        void randomIntegrationSuffix();
      }
    } catch {
      // ignore
    }

    if (!session.url) {
      return NextResponse.json({ error: "Checkout sem URL." }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro no checkout." },
      { status: 500 },
    );
  }
}
