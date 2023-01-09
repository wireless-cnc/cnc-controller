import { injectable, inject } from "inversify";
import "reflect-metadata";
import { JobActions } from "@app/store";
import type { AppDispatch } from "@app/store";
import { BaseGrblHandler } from "./BaseGrblHandler";
import { IController, IGCodeWriter, InterruptReason } from "./types";
import { TYPES } from "@app/inversify.types";

@injectable()
export class JobStateHandler extends BaseGrblHandler {
  private _writer: IGCodeWriter | undefined;
  @inject(TYPES.AppDispatch) private _dispatch!: AppDispatch;

  constructor() {
    super();
  }

  setWriter(writer: IGCodeWriter | undefined) {
    this._writer = writer;
  }

  onOk(c: IController): void {
    this._writer?.ack();
    if (this._writer) {
      if (!this._writer.pull(c.writeableBytes())) {
        this._dispatch(JobActions.setStatus("Finishing"));
      }
    }
  }

  onError(_: IController, __: string): void {
    this._writer?.interrupt(InterruptReason.ERROR);
  }

  onDisconnected(_: IController): void {
    this._writer?.interrupt(InterruptReason.CONNECTION_ERROR);
  }

  onConnectionError(_: IController): void {
    this._writer?.interrupt(InterruptReason.CONNECTION_ERROR);
  }

  onAlarm(_: IController, __: string): void {
    this._writer?.interrupt(InterruptReason.ALARM);
  }

  onGrblReset(_: IController): void {
    this._writer?.interrupt(InterruptReason.RESET);
  }
}
