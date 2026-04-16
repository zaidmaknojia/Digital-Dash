/**
 * usePIDs — starts/stops the polling engine and exposes live PID values.
 */

import { useEffect, useCallback } from "react";
import { pollingEngine, PollConfig } from "../obd2/PollingEngine";
import { useDiagnosticsStore } from "../store/diagnosticsStore";
import { useConnectionStore } from "../store/connectionStore";
import { DEFAULT_DASHBOARD_PIDS } from "../../constants/pids";

interface UsePIDsOptions {
  /** Override the default dashboard PIDs. */
  pids?: Record<string, number>;
  /** If false, polling won't start even when connected. Useful for custom screens. */
  autoStart?: boolean;
}

export function usePIDs(options: UsePIDsOptions = {}) {
  const { pids = DEFAULT_DASHBOARD_PIDS, autoStart = true } = options;
  const { status } = useConnectionStore();
  const pidValues = useDiagnosticsStore((s) => s.pidValues);
  const lastUpdatedAt = useDiagnosticsStore((s) => s.lastUpdatedAt);

  useEffect(() => {
    if (!autoStart) return;

    if (status === "connected") {
      const configs: PollConfig[] = Object.entries(pids).map(
        ([pidName, hz]) => ({ pidName, hz })
      );
      pollingEngine.configure(configs);
      pollingEngine.start();
    } else {
      pollingEngine.stop();
    }

    return () => {
      pollingEngine.stop();
    };
  }, [status, autoStart, pids]);

  const getPID = useCallback(
    (name: string): number | undefined => pidValues[name],
    [pidValues]
  );

  return {
    pidValues,
    lastUpdatedAt,
    getPID,
    isPolling: status === "connected",
  };
}
