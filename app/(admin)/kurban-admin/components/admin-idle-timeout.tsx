"use client";

import { toast } from "@/components/ui/use-toast";
import { signOut, useSession } from "next-auth/react";
import { useCallback, useEffect, useRef } from "react";

/** Hareketsiz kalındığında oturum kapanmadan önce geçecek süre (3 saat) */
const IDLE_MS = 3 * 60 * 60 * 1000;

/** Kapanmadan önce uyarılar (kalan süre bu eşiğin altına düşünce, bir kez) */
const WARN_BEFORE_1_MS = 60 * 1000;
const WARN_BEFORE_2_MS = 5 * 60 * 1000;
const WARN_BEFORE_3_MS = 15 * 60 * 1000;

const TICK_MS = 10_000;
const ACTIVITY_THROTTLE_MS = 30_000;

function idleStorageKey(userId: string) {
  return `kurban-admin:last-activity:${userId}`;
}

function readLastActivity(userId: string): number {
  if (typeof window === "undefined") return Date.now();
  try {
    const raw = localStorage.getItem(idleStorageKey(userId));
    if (raw == null) return Date.now();
    const n = Number(raw);
    return Number.isFinite(n) ? n : Date.now();
  } catch {
    return Date.now();
  }
}

export function AdminIdleTimeout() {
  const { data: session, status } = useSession();
  const lastEmitRef = useRef(0);
  const lastActivityRef = useRef(Date.now());
  const warnedRef = useRef({ w3: false, w2: false, w1: false });

  const userId = session?.user?.id;
  const enabled = status === "authenticated" && !!userId;

  const bumpActivity = useCallback((uid: string) => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(idleStorageKey(uid), String(now));
    } catch {
      // ignore
    }
    warnedRef.current = { w3: false, w2: false, w1: false };
  }, []);

  const recordActivity = useCallback(() => {
    if (!userId) return;
    const now = Date.now();
    if (now - lastEmitRef.current < ACTIVITY_THROTTLE_MS) return;
    lastEmitRef.current = now;
    bumpActivity(userId);
  }, [userId, bumpActivity]);

  useEffect(() => {
    if (!enabled || !userId) return;
    lastActivityRef.current = readLastActivity(userId);
    warnedRef.current = { w3: false, w2: false, w1: false };
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled) return;

    const events: (keyof WindowEventMap)[] = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "wheel",
    ];

    for (const ev of events) {
      window.addEventListener(ev, recordActivity, { passive: true });
    }

    return () => {
      for (const ev of events) {
        window.removeEventListener(ev, recordActivity);
      }
    };
  }, [enabled, recordActivity]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const onStorage = (e: StorageEvent) => {
      if (e.key !== idleStorageKey(userId) || e.newValue == null) return;
      const n = Number(e.newValue);
      if (Number.isFinite(n)) {
        lastActivityRef.current = n;
        warnedRef.current = { w3: false, w2: false, w1: false };
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [enabled, userId]);

  useEffect(() => {
    if (!enabled || !userId) return;

    const id = window.setInterval(() => {
      const deadline = lastActivityRef.current + IDLE_MS;
      const remaining = deadline - Date.now();

      if (remaining <= 0) {
        try {
          localStorage.removeItem(idleStorageKey(userId));
        } catch {
          // ignore
        }
        void signOut({
          redirect: true,
          callbackUrl: `${window.location.origin}/giris`,
        });
        return;
      }

      if (remaining <= WARN_BEFORE_1_MS && !warnedRef.current.w1) {
        warnedRef.current.w1 = true;
        toast({
          title: "Oturum süresi doluyor",
          description:
            "Hareketsizlik nedeniyle 1 dakika içinde oturumunuz kapanacak.",
          variant: "destructive",
        });
      } else if (remaining <= WARN_BEFORE_2_MS && !warnedRef.current.w2) {
        warnedRef.current.w2 = true;
        toast({
          title: "Oturum süresi doluyor",
          description:
            "Hareketsizlik nedeniyle 5 dakika içinde oturumunuz kapanacak.",
        });
      } else if (remaining <= WARN_BEFORE_3_MS && !warnedRef.current.w3) {
        warnedRef.current.w3 = true;
        toast({
          title: "Oturum süresi doluyor",
          description:
            "Hareketsizlik nedeniyle 15 dakika içinde oturumunuz kapanacak.",
        });
      }
    }, TICK_MS);

    return () => clearInterval(id);
  }, [enabled, userId]);

  return null;
}
