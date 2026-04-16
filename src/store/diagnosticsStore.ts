import { create } from "zustand";
import { MMKV } from "react-native-mmkv";
import { DecodedDTC } from "../obd2/DTCService";

const storage = new MMKV({ id: "diagnostics-store" });

export interface DiagnosticsState {
  /** Latest decoded PID values keyed by PID name */
  pidValues: Record<string, number>;
  /** Timestamp of last PID update */
  lastUpdatedAt: number | null;
  /** Current stored DTCs */
  storedDTCs: DecodedDTC[];
  /** Current pending DTCs */
  pendingDTCs: DecodedDTC[];
  /** Current permanent DTCs */
  permanentDTCs: DecodedDTC[];
  /** Whether a DTC read is in progress */
  isReadingDTCs: boolean;
  /** Whether a DTC clear is in progress */
  isClearingDTCs: boolean;

  // Actions
  updatePIDValue(name: string, value: number): void;
  updatePIDValues(values: Record<string, number>): void;
  setStoredDTCs(dtcs: DecodedDTC[]): void;
  setPendingDTCs(dtcs: DecodedDTC[]): void;
  setPermanentDTCs(dtcs: DecodedDTC[]): void;
  setIsReadingDTCs(reading: boolean): void;
  setIsClearingDTCs(clearing: boolean): void;
  clearAllDTCState(): void;
  reset(): void;
}

export const useDiagnosticsStore = create<DiagnosticsState>()((set) => ({
  pidValues: {},
  lastUpdatedAt: null,
  storedDTCs: [],
  pendingDTCs: [],
  permanentDTCs: [],
  isReadingDTCs: false,
  isClearingDTCs: false,

  updatePIDValue: (name, value) =>
    set((state) => ({
      pidValues: { ...state.pidValues, [name]: value },
      lastUpdatedAt: Date.now(),
    })),

  updatePIDValues: (values) =>
    set((state) => ({
      pidValues: { ...state.pidValues, ...values },
      lastUpdatedAt: Date.now(),
    })),

  setStoredDTCs: (dtcs) => set({ storedDTCs: dtcs }),
  setPendingDTCs: (dtcs) => set({ pendingDTCs: dtcs }),
  setPermanentDTCs: (dtcs) => set({ permanentDTCs: dtcs }),
  setIsReadingDTCs: (reading) => set({ isReadingDTCs: reading }),
  setIsClearingDTCs: (clearing) => set({ isClearingDTCs: clearing }),

  clearAllDTCState: () =>
    set({ storedDTCs: [], pendingDTCs: [], permanentDTCs: [] }),

  reset: () =>
    set({
      pidValues: {},
      lastUpdatedAt: null,
      storedDTCs: [],
      pendingDTCs: [],
      permanentDTCs: [],
    }),
}));

// ---------------------------------------------------------------------------
// Snapshot helpers (for session recording)
// ---------------------------------------------------------------------------

export function snapshotPIDValues(): Record<string, number> {
  return { ...useDiagnosticsStore.getState().pidValues };
}

/** Persist last snapshot to MMKV for fast restoration after app restart */
export function persistSnapshot(snapshot: Record<string, number>): void {
  storage.set("last-pid-snapshot", JSON.stringify(snapshot));
}

export function loadPersistedSnapshot(): Record<string, number> | null {
  const raw = storage.getString("last-pid-snapshot");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, number>;
  } catch {
    return null;
  }
}
