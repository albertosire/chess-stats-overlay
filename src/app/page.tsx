import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n";

export default async function IndexPage() {
  const jar = await cookies();
  const saved = jar.get("chesstats-locale")?.value;
  redirect(isLocale(saved) ? `/${saved}` : "/en");
}
