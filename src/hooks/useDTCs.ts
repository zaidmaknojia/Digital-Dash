/**
 * useDTCs — read and clear DTCs via DTCService, with store integration.
 */

import { useCallback } from "react";
import { dtcService, DecodedDTC } from "../obd2/DTCService";
import { useDiagnosticsStore } from "../store/diagnosticsStore";
import { useSessionStore } from "../store/sessionStore";
import { useConnectionStore } from "../store/connectionStore";
import { Alert } from "react-native";

export function useDTCs() {
  const {
    storedDTCs,
    pendingDTCs,
    permanentDTCs,
    isReadingDTCs,
    isClearingDTCs,
    setStoredDTCs,
    setPendingDTCs,
    setPermanentDTCs,
    setIsReadingDTCs,
    setIsClearingDTCs,
  } = useDiagnosticsStore();

  const { status } = useConnectionStore();
  const { recordClearedDTCs } = useSessionStore();

  const readDTCs = useCallback(async () => {
    if (status !== "connected") return;

    setIsReadingDTCs(true);
    try {
      const { stored, pending, permanent } = await dtcService.readAllDTCs();
      setStoredDTCs(stored);
      setPendingDTCs(pending);
      setPermanentDTCs(permanent);
    } finally {
      setIsReadingDTCs(false);
    }
  }, [
    status,
    setIsReadingDTCs,
    setStoredDTCs,
    setPendingDTCs,
    setPermanentDTCs,
  ]);

  const clearDTCs = useCallback(
    (onConfirmed?: () => void) => {
      if (status !== "connected") return;

      const allDTCs: DecodedDTC[] = [
        ...storedDTCs,
        ...pendingDTCs,
        ...permanentDTCs,
      ];

      Alert.alert(
        "Clear All Fault Codes",
        `This will clear ${allDTCs.length} fault code${
          allDTCs.length !== 1 ? "s" : ""
        } from the ECU. This cannot be undone.\n\nCodes to be cleared:\n${allDTCs
          .map((d) => d.code)
          .join(", ")}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Clear DTCs",
            style: "destructive",
            onPress: async () => {
              setIsClearingDTCs(true);
              try {
                // Log cleared codes to session history BEFORE clearing
                recordClearedDTCs(allDTCs);
                await dtcService.clearDTCs();
                // Re-read to confirm cleared
                await readDTCs();
                onConfirmed?.();
              } catch (err) {
                Alert.alert(
                  "Clear Failed",
                  err instanceof Error ? err.message : "Failed to clear DTCs"
                );
              } finally {
                setIsClearingDTCs(false);
              }
            },
          },
        ]
      );
    },
    [
      status,
      storedDTCs,
      pendingDTCs,
      permanentDTCs,
      setIsClearingDTCs,
      recordClearedDTCs,
      readDTCs,
    ]
  );

  const allDTCs = [...storedDTCs, ...pendingDTCs, ...permanentDTCs];

  return {
    storedDTCs,
    pendingDTCs,
    permanentDTCs,
    allDTCs,
    isReading: isReadingDTCs,
    isClearing: isClearingDTCs,
    readDTCs,
    clearDTCs,
    hasDTCs: allDTCs.length > 0,
  };
}
