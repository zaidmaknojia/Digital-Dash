import {
  BleManager,
  Device,
  Characteristic,
  BleError,
  State,
} from "react-native-ble-plx";
import { BehaviorSubject, Observable } from "rxjs";
import {
  OBDTransport,
  TransportConfig,
  ConnectionStatus,
  DEFAULT_BLE_SERVICE_UUID,
  DEFAULT_BLE_CHARACTERISTIC_UUID,
} from "./types";

export class BLETransport implements OBDTransport {
  private manager: BleManager;
  private device: Device | null = null;
  private characteristic: Characteristic | null = null;
  private responseBuffer = "";
  private dataListeners: Set<(data: string) => void> = new Set();
  private statusSubject = new BehaviorSubject<ConnectionStatus>("disconnected");
  private characteristicSubscription: ReturnType<
    Characteristic["monitor"]
  > | null = null;
  // Pending send() resolve/reject — only one in-flight at a time (queue in ELM327 layer)
  private pendingResponse: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;

  readonly status$: Observable<ConnectionStatus> =
    this.statusSubject.asObservable();

  constructor() {
    this.manager = new BleManager();
  }

  async connect(config: TransportConfig): Promise<void> {
    if (config.type !== "ble") {
      throw new Error("BLETransport only accepts BLE config");
    }

    this.statusSubject.next("connecting");

    // Ensure BLE is powered on
    await this.waitForBLEPoweredOn();

    try {
      this.device = await this.manager.connectToDevice(config.deviceId, {
        requestMTU: 512,
      });
      await this.device.discoverAllServicesAndCharacteristics();

      const serviceUUID = config.serviceUUID || DEFAULT_BLE_SERVICE_UUID;
      const charUUID =
        config.characteristicUUID || DEFAULT_BLE_CHARACTERISTIC_UUID;

      const services = await this.device.services();
      const targetService = services.find(
        (s) =>
          s.uuid.toUpperCase() ===
          this.expandUUID(serviceUUID).toUpperCase()
      );

      if (!targetService) {
        // Fallback: try the alternate common UUID pair FFF0/FFF1
        const fallbackService = services.find(
          (s) => s.uuid.toUpperCase() === this.expandUUID("FFF0").toUpperCase()
        );
        if (!fallbackService) {
          throw new Error(
            `BLE service ${serviceUUID} not found on device. Available: ${services
              .map((s) => s.uuid)
              .join(", ")}`
          );
        }
        const fallbackChars = await fallbackService.characteristics();
        this.characteristic =
          fallbackChars.find(
            (c) =>
              c.uuid.toUpperCase() ===
              this.expandUUID("FFF1").toUpperCase()
          ) ?? null;
      } else {
        const characteristics = await targetService.characteristics();
        this.characteristic =
          characteristics.find(
            (c) =>
              c.uuid.toUpperCase() ===
              this.expandUUID(charUUID).toUpperCase()
          ) ?? null;
      }

      if (!this.characteristic) {
        throw new Error("Required BLE characteristic not found");
      }

      this.subscribeToNotifications();
      this.statusSubject.next("connected");
    } catch (err) {
      this.statusSubject.next("error");
      throw err;
    }
  }

  async disconnect(): Promise<void> {
    this.characteristicSubscription?.remove();
    this.characteristicSubscription = null;

    if (this.device) {
      await this.manager.cancelDeviceConnection(this.device.id);
      this.device = null;
      this.characteristic = null;
    }
    this.statusSubject.next("disconnected");
  }

  async send(command: string): Promise<string> {
    if (!this.characteristic || !this.device) {
      throw new Error("Not connected");
    }

    const raw = command.endsWith("\r") ? command : `${command}\r`;
    const encoded = Buffer.from(raw, "utf-8").toString("base64");

    return new Promise((resolve, reject) => {
      this.pendingResponse = { resolve, reject };
      this.responseBuffer = "";

      this.characteristic!.writeWithoutResponse(encoded).catch((err: BleError) => {
        this.pendingResponse = null;
        reject(new Error(`BLE write failed: ${err.message}`));
      });
    });
  }

  onData(callback: (data: string) => void): () => void {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }

  // ---------------------------------------------------------------------------
  // BLE device scanning helpers (used by connect screen)
  // ---------------------------------------------------------------------------

  async scanForDevices(
    onDevice: (device: Device) => void,
    timeoutMs = 10000
  ): Promise<void> {
    await this.waitForBLEPoweredOn();

    return new Promise((resolve, reject) => {
      this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          this.manager.stopDeviceScan();
          reject(new Error(error.message));
          return;
        }
        if (device) {
          onDevice(device);
        }
      });

      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve();
      }, timeoutMs);
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  destroy(): void {
    this.manager.destroy();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private subscribeToNotifications(): void {
    if (!this.characteristic) return;

    this.characteristicSubscription = this.characteristic.monitor(
      (error, char) => {
        if (error) {
          this.statusSubject.next("error");
          this.pendingResponse?.reject(
            new Error(`BLE notification error: ${error.message}`)
          );
          this.pendingResponse = null;
          return;
        }

        if (!char?.value) return;

        const chunk = Buffer.from(char.value, "base64").toString("utf-8");
        this.responseBuffer += chunk;

        // Notify raw data listeners
        this.dataListeners.forEach((fn) => fn(chunk));

        // ELM327 response is complete when the '>' prompt appears
        if (this.responseBuffer.includes(">")) {
          const response = this.responseBuffer;
          this.responseBuffer = "";
          this.pendingResponse?.resolve(response);
          this.pendingResponse = null;
        }
      }
    );
  }

  private waitForBLEPoweredOn(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sub = this.manager.onStateChange((state) => {
        if (state === State.PoweredOn) {
          sub.remove();
          resolve();
        } else if (
          state === State.PoweredOff ||
          state === State.Unauthorized
        ) {
          sub.remove();
          reject(new Error(`Bluetooth is ${state}. Please enable Bluetooth.`));
        }
      }, true);
    });
  }

  /**
   * Expand a short 4-char UUID (e.g. "FFE0") to a full 128-bit UUID string.
   * Many BLE stacks return full UUIDs even for 16-bit assigned numbers.
   */
  private expandUUID(short: string): string {
    if (short.length === 4) {
      return `0000${short}-0000-1000-8000-00805f9b34fb`;
    }
    return short;
  }
}
