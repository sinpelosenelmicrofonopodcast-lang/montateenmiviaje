"use client";

import { useEffect, useMemo } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function hasStringValue(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function OneSignalUserSync() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  useEffect(() => {
    if (!supabase || typeof window === "undefined") {
      return;
    }
    const client = supabase;

    const scopedWindow = window as Window & {
      OneSignalDeferred?: Array<(oneSignal: Record<string, unknown>) => void>;
    };

    async function syncUser() {
      const auth = await client.auth.getUser();
      const user = auth.data.user;

      scopedWindow.OneSignalDeferred = scopedWindow.OneSignalDeferred || [];
      scopedWindow.OneSignalDeferred.push(async (oneSignal) => {
        const loginFn = oneSignal.login as ((externalId: string) => Promise<void>) | undefined;
        const logoutFn = oneSignal.logout as (() => Promise<void>) | undefined;
        const legacySetExternalUserId = oneSignal.setExternalUserId as ((externalId: string) => Promise<void>) | undefined;

        if (!user?.id) {
          if (typeof logoutFn === "function") {
            await logoutFn();
          }
          return;
        }

        if (typeof loginFn === "function") {
          await loginFn(user.id);
          return;
        }

        if (typeof legacySetExternalUserId === "function") {
          await legacySetExternalUserId(user.id);
        }
      });
    }

    void syncUser();

    const {
      data: { subscription }
    } = client.auth.onAuthStateChange((_event, session) => {
      const userId = session?.user?.id;
      scopedWindow.OneSignalDeferred = scopedWindow.OneSignalDeferred || [];
      scopedWindow.OneSignalDeferred.push(async (oneSignal) => {
        const loginFn = oneSignal.login as ((externalId: string) => Promise<void>) | undefined;
        const logoutFn = oneSignal.logout as (() => Promise<void>) | undefined;
        const legacySetExternalUserId = oneSignal.setExternalUserId as ((externalId: string) => Promise<void>) | undefined;

        if (hasStringValue(userId)) {
          if (typeof loginFn === "function") {
            await loginFn(userId);
            return;
          }
          if (typeof legacySetExternalUserId === "function") {
            await legacySetExternalUserId(userId);
          }
          return;
        }

        if (typeof logoutFn === "function") {
          await logoutFn();
        }
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return null;
}
