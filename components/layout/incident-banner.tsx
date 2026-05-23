"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BannerState {
  incident_banner_enabled: boolean;
  incident_banner_message: string;
}

const POLL_INTERVAL_MS = 60_000;
const DIALOG_SEEN_KEY = "incident_banner_dialog_seen_hash";
const BAR_DISMISSED_KEY = "incident_banner_bar_dismissed_hash";

/** Arıza duyurusu yalnızca bu sayfalarda gösterilir */
const ALLOWED_PATHS = new Set(["/", "/onizleme/takip"]);

function hashMessage(msg: string): string {
  let h = 0;
  for (let i = 0; i < msg.length; i++) {
    h = (Math.imul(31, h) + msg.charCodeAt(i)) | 0;
  }
  return String(h);
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function IncidentBannerWrapper() {
  const pathname = usePathname();
  const isAllowedRoute = ALLOWED_PATHS.has(pathname);

  const [state, setState] = useState<BannerState | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [barVisible, setBarVisible] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyVisibility = useCallback((data: BannerState) => {
    if (!data.incident_banner_enabled || !data.incident_banner_message.trim()) {
      setDialogOpen(false);
      setBarVisible(false);
      return;
    }

    const msgHash = hashMessage(data.incident_banner_message);
    const dialogSeenHash = readStorage(DIALOG_SEEN_KEY);
    const barDismissedHash = readStorage(BAR_DISMISSED_KEY);

    if (dialogSeenHash !== msgHash) {
      setDialogOpen(true);
      setBarVisible(false);
      return;
    }

    setDialogOpen(false);
    setBarVisible(barDismissedHash !== msgHash);
  }, []);

  const fetchBanner = useCallback(async () => {
    if (!isAllowedRoute) return;
    try {
      const res = await fetch("/api/public/incident-banner", { cache: "no-store" });
      if (!res.ok) return;
      const data: BannerState = await res.json();
      setState(data);
      applyVisibility(data);
    } catch {
      /* ignore */
    }
  }, [isAllowedRoute, applyVisibility]);

  useEffect(() => {
    if (!isAllowedRoute) {
      setDialogOpen(false);
      setBarVisible(false);
      return;
    }

    fetchBanner();
    pollRef.current = setInterval(fetchBanner, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchBanner, isAllowedRoute]);

  function dismissDialog() {
    if (state?.incident_banner_message) {
      const hash = hashMessage(state.incident_banner_message);
      writeStorage(DIALOG_SEEN_KEY, hash);
    }
    setDialogOpen(false);
    setBarVisible(true);
  }

  function dismissBar() {
    if (state?.incident_banner_message) {
      const hash = hashMessage(state.incident_banner_message);
      writeStorage(BAR_DISMISSED_KEY, hash);
    }
    setBarVisible(false);
  }

  if (!isAllowedRoute) return null;

  const enabled = state?.incident_banner_enabled ?? false;
  const message = state?.incident_banner_message?.trim() ?? "";

  if (!enabled || !message) return null;

  return (
    <>
      {barVisible && !dialogOpen && (
        <div className="sticky top-0 z-[300] w-full bg-red-600 text-white shadow-md">
          <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium truncate sm:whitespace-normal sm:truncate-none">
              {message}
            </p>
            <button
              type="button"
              onClick={dismissBar}
              className="shrink-0 rounded p-0.5 hover:bg-red-700 transition-colors"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={dismissDialog}
        >
          <div
            className="relative bg-background rounded-xl shadow-2xl border-2 border-red-500 max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="text-base font-semibold mb-2">Teknik Duyuru</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={dismissDialog}>
                Tamam, anladım
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
