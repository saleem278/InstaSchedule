import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Global active-brand selection, persisted to localStorage so the choice
 * survives reloads. This is the single source of truth other features
 * (projects, media, scheduler) should import to scope their queries to the
 * currently selected brand.
 *
 * Usage:
 *   const activeBrandId = useActiveBrandStore((s) => s.activeBrandId);
 *   const setActiveBrandId = useActiveBrandStore((s) => s.setActiveBrandId);
 *
 * State shape:
 *   { activeBrandId: string | null; setActiveBrandId: (id: string | null) => void }
 */
export interface ActiveBrandState {
  activeBrandId: string | null;
  setActiveBrandId: (brandId: string | null) => void;
}

export const useActiveBrandStore = create<ActiveBrandState>()(
  persist(
    (set) => ({
      activeBrandId: null,
      setActiveBrandId: (brandId) => set({ activeBrandId: brandId }),
    }),
    {
      name: 'instapost-active-brand',
    }
  )
);
