/**
 * USBTransport stub for iOS and Web platforms.
 * USB serial is not supported on these platforms.
 * Metro will prefer USBTransport.android.ts on Android.
 */
import { Observable, EMPTY } from "rxjs";
import { OBDTransport, TransportConfig, ConnectionStatus } from "./types";

export class USBTransport implements OBDTransport {
  readonly status$: Observable<ConnectionStatus> = EMPTY;

  connect(_config: TransportConfig): Promise<void> {
    return Promise.reject(
      new Error("USB serial is not supported on this platform")
    );
  }

  disconnect(): Promise<void> {
    return Promise.resolve();
  }

  send(_command: string): Promise<string> {
    return Promise.reject(
      new Error("USB serial is not supported on this platform")
    );
  }

  onData(_callback: (data: string) => void): () => void {
    return () => {};
  }
}
