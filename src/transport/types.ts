import { Observable } from "rxjs";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type TransportConfig =
  | {
      type: "ble";
      deviceId: string;
      serviceUUID: string;
      characteristicUUID: string;
    }
  | { type: "wifi"; host: string; port: number }
  | { type: "usb"; deviceId: number; baudRate: number };

export interface OBDTransport {
  /** Establish a connection to the adapter. Resolves when connected. */
  connect(config: TransportConfig): Promise<void>;

  /** Tear down the connection cleanly. */
  disconnect(): Promise<void>;

  /**
   * Send a raw command string (e.g. "ATZ\r") and return the raw response.
   * Implementations must append \r if not already present.
   */
  send(command: string): Promise<string>;

  /**
   * Register a data listener. Returns an unsubscribe function.
   * Called for every raw data chunk received (before parsing).
   */
  onData(callback: (data: string) => void): () => void;

  /** Observable that emits on every connection status change. */
  status$: Observable<ConnectionStatus>;
}

/** Adapter profile — configurable per OBD2 adapter make/model. */
export interface AdapterProfile {
  id: string;
  name: string;
  type: "ble" | "wifi" | "usb";
  // BLE-specific
  bleServiceUUID?: string;
  bleCharacteristicUUID?: string;
  // WiFi-specific
  wifiHost?: string;
  wifiPort?: number;
  // USB-specific
  usbBaudRate?: number;
  // ELM327 quirks
  initDelayMs?: number;
  customInitCommands?: string[];
}

export const DEFAULT_BLE_SERVICE_UUID = "FFE0";
export const DEFAULT_BLE_CHARACTERISTIC_UUID = "FFE1";
export const DEFAULT_WIFI_PORT = 35000;
export const DEFAULT_USB_BAUD_RATE = 38400;
