"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function PwaRegister() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/mechanic") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, [pathname]);

  return null;
}
