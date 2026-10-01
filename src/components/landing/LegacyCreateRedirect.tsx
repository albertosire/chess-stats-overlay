"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LegacyCreateRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#configurator" || hash === "#create") {
      router.replace(href);
    }
  }, [href, router]);

  return null;
}
