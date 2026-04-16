import TcpSocket from "react-native-tcp-socket";
import { BehaviorSubject, Observable } from "rxjs";
import {
  OBDTransport,
  TransportConfig,
  ConnectionStatus,
  DEFAULT_WIFI_PORT,
} from "./types";

export class WiFiTransport implements OBDTransport {
  private socket: TcpSocket.Socket | null = null;
  private responseBuffer = "";
  private dataListeners: Set<(data: string) => void> = new Set();
  private statusSubject = new BehaviorSubject<ConnectionStatus>("disconnected");
  private pendingResponse: {
    resolve: (value: string) => void;
    reject: (reason: Error) => void;
  } | null = null;

  readonly status$: Observable<ConnectionStatus> =
    this.statusSubject.asObservable();

  async connect(config: TransportConfig): Promise<void> {
    if (config.type !== "wifi") {
      throw new Error("WiFiTransport only accepts WiFi config");
    }

    this.statusSubject.next("connecting");

    return new Promise((resolve, reject) => {
      const port = config.port ?? DEFAULT_WIFI_PORT;

      this.socket = TcpSocket.createConnection(
        { host: config.host, port },
        () => {
          this.statusSubject.next("connected");
          resolve();
        }
      );

      this.socket.on("data", (rawData: Buffer | string) => {
        const chunk =
          typeof rawData === "string"
            ? rawData
            : rawData.toString("utf-8");

        this.responseBuffer += chunk;
        this.dataListeners.forEach((fn) => fn(chunk));

        if (this.responseBuffer.includes(">")) {
          const response = this.responseBuffer;
          this.responseBuffer = "";
          this.pendingResponse?.resolve(response);
          this.pendingResponse = null;
        }
      });

      this.socket.on("error", (err: Error) => {
        this.statusSubject.next("error");
        this.pendingResponse?.reject(err);
        this.pendingResponse = null;
        reject(err);
      });

      this.socket.on("close", () => {
        this.statusSubject.next("disconnected");
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.statusSubject.next("disconnected");
  }

  async send(command: string): Promise<string> {
    if (!this.socket) {
      throw new Error("Not connected");
    }

    const raw = command.endsWith("\r") ? command : `${command}\r`;

    return new Promise((resolve, reject) => {
      this.pendingResponse = { resolve, reject };
      this.responseBuffer = "";
      this.socket!.write(raw, "utf-8", (err) => {
        if (err) {
          this.pendingResponse = null;
          reject(new Error(`TCP write failed: ${err.message}`));
        }
      });
    });
  }

  onData(callback: (data: string) => void): () => void {
    this.dataListeners.add(callback);
    return () => {
      this.dataListeners.delete(callback);
    };
  }
}
