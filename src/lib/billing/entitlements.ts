import { createClient } from "@/lib/supabase/server";
import type { SubscriptionRow } from "@/lib/supabase/database.types";

export function subscriptionIsPro(sub: Pick<SubscriptionRow, "status" | "current_period_end"> | null | undefined): boolean {
  if (!sub) return false;
  if (sub.status !== "active" && sub.status !== "trialing") return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end).getTime() > Date.now();
}

export async function getCurrentUserIsPro(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  return subscriptionIsPro(data);
}

export async function getOwnedThemeIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("theme_purchases")
    .select("theme_id")
    .eq("user_id", userId);

  return (data ?? []).map((row) => row.theme_id);
}
