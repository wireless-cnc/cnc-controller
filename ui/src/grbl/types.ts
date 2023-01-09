export interface IController {
  sendReset(): void;
  sendReqStatus(): void;
  sendHold(): void;
  sendResume(): void;
  sendUnlock(): void;
  sendGCode(msg: string): void;
  sendZeroCoordinates(): Promise<void>;
  canSend(msg: string): boolean;
  writeableBytes(): number;
}

export interface IGrblHandler {
  onConnected(controller: IController): void;
  onConnectionError(controller: IController): void;
  onDisconnected(controller: IController): void;
  onOk(controller: IController): void;
  onError(controller: IController, error: string): void;
  onAlarm(controller: IController, alarm: string): void;
  onStatusReport(controller: IController, status: string): void;
  onMessage(controller: IController, message: string): void;
  onWritable(controller: IController, writable_bytes: number): void;
  onGrblReset(controller: IController): void;
}

export enum InterruptReason {
  NONE,
  ERROR,
  ALARM,
  CONNECTION_ERROR,
  RESET,
}

export interface IGCodeWriter {
  ack(): void;
  pull(bytes: number): boolean;
  interrupt(reason: InterruptReason): void;
}
