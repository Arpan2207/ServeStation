/**
 * State hook powering the Order Detail screen.
 *
 * Loads a single canonical order by id through the repository boundary
 * (Supabase or mock), maps it into the presentation view shape, and exposes the
 * two status actions available on an `open` order: mark it paid (→ Closed) or
 * cancel it (→ Closed). Both actions round-trip through the repository (the
 * Supabase adapter routes them through the guarded transition RPC) and refresh
 * the local order on success.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { canonicalOrderToView } from "@/mappers/orderMappers";
import type { Order as CanonicalOrder } from "@/domain/orders";
import { ordersRepository } from "@/repositories";
import type { Order as OrderView } from "@/types/orders";

/** Which status action (if any) is currently in flight. */
export type OrderDetailAction = "paid" | "cancel" | null;

/** Data + status returned by {@link useOrderDetail}. */
export interface UseOrderDetail {
  /** The resolved order in view shape, or null while loading / when missing. */
  order: OrderView | null;
  /** Canonical order (used for status-driven UI decisions), or null. */
  canonical: CanonicalOrder | null;
  /** True while the initial (or a reload) fetch is in flight. */
  loading: boolean;
  /** Error message from the load, if any. */
  error: string | null;
  /** Which status action is currently running, else null. */
  pendingAction: OrderDetailAction;
  /** Error message from the last status action, if any. */
  actionError: string | null;
  /** Mark the order paid (only valid for an `open` order). */
  markPaid: () => void;
  /** Cancel the order with a reason (only valid for an `open` order). */
  cancel: (reason?: string) => void;
  /** Re-fetch the order. */
  reload: () => void;
}

/**
 * Load and manage a single order's detail + status actions.
 * @param id The order id from the route param.
 * @returns The order view/canonical data, load state, and status-action handlers.
 */
export function useOrderDetail(id: string | undefined): UseOrderDetail {
  const [canonical, setCanonical] = useState<CanonicalOrder | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<OrderDetailAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const found = await ordersRepository.getCanonicalOrderById(id);
      if (requestId !== activeRequestId.current) return;
      setCanonical(found ?? null);
    } catch (err) {
      if (requestId !== activeRequestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to load the order.");
    } finally {
      if (requestId === activeRequestId.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
    return () => {
      activeRequestId.current += 1;
    };
  }, [load]);

  /** Run a status action, tracking its in-flight + error state. */
  const runAction = useCallback(
    async (action: Exclude<OrderDetailAction, null>, run: () => Promise<CanonicalOrder>) => {
      if (!id || pendingAction) return;
      setPendingAction(action);
      setActionError(null);
      try {
        const updated = await run();
        setCanonical(updated);
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to update the order."
        );
      } finally {
        setPendingAction(null);
      }
    },
    [id, pendingAction]
  );

  const markPaid = useCallback(() => {
    if (!id) return;
    void runAction("paid", () => ordersRepository.markOrderPaid(id));
  }, [id, runAction]);

  const cancel = useCallback(
    (reason?: string) => {
      if (!id) return;
      void runAction("cancel", () =>
        ordersRepository.cancelOrder(id, reason?.trim() || "Cancelled by staff")
      );
    },
    [id, runAction]
  );

  return {
    order: canonical ? canonicalOrderToView(canonical) : null,
    canonical,
    loading,
    error,
    pendingAction,
    actionError,
    markPaid,
    cancel,
    reload: load,
  };
}
