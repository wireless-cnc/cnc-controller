import { injectable, inject } from "inversify";
import "reflect-metadata";
import { MachineStateActions } from "@app/store";
import type { AppDispatch } from "@app/store";
import { BaseGrblHandler } from "./BaseGrblHandler";
import { IController } from "./types";
import { TYPES } from "@app/inversify.types";
const { setStatus, processStatusReport } = MachineStateActions;

const STATUS_QUERY_INTERVAL_MS = 700;

@injectable()
export class MachineStateHandler extends BaseGrblHandler {
  @inject(TYPES.AppDispatch) private _dispatch!: AppDispatch;
  private _statusReqTimerHandle!: number;

  constructor() {
    super();
  }

  onConnected(c: IController): void {
    this._dispatch(setStatus("Initial"));
    c.sendReset();
    this._statusReqTimerHandle = setInterval(() => {
      c.sendReqStatus();
    }, STATUS_QUERY_INTERVAL_MS);
  }

  onConnectionError(_: IController): void {
    this._dispatch(setStatus("Disconnected"));
    if (this._statusReqTimerHandle) {
      clearInterval(this._statusReqTimerHandle);
    }
  }

  onDisconnected(_: IController): void {
    this._dispatch(setStatus("Disconnected"));
    if (this._statusReqTimerHandle) {
      clearInterval(this._statusReqTimerHandle);
    }
  }

  onStatusReport(_: IController, report: string): void {
    this._dispatch(processStatusReport(report));
  }

  onMessage(_: IController, msg: string): void {
    console.log(msg);
  }
}
