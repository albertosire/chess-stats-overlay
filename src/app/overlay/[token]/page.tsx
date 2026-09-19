import { Suspense } from "react";
import OverlayClient from "../OverlayClient";
import { resolveOverlayByToken } from "@/lib/providers/load-stats";
import { resolveEntitlements } from "@/lib/providers/types";
import { canUseTheme, getTheme } from "@/lib/themes";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function TokenOverlayPage({ params }: PageProps) {
  const { token } = await params;
  const overlay = await resolveOverlayByToken(token);

  if (!overlay) {
    return (
      <main className="p-4 text-red-300">
        Token OBS inválido ou não encontrado.
      </main>
    );
  }

  const entitlements = resolveEntitlements(overlay.is_pro, {
    show_delta_elo: overlay.config.show_delta_elo,
    show_winrate: overlay.config.show_winrate,
    show_streak: overlay.config.show_streak,
    active_theme_id: overlay.config.active_theme_id,
    custom_sponsor_logo_url: overlay.config.custom_sponsor_logo_url,
  });

  const themeAllowed = canUseTheme(
    overlay.config.active_theme_id,
    overlay.owned_themes ?? [],
    overlay.is_pro,
  );
  const theme = getTheme(themeAllowed ? overlay.config.active_theme_id : "default-dark");

  const dual =
    entitlements.allowDualProvider &&
    Boolean(overlay.config.secondary_provider) &&
    overlay.config.secondary_provider !== overlay.config.primary_provider;

  return (
    <Suspense
      fallback={
        <main className="p-4 text-white">Carregando overlay…</main>
      }
    >
      <OverlayClient
        token={token}
        initialEntitlements={{
          ...entitlements,
          activeThemeId: theme.id,
        }}
        themeId={theme.id}
        primaryColor={entitlements.allowCustomTheme ? overlay.config.primary_color : undefined}
        accentColor={entitlements.allowCustomTheme ? overlay.config.accent_color : undefined}
        fontFamily={entitlements.allowCustomTheme ? overlay.config.font_family : undefined}
        sponsorLogoUrl={
          entitlements.allowSponsorLogo ? overlay.config.custom_sponsor_logo_url : null
        }
        displayName={overlay.config.display_name}
        refreshSeconds={overlay.config.refresh_seconds}
        dualProviders={dual}
        primaryProvider={overlay.config.primary_provider}
        secondaryProvider={overlay.config.secondary_provider}
        forcedPeriod={overlay.config.period_mode}
        forcedType={overlay.config.game_type}
      />
    </Suspense>
  );
}
