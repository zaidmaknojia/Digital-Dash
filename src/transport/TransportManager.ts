import { Observable, BehaviorSubject } from "rxjs";
import { switchMap } from "rxjs/operators";
import {
  OBDTransport,
  TransportConfig,
  ConnectionStatus,
  AdapterProfile,
} from "./types";
import { BLETransport } from "./BLETransport";
import { WiFiTransport } from "./WiFiTransport";
import { USBTransport } from "./USBTransport";

/**
 * Singleton that owns the currently active OBD transport.
 * All protocol layers above (ELM327, OBD2) should interact exclusively
 * through TransportManager — never instantiate transports directly.
 */
class TransportManager {
  private static _instance: TransportManager | null = null;

  private _transport: OBDTransport | null = null;
  private _transportSubject = new BehaviorSubject<OBDTransport | null>(null);

  /** Emits the connection status of the active transport, or 'disconnected' when none. */
  readonly connectionStatus$: Observable<ConnectionStatus> =
    this._transportSubject.pipe(
      switchMap((t) => (t ? t.status$ : new BehaviorSubject<ConnectionStatus>("disconnected").asObservable()))
    );

  private constructor() {}

  static getInstance(): TransportManager {
    if (!TransportManager._instance) {
      TransportManager._instance = new TransportManager();
    }
    return TransportManager._instance;
  }

  get transport(): OBDTransport | null {
    return this._transport;
  }

  /**
   * Replace the active transport. Disconnects any existing connection first.
   */
  setTransport(transport: OBDTransport): void {
    if (this._transport) {
      this._transport.disconnect().catch(() => {});
    }
    this._transport = transport;
    this._transportSubject.next(transport);
  }

  /** Create and connect using an adapter profile. */
  async connectWithProfile(profile: AdapterProfile): Promise<void> {
    const transport = this.createTransportForProfile(profile);
    this.setTransport(transport);

    const config = this.buildConfigFromProfile(profile);
    await transport.connect(config);
  }

  /** Disconnect and clear the active transport. */
  async disconnect(): Promise<void> {
    if (this._transport) {
      await this._transport.disconnect();
      this._transport = null;
      this._transportSubject.next(null);
    }
  }

  /** Convenience: send a command on the active transport. */
  async send(command: string): Promise<string> {
    if (!this._transport) {
      throw new Error("No active transport. Connect first.");
    }
    return this._transport.send(command);
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private createTransportForProfile(profile: AdapterProfile): OBDTransport {
    switch (profile.type) {
      case "ble":
        return new BLETransport();
      case "wifi":
        return new WiFiTransport();
      case "usb":
        return new USBTransport();
      default:
        throw new Error(`Unknown transport type: ${(profile as AdapterProfile).type}`);
    }
  }

  private buildConfigFromProfile(profile: AdapterProfile): TransportConfig {
    switch (profile.type) {
      case "ble":
        if (!profile.bleServiceUUID) {
          throw new Error("BLE profile missing serviceUUID");
        }
        return {
          type: "ble",
          deviceId: profile.id,
          serviceUUID: profile.bleServiceUUID,
          characteristicUUID: profile.bleCharacteristicUUID ?? "FFE1",
        };
      case "wifi":
        if (!profile.wifiHost) {
          throw new Error("WiFi profile missing host");
        }
        return {
          type: "wifi",
          host: profile.wifiHost,
          port: profile.wifiPort ?? 35000,
        };
      case "usb":
        return {
          type: "usb",
          deviceId: Number(profile.id),
          baudRate: profile.usbBaudRate ?? 38400,
        };
    }
  }
}

export const transportManager = TransportManager.getInstance();
