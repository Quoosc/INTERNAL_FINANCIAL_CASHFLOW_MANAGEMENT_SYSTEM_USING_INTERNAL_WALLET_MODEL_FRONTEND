"use client";

import { useEffect, useRef } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { useAuth } from "@/contexts/auth-context";
import { useWallet } from "@/contexts/wallet-context";
import { getUnreadCount } from "@/lib/api";
import { getAccessToken } from "@/lib/api-client";
import {
  NotificationEvent,
  TransactionCreatedEvent,
  WalletUpdatedEvent,
} from "@/types";

const USER_STREAM_URL = "/api/v1/users/stream";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function useUserStream() {
  const { isAuthenticated, isLoading } = useAuth();
  const { fetchWallet, updateFromSse } = useWallet();
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    abortRef.current = controller;

    const resyncAfterOpen = async () => {
      await Promise.allSettled([
        fetchWallet(),
        getUnreadCount(),
      ]);
      window.dispatchEvent(new Event("notifications:changed"));
    };

    const pushTransactionEvent = (payload: TransactionCreatedEvent) => {
      window.dispatchEvent(
        new CustomEvent<TransactionCreatedEvent>("wallet:transaction-created", {
          detail: payload,
        }),
      );
    };

    const pushNotificationEvent = (payload: NotificationEvent) => {
      window.dispatchEvent(
        new CustomEvent<NotificationEvent>("notifications:new", {
          detail: payload,
        }),
      );
      window.dispatchEvent(new Event("notifications:changed"));
    };

    const handlePayload = (eventName: string, payload: unknown) => {
      if (!isObject(payload)) return;

      if (eventName === "wallet.updated") {
        updateFromSse(payload as unknown as WalletUpdatedEvent);
        return;
      }

      if (eventName === "transaction.created") {
        pushTransactionEvent(payload as unknown as TransactionCreatedEvent);
        return;
      }

      if (eventName === "notification") {
        pushNotificationEvent(payload as unknown as NotificationEvent);
      }
    };

    void fetchEventSource(USER_STREAM_URL, {
      method: "GET",
      signal: controller.signal,
      openWhenHidden: true,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      onopen: async (response) => {
        if (!response.ok) {
          throw new Error(`SSE connect failed (${response.status})`);
        }
        await resyncAfterOpen();
      },
      onmessage: (event) => {
        if (!event.data) return;
        if (event.event === "connected") return;

        try {
          const parsed = JSON.parse(event.data) as unknown;
          handlePayload(event.event ?? "", parsed);
        } catch {
          // Ignore malformed stream payloads.
        }
      },
      onclose: () => {
        if (!controller.signal.aborted) {
          throw new Error("SSE closed unexpectedly");
        }
      },
      onerror: (error) => {
        if (controller.signal.aborted) return;
        // Keep default auto-reconnect behavior from fetch-event-source.
        // Use debug level (hidden by default in devtools) to avoid repeating noise
        // from the normal retry cycle when the backend closes the SSE connection.
        console.debug("User stream error", error);
      },
    });

    return () => {
      controller.abort();
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    };
  }, [fetchWallet, isAuthenticated, isLoading, updateFromSse]);
}

