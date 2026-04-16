/**
 * useOBD — top-level hook for connection management.
 * Wraps TransportManager + ELM327 initialization.
 */

import { useCallback, useEffect, useRef } from "react";
import { transportManager } from "../transport/TransportManager";
import { elm327 } from "../elm327/ELM327";
import { useConnectionStore } from "../store/connectionStore";
import { AdapterProfile } from "../transport/types";

export function useOBD() {
  const { status, setStatus, setElm327Info, setLastError, activeProfile } =
    useConnectionStore();

  // Subscribe to transport status updates
  useEffect(() => {
    const sub = transportManager.connectionStatus$.subscribe((s) => {
      setStatus(s);
    });
    return () => sub.unsubscribe();
  }, [setStatus]);

  const connect = useCallback(
    async (profile: AdapterProfile) => {
      setLastError(null);
      setStatus("connecting");

      try {
        await transportManager.connectWithProfile(profile);

        // Run ELM327 init sequence
        const info = await elm327.initialize(
          profile.initDelayMs ?? 0,
          profile.customInitCommands ?? []
        );
        setElm327Info(info);
        setStatus("connected");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Connection failed";
        setLastError(msg);
        setStatus("error");
        throw err;
      }
    },
    [setLastError, setStatus, setElm327Info]
  );

  const disconnect = useCallback(async () => {
    await transportManager.disconnect();
    setElm327Info(null);
    setStatus("disconnected");
  }, [setElm327Info, setStatus]);

  return {
    status,
    isConnected: status === "connected",
    isConnecting: status === "connecting",
    connect,
    disconnect,
    activeProfile,
  };
}
