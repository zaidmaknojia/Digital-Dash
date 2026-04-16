import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { DecodedDTC } from "../obd2/DTCService";
import { DiagnosisResult } from "../ai/types";

const storage = new MMKV({ id: "session-store" });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

/** A single recorded snapshot of PID values at a point in time. */
export interface PIDSnapshot {
  timestampMs: number;
  values: Record<string, number>;
}

/** A complete diagnostic session. */
export interface DiagnosticSession {
  id: string;
  vehicleId: string;
  vehicleName: string;
  startedAt: number;
  endedAt: number | null;
  /** Rolling PID snapshots, max 24h window */
  pidSnapshots: PIDSnapshot[];
  /** DTCs present at session start */
  dtcsAtStart: DecodedDTC[];
  /** DTCs that were cleared during this session */
  dtcsCleared: DecodedDTC[];
  /** AI diagnosis results keyed by session sub-ID */
  diagnoses: Record<string, DiagnosisResult>;
}

const MAX_SNAPSHOT_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionState {
  /** Currently active session */
  activeSession: DiagnosticSession | null;
  /** All past sessions (most recent first) */
  sessions: DiagnosticSession[];

  // Actions
  startSession(vehicleId: string, vehicleName: string, dtcs: DecodedDTC[]): string;
  endSession(): void;
  addSnapshot(snapshot: PIDSnapshot): void;
  recordClearedDTCs(dtcs: DecodedDTC[]): void;
  saveDiagnosis(diagnosisId: string, result: DiagnosisResult): void;
  deleteSession(id: string): void;
  exportSessionJSON(id: string): string | null;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      sessions: [],

      startSession: (vehicleId, vehicleName, dtcs) => {
        const id = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const session: DiagnosticSession = {
          id,
          vehicleId,
          vehicleName,
          startedAt: Date.now(),
          endedAt: null,
          pidSnapshots: [],
          dtcsAtStart: dtcs,
          dtcsCleared: [],
          diagnoses: {},
        };
        set((state) => ({
          activeSession: session,
          sessions: [session, ...state.sessions].slice(0, 100), // keep last 100
        }));
        return id;
      },

      endSession: () =>
        set((state) => {
          if (!state.activeSession) return {};
          const ended = { ...state.activeSession, endedAt: Date.now() };
          return {
            activeSession: null,
            sessions: state.sessions.map((s) =>
              s.id === ended.id ? ended : s
            ),
          };
        }),

      addSnapshot: (snapshot) =>
        set((state) => {
          if (!state.activeSession) return {};
          const cutoff = Date.now() - MAX_SNAPSHOT_AGE_MS;
          const snapshots = [
            ...state.activeSession.pidSnapshots.filter(
              (s) => s.timestampMs > cutoff
            ),
            snapshot,
          ];
          const updated = { ...state.activeSession, pidSnapshots: snapshots };
          return {
            activeSession: updated,
            sessions: state.sessions.map((s) =>
              s.id === updated.id ? updated : s
            ),
          };
        }),

      recordClearedDTCs: (dtcs) =>
        set((state) => {
          if (!state.activeSession) return {};
          const updated = {
            ...state.activeSession,
            dtcsCleared: [...state.activeSession.dtcsCleared, ...dtcs],
          };
          return {
            activeSession: updated,
            sessions: state.sessions.map((s) =>
              s.id === updated.id ? updated : s
            ),
          };
        }),

      saveDiagnosis: (diagnosisId, result) =>
        set((state) => {
          if (!state.activeSession) return {};
          const updated = {
            ...state.activeSession,
            diagnoses: {
              ...state.activeSession.diagnoses,
              [diagnosisId]: result,
            },
          };
          return {
            activeSession: updated,
            sessions: state.sessions.map((s) =>
              s.id === updated.id ? updated : s
            ),
          };
        }),

      deleteSession: (id) =>
        set((state) => ({
          sessions: state.sessions.filter((s) => s.id !== id),
        })),

      exportSessionJSON: (id) => {
        const session = get().sessions.find((s) => s.id === id);
        return session ? JSON.stringify(session, null, 2) : null;
      },
    }),
    {
      name: "session-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
