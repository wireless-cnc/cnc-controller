import { injectable } from "inversify";
import { IController, IGrblHandler } from "./types";

@injectable()
export class BaseGrblHandler implements IGrblHandler {
  onConnected(_: IController) {}
  onConnectionError(_: IController) {}
  onDisconnected(_: IController) {}
  onOk(_: IController) {}
  onError(_: IController, __: string) {}
  onAlarm(_: IController, __: string) {}
  onStatusReport(_: IController, __: string) {}
  onMessage(_: IController, __: string) {}
  onWritable(_: IController, __: number) {}
  onGrblReset(_: IController): void {}
}
