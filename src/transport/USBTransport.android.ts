/**
 * USBTransport — Android-only implementation wrapping react-native-usb-serial.
 * This file uses a platform-specific extension (.android.ts) so it is never
 * bundled on iOS or Web. The .ts stub (USBTransport.ts) is used on those
 * platforms and throws at runtime if somehow invoked.
 */
import UsbSerial from "react-native-usb-serial";
import { BehaviorSubject, Observable } from "rxjs";
import {
  OBDTransport,
  TransportConfig,
  ConnectionStatus,
  DEFAULT_USB_BAUD_RATE,
} from "./types";

export class USBTransport implements OBDTransport {
  private deviceId: number | null = null;
  private responseBuffer = "";
  private dataListeners: Set<(data: string) => void> = new Set();
  private statusSubject = new BehaviorSubject<ConnectionStatus>("disconnected");
  private pendingResponse: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;
  private dataSubscription: { remove(): void } | null = null;

  readonly status$: Observable<ConnectionStatus> =
    this.statusSubject.asObservable();

  async connect(config: TransportConfig): Promise<void> {
    if (config.type !== "usb") {
      throw new Error("USBTransport only accepts USB config");
    }

    this.statusSubject.next("connecting");

    try {
      const baudRate = config.baudRate ?? DEFAULT_USB_BAUD_RATE;
      await UsbSerial.open(config.deviceId, baudRate);
      this.deviceId = config.deviceId;

      this.dataSubscription = UsbSerial.onData((data: string) => {
        this.responseBuffer += data;
        this.dataListeners.forEach((fn) => fn(data));

        if (this.responseBuffer.includes(">")) {
          const response = this.responseBuffer;
          this.responseBuffer = "";
          this.pendingResponse?.resolve(response);
          this.pendingResponse = null;
        }
      });

      this.statusSubject.next("connected");
    } catch (err) {
      this.statusSubject.next("error");
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.dataSubscription?.remove();
    this.dataSubscription = null;

    if (this.deviceId !== null) {
      await UsbSerial.close(this.deviceId);
      this.deviceId = null;
    }
    this.statusSubject.next("disconnected");
  }

  async send(command: string): Promise<string> {
    if (this.deviceId === null) {
      throw new Error("Not connected");
    }

    const raw = command.endsWith("\r") ? command : `${command}\r`;

    return new Promise((resolve, reject) => {
      this.pendingResponse = { resolve, reject };
      this.responseBuffer = "";

      UsbSerial.write(this.deviceId!, raw).catch((err: Error) => {
        this.pendingResponse = null;
        reject(new Error(`USB write failed: ${err.message}`));
      });
    });
  }

  onData(callback: (data: string) => void): () => void {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }

  /** List currently connected USB serial devices (Android only). */
  static async listDevices(): Promise<
    Array<{ deviceId: number; deviceName: string; vendorId: number; productId: number }>
  > {
    return UsbSerial.list();
  }
}
