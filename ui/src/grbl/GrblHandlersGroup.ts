import { injectable } from "inversify";
import "reflect-metadata";
import { IController, IGrblHandler } from "./types";

@injectable()
export class GrblHandlersGroup implements IGrblHandler {
  private _handlers: IGrblHandler[];
  constructor() {
    this._handlers = [];
  }

  addHandler(handler: IGrblHandler) {
    this._handlers.push(handler);
  }

  removeHandler(handler: IGrblHandler) {
    const index = this._handlers.indexOf(handler);
    if (index !== -1) {
      this._handlers = this._handlers.splice(index, 1);
    }
  }

  /**
   * TODO: avoid code duplication
   */
  onConnected(controller: IController) {
    this._handlers.forEach((handler) => {
      handler.onConnected(controller);
    });
  }
  onConnectionError(controller: IController) {
    this._handlers.forEach((handler) => {
      handler.onConnectionError(controller);
    });
  }
  onDisconnected(controller: IController) {
    this._handlers.forEach((handler) => {
      handler.onDisconnected(controller);
    });
  }
  onOk(controller: IController) {
    this._handlers.forEach((handler) => {
      handler.onOk(controller);
    });
  }
  onError(controller: IController, error: string) {
    this._handlers.forEach((handler) => {
      handler.onError(controller, error);
    });
  }
  onAlarm(controller: IController, alarm: string) {
    this._handlers.forEach((handler) => {
      handler.onAlarm(controller, alarm);
    });
  }
  onStatusReport(controller: IController, status: string) {
    this._handlers.forEach((handler) => {
      handler.onStatusReport(controller, status);
    });
  }
  onMessage(controller: IController, message: string) {
    this._handlers.forEach((handler) => {
      handler.onMessage(controller, message);
    });
  }
  onWritable(controller: IController, _: number) {
    this._handlers.forEach((handler) => {
      handler.onWritable(controller, controller.writeableBytes());
    });
  }
  onGrblReset(controller: IController): void {
    this._handlers.forEach((handler) => {
      handler.onGrblReset(controller);
    });
  }
}
