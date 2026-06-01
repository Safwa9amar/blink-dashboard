import { create } from "zustand";
import { persist } from "zustand/middleware";

// Editorial limits for news posts, set from Settings → News. Persisted to
// localStorage so they apply across the admin console; the compose/edit form and
// the rich editor read these to cap body images and body length.
export interface NewsSettingsState {
  maxBodyImages: number; // max <img> allowed in a post body
  maxBodyLength: number; // max characters per language in the body (plain text)
  setMaxBodyImages: (n: number) => void;
  setMaxBodyLength: (n: number) => void;
}

export const DEFAULT_MAX_BODY_IMAGES = 6;
export const DEFAULT_MAX_BODY_LENGTH = 5000;

export const useNewsSettingsStore = create<NewsSettingsState>()(
  persist(
    (set) => ({
      maxBodyImages: DEFAULT_MAX_BODY_IMAGES,
      maxBodyLength: DEFAULT_MAX_BODY_LENGTH,
      setMaxBodyImages: (n) => set({ maxBodyImages: Math.max(0, Math.floor(n) || 0) }),
      setMaxBodyLength: (n) => set({ maxBodyLength: Math.max(0, Math.floor(n) || 0) }),
    }),
    { name: "blink-news-settings" }
  )
);
