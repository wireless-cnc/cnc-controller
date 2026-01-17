import { injectable, inject } from "inversify";
import "reflect-metadata";
import { BaseGrblHandler } from "./BaseGrblHandler";
import { IController } from "./types";
import { store } from "@app/store";
import type { AppDispatch } from "@app/store";
import { GrblSettingsActions } from "@app/store/grblSettingsSlice";
import { GRBL_SETTINGS_SLICE } from "@app/store/types";
import { TYPES } from "@app/inversify.types";

@injectable()
export class GrblSettingsHandler extends BaseGrblHandler {
  @inject(TYPES.AppDispatch) private _dispatch!: AppDispatch;
  private _receivedSettingsDuringFetch = false;

  onMessage(_: IController, message: string): void {
    if (!message.startsWith("$") || !message.includes("=")) {
      return;
    }
    const [id, rawValue] = message.split("=");
    if (!id || rawValue === undefined) {
      return;
    }
    const value = Number(rawValue);
    if (!Number.isFinite(value)) {
      return;
    }
    const state = store.getState();
    if (state[GRBL_SETTINGS_SLICE].fetchStatus === "loading") {
      this._receivedSettingsDuringFetch = true;
    }
    this._dispatch(GrblSettingsActions.receiveSetting({ id, value }));
  }

  onOk(_: IController): void {
    const state = store.getState();
    if (
      state[GRBL_SETTINGS_SLICE].fetchStatus === "loading" &&
      this._receivedSettingsDuringFetch
    ) {
      this._receivedSettingsDuringFetch = false;
      this._dispatch(GrblSettingsActions.finishFetch());
    }
    if (
      state[GRBL_SETTINGS_SLICE].saveStatus === "saving" &&
      state[GRBL_SETTINGS_SLICE].pendingSaveAcks > 0
    ) {
      this._dispatch(GrblSettingsActions.completeSaveAck());
    }
  }

  onError(_: IController, error: string): void {
    const state = store.getState();
    if (state[GRBL_SETTINGS_SLICE].fetchStatus === "loading") {
      this._dispatch(GrblSettingsActions.setFetchError(error));
      this._receivedSettingsDuringFetch = false;
    }
    if (state[GRBL_SETTINGS_SLICE].saveStatus === "saving") {
      this._dispatch(GrblSettingsActions.setSaveError(error));
    }
  }
}
