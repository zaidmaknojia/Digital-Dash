import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { ConnectionStatus, AdapterProfile } from "../transport/types";
import { ELM327Info } from "../elm327/ELM327";

const storage = new MMKV({ id: "connection-store" });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

export interface ConnectionState {
  /** Current transport layer connection status */
  status: ConnectionStatus;
  /** The active adapter profile (persisted) */
  activeProfile: AdapterProfile | null;
  /** Saved adapter profiles (persisted) */
  profiles: AdapterProfile[];
  /** ELM327 firmware info once connected */
  elm327Info: ELM327Info | null;
  /** Last connection error message */
  lastError: string | null;

  // Actions
  setStatus(status: ConnectionStatus): void;
  setActiveProfile(profile: AdapterProfile | null): void;
  addProfile(profile: AdapterProfile): void;
  updateProfile(id: string, updates: Partial<AdapterProfile>): void;
  removeProfile(id: string): void;
  setElm327Info(info: ELM327Info | null): void;
  setLastError(error: string | null): void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      status: "disconnected",
      activeProfile: null,
      profiles: [],
      elm327Info: null,
      lastError: null,

      setStatus: (status) => set({ status }),
      setActiveProfile: (profile) => set({ activeProfile: profile }),

      addProfile: (profile) =>
        set((state) => ({ profiles: [...state.profiles, profile] })),

      updateProfile: (id, updates) =>
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      removeProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfile:
            state.activeProfile?.id === id ? null : state.activeProfile,
        })),

      setElm327Info: (info) => set({ elm327Info: info }),
      setLastError: (error) => set({ lastError: error }),
    }),
    {
      name: "connection-store",
      storage: createJSONStorage(() => mmkvStorage),
      // Don't persist runtime state
      partialize: (state) => ({
        activeProfile: state.activeProfile,
        profiles: state.profiles,
      }),
    }
  )
);
