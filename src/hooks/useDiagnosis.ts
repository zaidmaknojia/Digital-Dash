/**
 * useDiagnosis — runs an AI diagnosis and tracks progress/results.
 */

import { useState, useCallback } from "react";
import { aiService } from "../ai/AIService";
import { DiagnosisContext, DiagnosisResult } from "../ai/types";
import { useVehicleStore } from "../store/vehicleStore";
import { useDiagnosticsStore, snapshotPIDValues } from "../store/diagnosticsStore";
import { useSessionStore } from "../store/sessionStore";

export type DiagnosisStatus = "idle" | "running" | "done" | "error";

export function useDiagnosis() {
  const [status, setStatus] = useState<DiagnosisStatus>("idle");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [streamText, setStreamText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { activeVehicle } = useVehicleStore();
  const { storedDTCs, pendingDTCs, permanentDTCs } = useDiagnosticsStore();
  const { saveDiagnosis, activeSession } = useSessionStore();

  const run = useCallback(
    async (userDescription?: string) => {
      if (!activeVehicle) {
        setError("No vehicle selected. Configure a vehicle in Settings.");
        return;
      }

      setStatus("running");
      setStreamText("");
      setError(null);
      setResult(null);

      const context: DiagnosisContext = {
        vehicle: {
          vin: activeVehicle.vin,
          year: activeVehicle.year,
          make: activeVehicle.make,
          model: activeVehicle.model,
          engine: activeVehicle.engine,
          mileage: activeVehicle.mileage,
        },
        dtcs: [
          ...storedDTCs.map((d) => ({
            code: d.code,
            type: d.type,
            description: d.description,
          })),
          ...pendingDTCs.map((d) => ({
            code: d.code,
            type: d.type,
            description: d.description,
          })),
          ...permanentDTCs.map((d) => ({
            code: d.code,
            type: d.type,
            description: d.description,
          })),
        ],
        pidSnapshot: snapshotPIDValues(),
        userDescription,
      };

      try {
        const diagnosisResult = await aiService.diagnose(context, (chunk) => {
          setStreamText((prev) => prev + chunk);
        });

        setResult(diagnosisResult);
        setStatus("done");

        // Persist to session history
        if (activeSession) {
          const diagnosisId = `diag-${Date.now()}`;
          saveDiagnosis(diagnosisId, diagnosisResult);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Diagnosis failed";
        setError(msg);
        setStatus("error");
      }
    },
    [
      activeVehicle,
      storedDTCs,
      pendingDTCs,
      permanentDTCs,
      activeSession,
      saveDiagnosis,
    ]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setStreamText("");
    setError(null);
  }, []);

  return {
    status,
    result,
    streamText,
    error,
    run,
    reset,
    isRunning: status === "running",
  };
}
