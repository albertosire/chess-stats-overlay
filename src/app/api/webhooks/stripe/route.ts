import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { THEME_BUNDLE_ID, PAID_THEME_IDS } from "@/lib/themes";

export const runtime = "nodejs";

async function upsertSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  const admin = createAdminClient();
  const periodEnd =
    "current_period_end" in subscription && typeof subscription.current_period_end === "number"
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null;

  await admin.from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_price_id: subscription.items.data[0]?.price.id ?? null,
      status: subscription.status,
      current_period_end: periodEnd,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
}

async function unlockThemes(
  userId: string,
  themeId: string,
  session: Stripe.Checkout.Session,
) {
  const admin = createAdminClient();
  const amount = (session.amount_total ?? 0) / 100;
  const currency = (session.currency ?? "usd").toUpperCase();

  if (themeId === THEME_BUNDLE_ID || themeId === "bundle") {
    for (const id of [...PAID_THEME_IDS, THEME_BUNDLE_ID]) {
      await admin.from("theme_purchases").upsert(
        {
          user_id: userId,
          theme_id: id,
          stripe_session_id: `${session.id}:${id}`,
          amount_paid: amount,
          currency,
        },
        { onConflict: "user_id,theme_id" },
      );
    }
    return;
  }

  await admin.from("theme_purchases").upsert(
    {
      user_id: userId,
      theme_id: themeId,
      stripe_session_id: session.id,
      amount_paid: amount,
      currency,
    },
    { onConflict: "user_id,theme_id" },
  );
}

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook não configurado." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Assinatura inválida." },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId =
          session.metadata?.supabase_user_id || session.client_reference_id;
        if (!userId) break;

        const kind = session.metadata?.kind;
        if (kind === "pro" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            String(session.subscription),
          );
          await upsertSubscription(userId, subscription);
        }

        if (kind === "theme" || kind === "bundle") {
          const themeId =
            kind === "bundle"
              ? THEME_BUNDLE_ID
              : session.metadata?.theme_id || "";
          if (themeId) {
            await unlockThemes(userId, themeId, session);
          }
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;
        if (!userId) {
          // Fallback: find by stripe customer / subscription id
          const admin = createAdminClient();
          const { data } = await admin
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_subscription_id", subscription.id)
            .maybeSingle();
          if (data?.user_id) {
            await upsertSubscription(data.user_id, subscription);
          }
          break;
        }
        await upsertSubscription(userId, subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error", error);
    return NextResponse.json({ error: "Handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
