import { injectable } from "inversify";
import "reflect-metadata";
import { IController, IGrblHandler } from "./types";
import { BaseGrblHandler } from "./BaseGrblHandler";

const GRBL_RX_BUF_SIZE = 128;

interface Callback {
  (err?: any): void;
}

type Nullable<T> = T | null;
class WaitHandle {
  private _resolve: Nullable<Callback>;
  private _reject: Nullable<Callback>;

  constructor(resolve: Callback, reject: Callback) {
    this._resolve = resolve;
    this._reject = reject;
  }

  private _reset() {
    this._resolve = null;
    this._reject = null;
  }

  resolve() {
    if (this._resolve) {
      this._resolve();
      this._reset();
    }
  }

  reject(err: Error) {
    if (this._reject) {
      this._reject(err);
      this._reset();
    }
  }
}

@injectable()
export class GrblController implements IController {
  private _socket!: WebSocket;
  private _isConnected: boolean;
  private _handler: IGrblHandler;
  private _fifo: string[];
  private _waitHandle: Nullable<WaitHandle>;

  constructor() {
    this._isConnected = false;
    this._handler = new BaseGrblHandler();
    this._fifo = [];
    this._waitHandle = null;
  }

  async connect(host: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUri = `ws://${host}:${port}/ws`;
      const socket = new WebSocket(wsUri);

      this._socket = socket;

      socket.onopen = () => {
        this._isConnected = true;
        this._handler.onConnected(this);
        resolve();
      };

      socket.onerror = () => {
        this._isConnected = false;
        this._handler.onConnectionError(this);
        reject();
      };

      socket.onmessage = (ev) => {
        let msg = ev.data as string;
        msg = msg.trim();
        const OK_TOKEN = "ok";
        const ERROR_TOKEN = "error:";
        const ALARM_TOKEN = "ALARM:";
        const GRBL_INIT_TOKEN = "Grbl ";
        if (msg.includes(OK_TOKEN)) {
          this._fifo.shift();
          this._waitHandle?.resolve();
          this._handler.onOk(this);
        } else if (msg.includes(ERROR_TOKEN)) {
          this._waitHandle?.reject(new Error(msg));
          this._handler.onError(this, msg);
        } else if (msg.includes(ALARM_TOKEN)) {
          this._waitHandle?.reject(new Error(msg));
          this._handler.onAlarm(this, msg);
        } else if (msg.startsWith("<")) {
          this._handler.onStatusReport(this, msg);
        } else if (msg.includes(GRBL_INIT_TOKEN)) {
          this._waitHandle?.reject(new Error("Unexpected reset"));
          this._handler.onGrblReset(this);
        } else {
          this._handler.onMessage(this, msg);
        }
      };

      socket.onclose = () => {
        this._isConnected = false;
        this._waitHandle?.reject(new Error("Unexpected connection error"));
        this._handler.onDisconnected(this);
        reject();
        socket.onclose = null;
        socket.onopen = null;
        socket.onerror = null;
        socket.onmessage = null;
      };
    });
  }

  private _raw_send(msg: string) {
    this._socket.send(msg);
  }

  private _send(msg: string) {
    let line = msg.trim().replace(/\s|\(.*\)/g, "");
    if (line.length === 0) {
      setTimeout(() => {
        this._handler.onOk(this);
      }, 0);
      return;
    }
    line = line + "\n";
    if (!this.canSend(line)) {
      throw new Error("Can't send msg. That will cause RX buffer overflow");
    }
    this._raw_send(line);
  }

  resetController() {
    this._fifo = [];
  }

  disconnect() {
    if (this._socket) {
      this._socket.close();
    }
  }

  sendReset() {
    this._raw_send("\x18");
  }

  sendReqStatus() {
    this._raw_send("?");
  }

  sendHold() {
    this._raw_send("!");
  }

  sendResume() {
    this._raw_send("~");
  }

  sendUnlock() {
    this._send("$X");
  }

  sendGCode(msg: string) {
    this._send(msg);
  }

  canSend(msg: string): boolean {
    const sentSoFar = this._fifo.reduce((prev, curr) => {
      return prev + curr.length;
    }, 0);
    return sentSoFar + msg.length <= GRBL_RX_BUF_SIZE;
  }

  writeableBytes(): number {
    const sentSoFar = this._fifo.reduce((prev, curr) => {
      return prev + curr.length;
    }, 0);
    return GRBL_RX_BUF_SIZE - sentSoFar;
  }

  setHandler(handler: IGrblHandler) {
    this._handler = handler;
  }

  async sendZeroCoordinates(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._waitHandle = new WaitHandle(resolve, reject);
      this._send("G92X0Y0Z0");
    });
  }
}
