"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { WalletResponse } from "@/types";
import { api } from "@/lib/api-client";

// =============================================================
// Wallet Context - Quản lý trạng thái ví thời gian thực
// Cập nhật: Wallet → WalletResponse, bỏ availableBalance (computed BE-side)
// =============================================================

interface WalletState {
  wallet: WalletResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  fetchWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  optimisticUpdate: (balanceChange: number) => void;
  /** Cập nhật wallet state từ WebSocket message */
  updateFromWS: (data: { balance: number; pendingBalance: number; debtBalance: number; version: number }) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    wallet: null,
    isLoading: false,
    error: null,
  });

  /**
   * Fetch wallet data từ backend
   * Endpoint: GET /api/v1/wallet
   */
  const fetchWallet = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get<WalletResponse>("/api/v1/wallet");
      setState({ wallet: response.data, isLoading: false, error: null });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch wallet",
      }));
    }
  }, []);

  /**
   * Refresh chỉ balance (lightweight hơn fetchWallet)
   */
  const refreshBalance = useCallback(async () => {
    try {
      const response = await api.get<WalletResponse>("/api/v1/wallet");
      setState((prev) => ({
        ...prev,
        wallet: response.data,
        error: null,
      }));
    } catch {
      // Silently fail on balance refresh
    }
  }, []);

  /**
   * Optimistic update - cập nhật UI trước khi server confirm
   * Dùng cho UX mượt khi deposit/withdraw
   */
  const optimisticUpdate = useCallback((balanceChange: number) => {
    setState((prev) => {
      if (!prev.wallet) return prev;
      return {
        ...prev,
        wallet: {
          ...prev.wallet,
          balance: prev.wallet.balance + balanceChange,
        },
      };
    });
  }, []);

  /**
   * Cập nhật từ WebSocket /user/queue/wallet message
   * Đảm bảo version mới hơn trước khi update
   */
  const updateFromWS = useCallback(
    (data: { balance: number; pendingBalance: number; debtBalance: number; version: number }) => {
      setState((prev) => {
        if (!prev.wallet) return prev;
        // Chỉ update nếu version mới hơn (Optimistic Lock)
        if (data.version <= prev.wallet.version) return prev;
        return {
          ...prev,
          wallet: {
            ...prev.wallet,
            balance: data.balance,
            pendingBalance: data.pendingBalance,
            debtBalance: data.debtBalance,
            version: data.version,
          },
        };
      });
    },
    []
  );

  return (
    <WalletContext.Provider
      value={{
        ...state,
        fetchWallet,
        refreshBalance,
        optimisticUpdate,
        updateFromWS,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

/**
 * Hook để truy cập wallet context
 * @example
 * const { wallet, fetchWallet, refreshBalance } = useWallet();
 * // Sau khi deposit thành công:
 * optimisticUpdate(+500000); // UI cập nhật ngay
 * await refreshBalance();    // Đồng bộ lại từ server
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
