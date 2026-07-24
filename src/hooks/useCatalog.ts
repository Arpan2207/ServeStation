/**
 * Loads the POS catalog (categories + items) through the repository boundary.
 *
 * This is the async loading seam introduced in Phase 3, Step 5: the catalog now
 * comes from Supabase (or the mock adapter) over an async call, so the UI needs
 * explicit loading/error/empty handling instead of reading module-level data.
 *
 * The hook fetches categories and items in parallel on mount, exposes a
 * `reload` for retry, and returns the synchronous config values
 * (`defaultCategoryId`, `taxRate`) alongside the loaded data.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { menuRepository } from "@/repositories";
import type { MenuCategory, MenuItem } from "@/types/pos";

/** Data + status returned by {@link useCatalog}. */
export interface UseCatalog {
  categories: MenuCategory[];
  items: MenuItem[];
  /** Category selected on first mount (synthetic "popular" view). */
  defaultCategoryId: string;
  /** Flat tax rate applied to the cart subtotal. */
  taxRate: number;
  /** True while the initial (or a reload) fetch is in flight. */
  loading: boolean;
  /** Human-readable error message when the fetch failed, else null. */
  error: string | null;
  /** Re-run the catalog fetch (e.g. from a retry button). */
  reload: () => void;
}

/**
 * Fetch the POS catalog and track its loading/error state.
 * @returns The loaded categories/items plus config, status flags, and `reload`.
 */
export function useCatalog(): UseCatalog {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Guards against setting state after unmount / stale responses.
  const activeRequestId = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++activeRequestId.current;
    setLoading(true);
    setError(null);
    try {
      const [nextCategories, nextItems] = await Promise.all([
        menuRepository.getCategories(),
        menuRepository.getItems(),
      ]);
      // Ignore if a newer request superseded this one.
      if (requestId !== activeRequestId.current) return;
      setCategories(nextCategories);
      setItems(nextItems);
    } catch (err) {
      if (requestId !== activeRequestId.current) return;
      setError(err instanceof Error ? err.message : "Failed to load the menu.");
    } finally {
      if (requestId === activeRequestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Invalidate any in-flight request when the hook unmounts.
    return () => {
      activeRequestId.current += 1;
    };
  }, [load]);

  return {
    categories,
    items,
    defaultCategoryId: menuRepository.getDefaultCategoryId(),
    taxRate: menuRepository.getTaxRate(),
    loading,
    error,
    reload: load,
  };
}
